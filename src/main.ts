import { SocketTasks } from '@serverless-dna/constructs';
import { App, Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { IntegrationHandlers } from './llm-tasks';
export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);


    const responderFunc = new NodejsFunction(this, 'llm-responder', {
      entry: `${__dirname}/llm-tasks.ts`,
      handler: IntegrationHandlers.llmResponder,
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(360),
    });
    new SocketTasks(this, 'llm-tasks', {
      taskFunctions: [
        {
          type: ['llm-responder'],
          func: responderFunc,
        },
      ],
    });
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