import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { getClaimString, getClaims, json } from '../shared/http';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  const claims = getClaims(event);

  return json(200, {
    sub: getClaimString(claims, 'sub'),
    email: getClaimString(claims, 'email'),
    username: getClaimString(claims, 'cognito:username'),
    tokenUse: getClaimString(claims, 'token_use'),
  });
};
