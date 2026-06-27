#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { ValkiryeServerlessStack } from "../lib/valkirye-serverless-stack";
import { DatabaseStack } from "../lib/database-stack";
import { AuthStack } from "../lib/auth-stack";
import { AdminProvisioningStack } from "../lib/admin-provision-stack";

const app = new cdk.App();

/**
 * All stacks deploy to eu-central-1 (Frankfurt) — GDPR data residency.
 * NFR-5.1: no personal data outside EU/EEA.
 *
 * Stack dependency order:
 *   DatabaseStack          (no deps — pure infra)
 *       ↓
 *   AuthStack              (no deps — pure Cognito)
 *       ↓
 *   AdminProvisioningStack (depends on AuthStack.userPool)
 *
 * LambdaStack and ApiStack are added in Slice 1 once NestJS app exists.
 */

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: "eu-central-1",
};
// T0.3 — single DynamoDB table for all entities (see docs/diagrams/D-02-erd.md)
const databaseStack = new DatabaseStack(app, "ValkyrieDatabaseStack", { env });

// T0.4 — Cognito User Pool + Admins group + app client
const authStack = new AuthStack(app, "ValkyrieAuthStack", { env });

// T0.5 — creates exactly one admin user from valkirye/admin-credentials secret
// PREREQUISITE: secret must exist in eu-central-1 before deploying this stack
// aws secretsmanager create-secret --name valkirye/admin-credentials
const adminProvisioningStack = new AdminProvisioningStack(
  app,
  "ValkyrieAdminProvisioningStack",
  {
    env,
    userPool: authStack.userPool,
    adminsGroupName: authStack.adminsGroupName,
  },
);

// Explicit dependency declarations — CloudFormation will deploy in this order
adminProvisioningStack.addDependency(authStack);
adminProvisioningStack.addDependency(databaseStack);

app.synth();

// new ValkiryeServerlessStack(app, "ValkiryeServerlessStack", {
//   /* If you don't specify 'env', this stack will be environment-agnostic.
//    * Account/Region-dependent features and context lookups will not work,
//    * but a single synthesized template can be deployed anywhere. */
//   /* Uncomment the next line to specialize this stack for the AWS Account
//    * and Region that are implied by the current CLI configuration. */
//   // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
//   /* Uncomment the next line if you know exactly what Account and Region you
//    * want to deploy the stack to. */
//   // env: { account: '123456789012', region: 'us-east-1' },
//   /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
// });
