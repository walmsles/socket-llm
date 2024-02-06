import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelCommandInput } from '@aws-sdk/client-bedrock-runtime';

const llmClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

export const llmResponderFunc = async (event: any): Promise<any> => {
  //log out the actual event coming in (for debug purposes)
  console.log(event);

  const input: InvokeModelCommandInput = {
    // InvokeModelRequest
    body: JSON.stringify({
      // prompt: `\n\nHuman: ${objectData.question}\n\nAssistant:`,
      prompt: `\n\nHuman: This is a friendly conversation between a human and an AI. 
      The AI is talkative and provides specific details from its context but limits it to 240 tokens.
      If the AI does not know the answer to a question, it truthfully says it does not know.
      
      \n\nAssistant: OK, got it, I'll be a talkative truthful AI assistant.
      
      \n\nHuman: Provide a detailed answer for, ${event.data.question}
      
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

export const llmStreamerFunc = async (event: any): Promise<void> => {
  console.log(event);
  throw new Error('Task Processing failed');
};

export enum IntegrationHandlers {
  llmResponder = 'llmResponderFunc',
  taskFail = 'llmStreamerFunc',
}