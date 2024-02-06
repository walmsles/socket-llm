# Socket LLM

This project uses the Serverless DNA Socket Tasks Level 3 construct.  It implements two (2) seperate tasks - llmResponder and llmStreamer.

- llmResponder - implements a straight LLM Api call which waits for the AWS Bedrock response.
- llmStreamer - implements a streaming response mechanism to return data.  This will return data sooner to the consumer enabling a more interactive style session.

The llmStreamer will post periodic data gathered from the Stream response to a FIFO SQS which is used by the streamHandler function to send back websocket messages for each response in the queue.  The llmStreame implementation will do some chunking of data so that the SQS Fifo queue interaction is not throttled by AWS since the stream response is quite harsh in the way it works.  This is a crude implementation which needs improving so will need to iterate over this to improve.

# Deploy to Your AWS Account

## Pre-requisites

To deploy this project you will require:

- An AWS Cloud Account
- AWS CLI installed and configured with valid credentials
- Node installed and working
- Current version of npm and yarn (1.x)
- AWS CDK installed 
- Your AWS Account to be bootstrapped for AWS CDK Deployments (see AWS CDK Documentation)

## Deploying to your account

```bash
$ yarn build
$ yarn deploy
```

Following deployment output will be displayed showing the Web Socket URL which can be used by a Web UI to connect to for sending and receiving messages.

# I Have My UI connected, Now What?

Once you have a Web Socket client connected you can use JSON message formats below to send to either the **llmResponder** task or **llmStreamer** task.

## llmResponder Task JSON

### Request

```json
{
    "action": "task-submit",
    "task": {
        "id": "000001",
        "type": "llm-responder",
        "data": {
            "question": "<insert question text here>"
        }
    }
}
```

### Response

The **body** of the response object is a JSON encoded string.  Use JSON.parse to get the response object.  **output.completion** will contain the full response.

```json
{
    "task_id": "000001",
    "status": "Success",
    "response": {
        "statusCode": 200,
        "body": "{\"output\":\"{\\\"completion\\\":\\\"<response appears here>\\\",\\\"stop_reason\\\":\\\"stop_sequence\\\",\\\"stop\\\":\\\"\\\\n\\\\nHuman:\\\"}\"}"
    }
}
```

## llmStreamer Task JSON

### Request
```json
{
    "action": "task-submit",
    "task": {
        "id": "000001",
        "type": "llm-streamer",
        "data": {
            "question": "<insert question text here>"
        }
    }
}
```

### Response

#### Partial Stream Response

```json
{
    "task_id": "000001",
    "status": "Success",
    "response": "<partial response here>"
}
```

#### Complete Stream Response (no more partials coming)

```json
{
    "task_id": "000001",
    "status": "Success",
    "response": {
        "statusCode": 200,
        "body": "{\"output\":\"Finished\"}"
    }
}
```


# General Disclaimer

This is an experimental Proof of Concept project and is not a complete, finished product.  It should be used to examine implementation details for interacting with AWS Bedrock LLM models (Claude V2) using either a complete API call response or streaming response.