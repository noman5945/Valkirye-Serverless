import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cr from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

export interface AdminProvisioningStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  adminsGroupName: string;
}

/**
 * AdminProvisioningStack — creates exactly ONE admin (Asgard) user at
 * deploy time using a proper Lambda custom resource.
 *
 * PREREQUISITE — run this once before first deploy:
 *   aws secretsmanager create-secret \
 *     --name valkirye/admin-credentials \
 *     --secret-string "{\"email\":\"you@example.com\",\"password\":\"StrongP@ss1\"}" \
 *     --region eu-central-1 \
 *     --profile valkirye-app-dev
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
      "valkirye/admin-credentials",
    );

    // Lambda that reads the secret at runtime and creates the admin user
    const provisioningFn = new lambda.Function(this, "AdminProvisioningFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      timeout: cdk.Duration.minutes(5),
      code: lambda.Code.fromInline(`
const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminAddUserToGroupCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const https = require("https");
const url = require("url");

async function sendResponse(event, context, status, reason) {
  const body = JSON.stringify({ Status: status, Reason: reason, PhysicalResourceId: "ValkyrieAdminUser", StackId: event.StackId, RequestId: event.RequestId, LogicalResourceId: event.LogicalResourceId });
  const parsed = url.parse(event.ResponseURL);
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: parsed.hostname, port: 443, path: parsed.path, method: "PUT", headers: { "Content-Type": "", "Content-Length": body.length } }, resolve);
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

exports.handler = async (event, context) => {
  console.log("Event:", JSON.stringify(event));
  if (event.RequestType === "Delete" || event.RequestType === "Update") {
    await sendResponse(event, context, "SUCCESS", "No action on delete/update");
    return;
  }
  try {
    const sm = new SecretsManagerClient({ region: process.env.AWS_REGION });
    const secret = await sm.send(new GetSecretValueCommand({ SecretId: process.env.SECRET_NAME }));
    const { email, password } = JSON.parse(secret.SecretString);

    const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

    await cognito.send(new AdminCreateUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
      ],
      MessageAction: "SUPPRESS",
    }));

    await cognito.send(new AdminSetUserPasswordCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    }));

    await cognito.send(new AdminAddUserToGroupCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      GroupName: process.env.ADMINS_GROUP_NAME,
    }));

    console.log("Admin user created successfully:", email);
    await sendResponse(event, context, "SUCCESS", "Admin user created");
  } catch (err) {
    console.error("Error:", err);
    // UserNotFound means user already exists — treat as success (idempotent)
    if (err.name === "UsernameExistsException") {
      console.log("Admin user already exists — skipping");
      await sendResponse(event, context, "SUCCESS", "Admin user already exists");
    } else {
      await sendResponse(event, context, "FAILED", err.message || "Unknown error");
    }
  }
};
      `),
      environment: {
        USER_POOL_ID: props.userPool.userPoolId,
        ADMINS_GROUP_NAME: props.adminsGroupName,
        SECRET_NAME: "valkirye/admin-credentials",
      },
    });

    // Grant Lambda permission to read the secret
    adminSecret.grantRead(provisioningFn);

    // Grant Lambda permission to manage Cognito users
    provisioningFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminSetUserPassword",
          "cognito-idp:AdminAddUserToGroup",
        ],
        resources: [props.userPool.userPoolArn],
      }),
    );

    // Custom resource that triggers the Lambda on deploy
    const provider = new cr.Provider(this, "AdminProvisioningProvider", {
      onEventHandler: provisioningFn,
    });

    new cdk.CustomResource(this, "AdminProvisioningResource", {
      serviceToken: provider.serviceToken,
      properties: {
        // Changing this forces re-execution if you need to reprovision
        Version: "1",
      },
    });
  }
}
