import { Handler } from 'aws-lambda';
import CognitoIdentity, {
  ConfirmSignUpRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';

import { getMiddlewareAddedHandler } from './common/middleware';
import { ConfirmSignupEvent } from './common/types';
import { confirmSignupSchema } from './common/schema';

const cognitoIdentity = new CognitoIdentity();

const confirmSignup: Handler = async (event: ConfirmSignupEvent) => {
  const {
    body: { name, code },
  } = event;
  const confirmSignUpRequest: ConfirmSignUpRequest = {
    Username: name,
    ConfirmationCode: code,
    ClientId: process.env['COGNITO_CLIENT_ID'] || '',
  };
  try {
    await cognitoIdentity.confirmSignUp(confirmSignUpRequest).promise();
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ Message: error.code }),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify({ Message: 'Confirmation success' }),
  };
};

export const handler = getMiddlewareAddedHandler(confirmSignup, confirmSignupSchema);
