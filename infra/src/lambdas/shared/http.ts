import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

type JwtClaims = Record<string, string | number | boolean | string[]>;

type JwtEventLike = {
  requestContext?: {
    authorizer?: {
      jwt?: {
        claims?: JwtClaims;
      };
    };
  };
};

export function json(statusCode: number, body: unknown, headers?: Record<string, string>): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

export function getClaimString(claims: JwtClaims, key: string) {
  const value = claims[key];
  return typeof value === 'string' ? value : null;
}

export function getUserSub(event: JwtEventLike) {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  return claims ? getClaimString(claims, 'sub') : null;
}

export function getClaims(event: JwtEventLike) {
  return event.requestContext?.authorizer?.jwt?.claims ?? {};
}
