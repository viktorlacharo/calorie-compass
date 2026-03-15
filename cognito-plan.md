He revisado la configuracion real del App Client de Cognito y no tengo habilitado `USER_PASSWORD_AUTH`. Las opciones visibles son SRP, refresh token auth y choice-based sign-in.
Quiero que cambies la implementacion para NO usar `USER_PASSWORD_AUTH`.
Prefiero que uses `USER_SRP_AUTH` o una integracion equivalente compatible con Cognito User Pools en Expo React Native.
Mantén:
- login integrado dentro de la app
- sin Hosted UI
- sin redirects
- sin signup
- persistencia de sesion
- refresh/logout
- interceptor de axios
Por favor, adapta el cliente al flujo SRP y actualiza cualquier parte que dependa de `USER_PASSWORD_AUTH`.
