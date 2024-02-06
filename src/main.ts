// eslint-disable-next-line import/no-extraneous-dependencies
import { SocketTasks } from '@serverless-dna/constructs';
import { App, Stack, StackProps, Duration } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Runtime, EventSourceMapping } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { IntegrationHandlers } from './llm-tasks';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const notifyQ = new Queue(this, 'notifyQ', {
      fifo: true,
      contentBasedDeduplication: true,
    });

    const responderFunc = new NodejsFunction(this, 'responder', {
      entry: `${__dirname}/llm-tasks.ts`,
      handler: IntegrationHandlers.llmResponder,
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(360),
    });
    const bedrockLLMPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['bedrock:InvokeModel'],
      resources: ['arn:aws:bedrock:us-west-2::foundation-model/*'],
    });
    responderFunc.addToRolePolicy(bedrockLLMPolicy);

    const streamerFunc = new NodejsFunction(this, 'streamer', {
      entry: `${__dirname}/llm-tasks.ts`,
      handler: IntegrationHandlers.llmStreamer,
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(360),
      environment: {
        NOTIFY_QUEUE: notifyQ.queueUrl,
      },
    });
    notifyQ.grantSendMessages(streamerFunc);

    const streamLLMPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['bedrock:InvokeModelWithResponseStream'],
      resources: ['arn:aws:bedrock:us-west-2::foundation-model/*'],
    });
    streamerFunc.addToRolePolicy(streamLLMPolicy);

    const sockTasks = new SocketTasks(this, 'llm-tasks', {
      taskFunctions: [
        {
          type: ['llm-responder'],
          func: responderFunc,
        },
        {
          type: ['llm-streamer'],
          func: streamerFunc,
        },
      ],
    });

    const socketApiPolicy = new iam.PolicyStatement({
      actions: ['execute-api:ManageConnections'],
      resources: [sockTasks.arnForExecuteApi()],
      effect: iam.Effect.ALLOW,
    });
    // Create Streamhandler for notifyQ
    const streamNotifyFunc = new NodejsFunction(this, 'streamNotify', {
      entry: `${__dirname}/streamHandler.ts`,
      handler: 'streamHandler',
      initialPolicy: [socketApiPolicy],
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(10),
      environment: {
        WEBSOCKET_API: sockTasks.socketCallbackUrl(),
      },
    });
    // Create SQS Event Source mapping for Notify Handler
    new EventSourceMapping(this, 'notify-source', {
      target: streamNotifyFunc,
      eventSourceArn: notifyQ.queueArn,
      reportBatchItemFailures: true,
    });
    notifyQ.grantConsumeMessages(streamNotifyFunc);

  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'socket-llm-dev', { env: devEnv });
// new MyStack(app, 'socket-llm-prod', { env: prodEnv });

app.synth();