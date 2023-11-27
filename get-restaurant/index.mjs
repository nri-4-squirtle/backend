import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tableName = "nri-4-squirtle-restaurant";

export const handler = async (event) => {
  const placeIds = event.multiValueQueryStringParameters?.placeId;

  if (!placeIds) {
    return {
      statusCode: 400,
      body: "クエリパラメータでplaceIdを指定してください。",
    };
  }

  const resBody = {};
  for (const placeId of placeIds) {
    let item = await (
      await dynamo.send(
        new GetCommand({
          TableName: tableName,
          Key: {
            placeId: placeId,
          },
        })
      )
    ).Item;

    // テーブルに飲食店が登録されていない場合
    if (!item) {
      item = {
        placeId: placeId,
        carNum: null,
        reputations: null,
      };

      await dynamo.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
        })
      );
    }

    resBody[placeId] = item;
  }

  return {
    statusCode: 200,
    body: JSON.stringify(resBody),
    headers: {
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
    },
  };
};
