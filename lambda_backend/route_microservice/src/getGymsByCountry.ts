import { Handler } from 'aws-lambda';
import DynamoDB, { AttributeValue, QueryInput } from 'aws-sdk/clients/dynamodb';
import createError from 'http-errors';

import { getMiddlewareAddedHandler } from './common/middleware';
import { getGymsByCountrySchema } from './common/schema';
import { GetGymsByCountryEvent } from './common/types';

const dynamoDb = new DynamoDB.DocumentClient();

const getGymsByCountry: Handler = async (event: GetGymsByCountryEvent) => {
  if (!process.env['GYM_TABLE_NAME']) {
    throw createError(500, 'Gym table name is not set');
  }
  const {
    queryStringParameters: { countryCode },
  } = event;

  const queryInput: QueryInput = {
    TableName: process.env['GYM_TABLE_NAME'],
    ConsistentRead: false,
    KeyConditionExpression: 'countryCode = :countryCode',
    ExpressionAttributeValues: {
      ':countryCode': countryCode as AttributeValue,
    },
  };
  try {
    const { Items } = await dynamoDb.query(queryInput).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ Message: 'Query gyms success', Items }),
    };
  } catch (error) {
    throw createError(500, 'Error querying table', error);
  }
};

export const handler = getMiddlewareAddedHandler(getGymsByCountry, getGymsByCountrySchema);
