import { Handler } from 'aws-lambda';
import CognitoIdentity, {
  InitiateAuthRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';

import { getMiddlewareAddedHandler } from './common/middleware';
import { RefreshTokenEvent } from './common/types';
import { refreshTokenSchema } from './common/schema';

const cognitoIdentity = new CognitoIdentity();

const refreshToken: Handler = async (event: RefreshTokenEvent) => {
  const {
    body: { refreshToken },
  } = event;
  const initiateAuthRequest: InitiateAuthRequest = {
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
    ClientId: process.env['COGNITO_CLIENT_ID'] || '',
  };
  try {
    const { AuthenticationResult } = await cognitoIdentity
      .initiateAuth(initiateAuthRequest)
      .promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ Message: 'Refresh token success', ...AuthenticationResult }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ Message: error.code }),
    };
  }
};

export const handler = getMiddlewareAddedHandler(refreshToken, refreshTokenSchema);
