import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as cr from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

export interface AdminProvisioningStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  adminsGroupName: string;
}

/**
 * AdminProvisioningStack — creates exactly ONE admin (Asgard) user at
 * deploy time. This is the ONLY path to an admin account — there is no
 * self-service or API route that grants the Admins group (see D-02 Role
 * Model: "no self-service path to admin").
 *
 * PREREQUISITE — run this once, manually, BEFORE first deploy:
 *
 *   aws secretsmanager create-secret \
 *     --name valkyrie/admin-credentials \
 *     --secret-string '{"email":"you@example.com","password":"<strong-random-password>"}' \
 *     --region eu-central-1
 *
 * CDK only ever references this secret by NAME — the actual email/password
 * values are never read at synth time and never appear in the generated
 * CloudFormation template or git history. They are read by the custom
 * resource Lambda at deploy time, directly from Secrets Manager, over the
 * AWS API.
 * 
 * 1. You manually create the secret ONCE via AWS CLI (outside CDK):
   aws secretsmanager create-secret \
     --name valkyrie/admin-credentials \
     --secret-string '{"email":"you@example.com","password":"<strong-random-password>"}'

2. CDK references it by NAME only:
   secretsmanager.Secret.fromSecretNameV2(this, 'AdminSecret', 'valkyrie/admin-credentials')

3. The custom resource Lambda reads the secret value at deploy time
   and calls Cognito's AdminCreateUser API with it
 * 
 * 
 */
export class AdminProvisioningStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: AdminProvisioningStackProps,
  ) {
    super(scope, id, props);

    const adminSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "AdminCredentialsSecret",
      "valkyrie/admin-credentials",
    );

    // Step 1 — create the Cognito user, password supplied from the secret.
    // MessageAction: 'SUPPRESS' prevents Cognito's default "welcome" email,
    // since this is a deploy-time bootstrap action, not a real invitation.
    const createAdminUser = new cr.AwsCustomResource(this, "CreateAdminUser", {
      onCreate: {
        service: "CognitoIdentityServiceProvider",
        action: "adminCreateUser",
        parameters: {
          UserPoolId: props.userPool.userPoolId,
          Username: adminSecret.secretValueFromJson("email").unsafeUnwrap(),
          UserAttributes: [
            {
              Name: "email",
              Value: adminSecret.secretValueFromJson("email").unsafeUnwrap(),
            },
            { Name: "email_verified", Value: "true" },
          ],
          MessageAction: "SUPPRESS",
        },
        physicalResourceId: cr.PhysicalResourceId.of("ValkyrieAdminUser"),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [props.userPool.userPoolArn],
      }),
    });

    // Step 2 — set a permanent password (adminCreateUser sets a temporary
    // one by default, which would force a password-change flow we don't
    // want for a bootstrap account).
    const setAdminPassword = new cr.AwsCustomResource(
      this,
      "SetAdminPassword",
      {
        onCreate: {
          service: "CognitoIdentityServiceProvider",
          action: "adminSetUserPassword",
          parameters: {
            UserPoolId: props.userPool.userPoolId,
            Username: adminSecret.secretValueFromJson("email").unsafeUnwrap(),
            Password: adminSecret
              .secretValueFromJson("password")
              .unsafeUnwrap(),
            Permanent: true,
          },
          physicalResourceId: cr.PhysicalResourceId.of("ValkyrieAdminPassword"),
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: [props.userPool.userPoolArn],
        }),
      },
    );
    setAdminPassword.node.addDependency(createAdminUser);

    // Step 3 — add the user to the Admins group. This Cognito group
    // membership is the JWT claim (`cognito:groups`) that AdminGuard
    // checks — see D-02 Role Model.
    const addToAdminsGroup = new cr.AwsCustomResource(
      this,
      "AddToAdminsGroup",
      {
        onCreate: {
          service: "CognitoIdentityServiceProvider",
          action: "adminAddUserToGroup",
          parameters: {
            UserPoolId: props.userPool.userPoolId,
            Username: adminSecret.secretValueFromJson("email").unsafeUnwrap(),
            GroupName: props.adminsGroupName,
          },
          physicalResourceId: cr.PhysicalResourceId.of(
            "ValkyrieAdminGroupMembership",
          ),
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: [props.userPool.userPoolArn],
        }),
      },
    );
    addToAdminsGroup.node.addDependency(setAdminPassword);

    // Note: the corresponding MEMBER DynamoDB item (role='admin') is NOT
    // created here — that is a Slice 1 application-layer concern, written
    // once by an idempotent bootstrap script/use-case that runs after this
    // stack deploys, using the same admin email to look up the Cognito
    // user's `sub` and write the DynamoDB profile. Infrastructure stops
    // at "the Cognito identity exists"; application data is out of scope
    // for IaC.
  }
}
