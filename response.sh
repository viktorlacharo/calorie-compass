curl -X POST "https://cognito-idp.eu-south-2.amazonaws.com/" \
  -H "Content-Type: application/x-amz-json-1.1" \
  -H "X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth" \
  -d '{
    "AuthFlow": "USER_PASSWORD_AUTH",
    "ClientId": "1joifova376ngpurjpbh8fhgbn",
    "AuthParameters": {
      "USERNAME": "tu-email-o-username",
      "PASSWORD": "tu-password"
    }
  }'
