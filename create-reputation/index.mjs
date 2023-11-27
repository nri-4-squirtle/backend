import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateItemCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tableName = "nri-4-squirtle-restaurant";

export const handler = async (event) => {
  if (!event.placeId || !event.carNum) {
    return {
      statusCode: 400,
      body: "ボディのカラムが不足しています。",
    };
  }

  const placeId = event.placeId;
  const carNum = event.carNum;
  const text = event.text || null;
  console.log(event.text);

  // 動作の確認はしていない状態です。
  await dynamo.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: {
        placeId: placeId,
      },
      UpdateExpression: `SET reputations = list_append(reputations, [{'carNum': ${carNum}, 'text': ${text}}])`,
    })
  );

  // TODO: reputations上の最頻値でcarNumカラムを書き換える。

  return {
    statusCode: 200,
    body: JSON.stringify({ result: "OK" }),
  };
};
