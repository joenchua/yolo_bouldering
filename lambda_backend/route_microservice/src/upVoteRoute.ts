import { Handler } from 'aws-lambda';
import DynamoDB, { AttributeValue, UpdateItemInput } from 'aws-sdk/clients/dynamodb';
import jwt_decode from 'jwt-decode';
import createError from 'http-errors';

import { getMiddlewareAddedHandler } from './common/middleware';
import { getItemFromRouteTable } from './common/db';
import { upvoteRouteSchema } from './common/schema';
import { UpvoteRouteEvent, JwtPayload } from './common/types';

const dynamoDb = new DynamoDB.DocumentClient();

const upvoteRoute: Handler = async (event: UpvoteRouteEvent) => {
  if (!process.env['ROUTE_TABLE_NAME']) {
    throw createError(500, 'Route table name is not set');
  }
  const {
    headers: { Authorization },
    body: { username: routeOwnerUsername, createdAt },
  } = event;

  const Item = await getItemFromRouteTable(routeOwnerUsername, createdAt);

  const { username } = (await jwt_decode(Authorization.split(' ')[1])) as JwtPayload;
  const { upvotes } = Item;
  if (!upvotes.includes(username)) {
    upvotes.push(username);
    const updateItemInput: UpdateItemInput = {
      TableName: process.env['ROUTE_TABLE_NAME'],
      Key: {
        username: routeOwnerUsername as AttributeValue,
        createdAt: createdAt as AttributeValue,
      },
      UpdateExpression: 'SET upvotes = :upvotes, voteCount = :voteCount',
      ExpressionAttributeValues: {
        ':upvotes': upvotes as AttributeValue,
        ':voteCount': upvotes.length as AttributeValue,
      },
    };
    try {
      await dynamoDb.update(updateItemInput).promise();
    } catch (error) {
      throw createError(500, 'Error updating item', error);
    }
  }
  return {
    statusCode: 200,
    body: JSON.stringify({ Message: 'Upvote route success' }),
  };
};

export const handler = getMiddlewareAddedHandler(upvoteRoute, upvoteRouteSchema);
