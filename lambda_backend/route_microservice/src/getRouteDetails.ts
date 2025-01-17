import { Handler } from 'aws-lambda';
import jwt_decode from 'jwt-decode';
import createError from 'http-errors';

import { getMiddlewareAddedHandler } from './common/middleware';
import { getItemFromRouteTable } from './common/db';
import { getRouteDetailsSchema } from './common/schema';
import { GetRouteDetailsEvent, JwtPayload } from './common/types';
import { restoreRouteURL } from './common/s3/utils';

const getRouteDetails: Handler = async (event: GetRouteDetailsEvent) => {
  if (!process.env['ROUTE_TABLE_NAME'] || !process.env['COGNITO_USERPOOL_ID']) {
    throw createError(500, 'Route table name or Cognito userpool is not set');
  }
  const {
    headers: { Authorization },
    body: { username: routeOwnerUsername, createdAt },
  } = event;

  const Item = await getItemFromRouteTable(routeOwnerUsername, createdAt);

  let hasVoted = false;
  let hasReported = false;
  let hasGraded = false;
  let graded = -1;
  const {
    ttl,
    routeName,
    gymLocation,
    countryCode,
    routeURL,
    ownerGrade,
    publicGrade,
    publicGradeSubmissions,
    voteCount,
    upvotes,
    reports,
    comments,
  } = Item;
  if (Authorization) {
    const { username } = (await jwt_decode(Authorization.split(' ')[1])) as JwtPayload;
    publicGradeSubmissions.forEach(({ username: name, grade }) => {
      if (name === username) {
        hasGraded = true;
        graded = grade;
      }
    });
    upvotes.forEach((name) => {
      if (name === username) {
        hasVoted = true;
      }
    });
    reports.forEach((name) => {
      if (name === username) {
        hasReported = true;
      }
    });
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      Message: 'Get route details success',
      Item: {
        username: routeOwnerUsername,
        createdAt,
        expiredTime: new Date(ttl).toISOString(),
        routeName,
        gymLocation,
        countryCode,
        routeURL: restoreRouteURL(routeURL),
        ownerGrade,
        publicGrade,
        voteCount,
        comments,
        hasVoted,
        hasReported,
        hasGraded,
        graded,
      },
    }),
  };
};

export const handler = getMiddlewareAddedHandler(getRouteDetails, getRouteDetailsSchema);
