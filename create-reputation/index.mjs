import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";

export const handler = async (event) => {
  const client = new DynamoDBClient({ region: "us-east-1" });
  const dynamo = DynamoDBDocumentClient.from(client);
  const tableName = "nri-4-squirtle-restaurant";
  const placeId = event.placeId;
  const carNum = event.carNum;
  const text = event.text || null;

  if (!event.placeId || !event.carNum) {
    return {
      statusCode: 400,
      body: "ボディのカラムが不足しています。",
    };
  }

  const newReputation = {
    carNum: carNum,
    dt: new Date().toISOString(),
    userId: "NULL",
    text: text,
  }; //項目追加

  const params = {
    TableName: tableName,
    Key: {
      placeId: placeId,
    },
    //UpdateExpression: 'SET #reputations = list_append(#reputations, :newReputation)',
    UpdateExpression:
      "SET #reputations = list_append(if_not_exists(#reputations, :emptyList), :newReputation)",
    ExpressionAttributeNames: {
      "#reputations": "reputations",
    },
    ExpressionAttributeValues: {
      ":newReputation": [newReputation], // 新しい項目をリストに追加
      ":emptyList": [],
    },
    ReturnValues: "UPDATED_NEW", // 更新後のアイテムを返す場合に使用
  };

  const response = await dynamo.send(new UpdateCommand(params));

  //最頻値を取得
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

  const reputations = item.reputations;
  console.log(reputations);

  // 各 carNum の出現回数をカウントするオブジェクトを作成
  const carNumCounts = {};
  reputations.forEach((reputation) => {
    const carNum = reputation.carNum;
    carNumCounts[carNum] = (carNumCounts[carNum] || 0) + 1;
  });

  // 最頻値を見つける
  let mostFrequentCarNum;
  let maxCount = 0;
  for (const carNum in carNumCounts) {
    if (carNumCounts[carNum] > maxCount) {
      mostFrequentCarNum = carNum;
      maxCount = carNumCounts[carNum];
    }
  }

  console.log("Most frequent carNum:", mostFrequentCarNum);

  //最頻値をcarNumに更新する
  let params1 = {
    TableName: tableName,
    Key: {
      placeId: placeId,
    },
    UpdateExpression: "SET #carNum = :carNum",
    ExpressionAttributeNames: {
      "#carNum": "carNum",
    },
    ExpressionAttributeValues: {
      ":carNum": mostFrequentCarNum, // 新しい項目をリストに追加
    },
    ReturnValues: "UPDATED_NEW", // 更新後のアイテムを返す場合に使用
  };

  await dynamo.send(new UpdateCommand(params1));

  return {
    statusCode: 200,
    body: JSON.stringify({ result: "OK" }),
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  };
};
