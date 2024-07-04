import { awscdk } from 'projen';
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.147.0',
  defaultReleaseBranch: 'main',
  name: 'socket-llm',
  projenrcTs: true,

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  deps: [
    '@serverless-dna/constructs@^0.0.11',
    '@aws-sdk/client-bedrock-runtime',
    '@aws-sdk/client-sqs',
    '@aws-sdk/client-apigatewaymanagementapi',
  ],
  gitignore: ['.idea'],
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();