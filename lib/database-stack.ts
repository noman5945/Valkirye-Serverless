import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

/**
 * DatabaseStack — provisions the single DynamoDB table backing all of
 * Valkirye's entities (Member, Contact, Conversation, Message,
 * InviteRequest, InviteToken, WsConnection).
 *
 * This is single-table design (see docs/diagrams/D-02-erd.md) — there is
 * intentionally only ONE dynamodb.Table resource here. Entities are not
 * separate IaC resources; they are distinguished entirely by PK/SK prefix
 * at the application layer (see each feature's *.repository.ts).
 *
 * Key schema reference (docs/diagrams/D-02-erd.md):
 *   Member          PK=USER#<userId>        SK=PROFILE              GSI1PK=EMAIL#<emailHash>
 *   Contact         PK=USER#<userId>        SK=CONTACT#<contactId>
 *   Conversation    PK=CONV#<convId>        SK=METADATA             GSI1PK=USER#<participant1Id>
 *   Message         PK=CONV#<convId>        SK=MSG#<timestamp>#<msgId>
 *   InviteRequest   PK=INVITE#<inviteId>    SK=REQUEST
 *   InviteToken     PK=TOKEN#<token>        SK=OTP
 *   WsConnection    PK=CONN#<connectionId>  SK=USER#<userId>
 */
export class DatabaseStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.table = new dynamodb.Table(this, "ValkyrieTable", {
      tableName: "valkyrie-main",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED, // NFR-1.5
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      }, // NFR-3.2
      timeToLiveAttribute: "ttl", // FR-2.6 — undelivered messages, WsConnection cleanup
      removalPolicy: cdk.RemovalPolicy.RETAIN, // never auto-delete — GDPR durability
    });

    // GSI1 — supports two access patterns:
    //   1. Member lookup by email hash (login, invite dedup check — FR-1.1)
    //   2. All conversations for a given user (conversation list — UC)
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Exposed for cross-stack reference — LambdaStack grants IAM read/write
    // and injects the table name as a Lambda environment variable.
    new cdk.CfnOutput(this, "TableName", {
      value: this.table.tableName,
      exportName: "ValkyrieTableName",
    });
  }
}
