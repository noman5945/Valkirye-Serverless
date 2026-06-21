import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

/**
 * AuthStack — Cognito User Pool and supporting auth infrastructure.
 *
 * Key decision: selfSignUpEnabled = false. This is the single line that
 * enforces the entire invitation-gated trust model (see EPIC-01, D-03).
 * Registration is ONLY possible via the custom /auth/register Lambda flow
 * (UC-01), which validates a Bifröst link + Rune before ever calling
 * Cognito's AdminCreateUser API. There is no public Cognito signup path.
 *
 * Admin provisioning is NOT done here — see AdminProvisioningStack.
 * This keeps AuthStack purely about the User Pool shape, and avoids a
 * circular dependency (AdminProvisioningStack depends on AuthStack's
 * userPool, not the other way around).
 */

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly adminsGroupName: string = "Admin";

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, "ValkyrieUserPool", {
      userPoolName: "valkyrie-users",
      selfSignUpEnabled: false, // <-- enforces invite-only registration, FR-1.1
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: false }, // FR-1.12: email immutable post-registration
      },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: false, // NFR-1.6 — matches SRS password policy exactly
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // never lose user pool accidentally
    });

    // FR-1.10/FR-1.11: the Admins group is the authorization source of
    // truth for AdminGuard — see docs/diagrams/D-02-erd.md Role Model.
    new cognito.CfnUserPoolGroup(this, "AdminsGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: this.adminsGroupName,
      description: "Platform admin (Asgard) — sole approver of invitations",
    });

    this.userPoolClient = this.userPool.addClient("ValkyrieAppClient", {
      authFlows: {
        userPassword: true, // required for the custom /auth/login Lambda flow
      },
      accessTokenValidity: cdk.Duration.hours(1), // FR-1.5
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30), // FR-1.6
      preventUserExistenceErrors: true, // mitigates user enumeration on login
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      exportName: "ValkyrieUserPoolId",
    });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      exportName: "ValkyrieUserPoolClientId",
    });
  }
}
