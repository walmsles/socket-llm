/* eslint-disable import/no-extraneous-dependencies */
import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelCommandInput, InvokeModelWithResponseStreamCommand, InvokeModelWithResponseStreamCommandInputType } from '@aws-sdk/client-bedrock-runtime';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const llmClient = new BedrockRuntimeClient({ region: 'us-west-2' });
const sqsClient = new SQSClient();

export const llmResponderFunc = async (event: any): Promise<any> => {
  //log out the actual event coming in (for debug purposes)
  console.log(event);

  const input: InvokeModelCommandInput = {
    // InvokeModelRequest
    body: JSON.stringify({
      // prompt: `\n\nHuman: ${objectData.question}\n\nAssistant:`,
      prompt: `\n\nHuman: This is a friendly conversation between a human and an AI. 
      The AI is talkative and provides specific details from its context but limits it to 1000 tokens.
      If the AI does not know the answer to a question, it truthfully says it does not know.
      
      \n\nAssistant: OK, got it, I'll be a talkative truthful AI assistant.
      
      \n\nHuman: Provide a detailed answer for, ${event.detail.question}
      
      \n\nAssistant:`,
      max_tokens_to_sample: 500,
      temperature: 0.5,
      top_p: 0.999,
      top_k: 250,
      anthropic_version: 'bedrock-2023-05-31',
    }),
    contentType: 'application/json',
    accept: '*/*',
    modelId: 'anthropic.claude-v2',
  };

  const invokeLLM = new InvokeModelCommand(input);
  const llResponse = await llmClient.send(invokeLLM);

  const answer = await new TextDecoder().decode(llResponse.body);

  const response = {
    output: answer,
  };

  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};

export const llmStreamerFunc = async (event: any): Promise<any> => {
  console.log(event);

  const input: InvokeModelWithResponseStreamCommandInputType = {
    // InvokeModelRequest
    body: JSON.stringify({
      // prompt: `\n\nHuman: ${objectData.question}\n\nAssistant:`,
      prompt: `\n\nHuman: This is a friendly conversation between a human and an AI. 
      The AI is talkative and provides specific details from its context but limits it to 1000 tokens.
      If the AI does not know the answer to a question, it truthfully says it does not know.
      
      \n\nAssistant: OK, got it, I'll be a talkative truthful AI assistant.
      
      \n\nHuman: Provide a detailed answer for, ${event.detail.question}
      
      \n\nAssistant:`,
      max_tokens_to_sample: 500,
      temperature: 0.5,
      top_p: 0.999,
      top_k: 250,
      anthropic_version: 'bedrock-2023-05-31',
    }),
    contentType: 'application/json',
    accept: '*/*',
    modelId: 'anthropic.claude-v2',
  };

  const invokeLLM = new InvokeModelWithResponseStreamCommand(input);
  const theStream = await llmClient.send(invokeLLM);

  const chunks = [];
  let buffSize = 0;

  if (theStream) {
    for await (const data of theStream.body ?? []) {
      if (data.chunk && data.chunk.bytes) {
        const chunk = JSON.parse(Buffer.from(data.chunk.bytes).toString('utf-8'));
        chunks.push(chunk.completion);
        buffSize = buffSize + 1;
        if (buffSize > 10) {
          const sqsCommand = new SendMessageCommand({
            QueueUrl: process.env.NOTIFY_QUEUE,
            MessageBody: JSON.stringify({
              source: event.source,
              data: chunks.join(''),
            }),
            MessageGroupId: event.source,
          });
          // push to SQS QUEUE
          try {
            const response = await sqsClient.send(sqsCommand);
            console.log(response);
          } catch (e) {
            console.log({
              error: e,
            });
          };
          chunks.length = 0;
          buffSize = 0;
        }
      } else if (
        data.internalServerException ||
        data.modelStreamErrorException ||
        data.throttlingException ||
        data.validationException
      ) {
        console.error(data);
        break;
      }
    };
  }

  const sqsCommand = new SendMessageCommand({
    QueueUrl: process.env.NOTIFY_QUEUE,
    MessageBody: JSON.stringify({
      source: event.source,
      data: chunks.join(''),
    }),
    MessageGroupId: event.source,
  });
  // push to SQS QUEUE
  try {
    const response = await sqsClient.send(sqsCommand);
    console.log(response);
  } catch (e) {
    console.log({
      error: e,
    });
  };
  console.log({
    prompt: event.detail.question,
    completion: chunks.join(''),
  });
  const response = {
    output: 'Finished',
  };

  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};


export enum IntegrationHandlers {
  llmResponder = 'llmResponderFunc',
  llmStreamer = 'llmStreamerFunc',
}