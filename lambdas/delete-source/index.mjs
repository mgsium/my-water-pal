import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
// import { unmarshall } from "@aws-sdk/util-dynamodb";

// AWS.config.update({ region: "eu-west-2" });

export const handler = async (event) => {
  const client = new DynamoDBClient({ apiVersion: "2024-09-07" });

  const { userid, sourceid } = JSON.parse(event.body);

  const params = {
    TableName: "waha-sources",
    Key: {
      userid: { S: userid },
      sourceid: { S: sourceid }
    }
  };
    
  const command = new DeleteItemCommand(params);
  const data = await client.send(command);

  const response = {
    statusCode: 200,
    body: JSON.stringify(data) // JSON.stringify('Hello from Lambda!'),
  };
  
  return response;
};
