import { DynamoDBClient, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { unmarshall } from "@aws-sdk/util-dynamodb";

// AWS.config.update({ region: "eu-west-2" });

export const handler = async (event) => {
  const client = new DynamoDBClient({ apiVersion: "2024-09-07" });

  const { userid, volume, source, name = "", description = "" } = JSON.parse(event.body);

  const params = {
    TableName: "waha-water-use-log",
    Item: {
      userid: { S: userid },
      logid: { S: uuidv4() },
      volume: { N: `${volume}` },
      source: { S: source },
      timestamp: { S: Date.now().toString() },
      name: { S: name },
      description: { S: description }
    }
  };
    
  const command = new PutItemCommand(params);
  const data = await client.send(command);

  const response = {
    statusCode: 200,
    body: JSON.stringify(data) // JSON.stringify('Hello from Lambda!'),
  };
  
  return response;
};
