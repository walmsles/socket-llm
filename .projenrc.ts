import { awscdk } from 'projen';
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  name: 'socket-llm',
  projenrcTs: true,

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  deps: [
    '@serverless-dna/constructs',
    '@aws-sdk/client-bedrock-runtime',
    '@aws-cdk/aws-apigatewayv2-alpha@^2.100.0-alpha.0',
    '@aws-cdk/aws-apigatewayv2-integrations-alpha@^2.100.0-alpha.0',
    '@aws-sdk/client-eventbridge',
    '@aws-sdk/client-sqs',
    '@aws-sdk/client-apigatewaymanagementapi',
  ],
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();