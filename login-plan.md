Quiero que implementes el flujo de autenticación integrado en cliente para esta app Expo React Native, usando Amazon Cognito User Pool, SIN Hosted UI y SIN navegador externo.
Contexto del proyecto:
- App móvil privada para 2 usuarios
- Expo + React Native + TypeScript estricto
- Ya usamos `@tanstack/react-query`
- Ya usamos `axios`
- La app ya está migrada en gran parte a un modelo query/service
- Existe una capa HTTP y de servicios lista para backend AWS
- La intención es hacer login nativo dentro de la app con email + password, obtener JWT y llamar luego a API Gateway protegido por Cognito
Objetivo:
Implementar autenticación cliente completa con Cognito User Pool:
- pantalla de login integrada
- persistencia de sesión
- restauración de sesión al abrir la app
- logout
- inyección automática del token en axios
- protección básica de rutas/pantallas
- sin signup público
- sin Hosted UI
- sin social login
- sin tocar backend AWS todavía más allá de preparar el cliente
Requisitos de implementación:
1. Usa TypeScript estricto
2. Mantén el estilo existente del proyecto
3. Evita sobreingeniería
4. Usa almacenamiento seguro para tokens/sesión
5. Integra la auth con el árbol actual de Expo Router
6. No rompas la arquitectura de TanStack Query y axios ya creada
7. Si necesitas nuevas dependencias, elige las mínimas razonables y explica por qué
8. Si debes elegir una estrategia, prefiero una solución práctica y estable para Expo/React Native
Decisión de producto:
- Login integrado en la app, NO Hosted UI
- Solo login/logout y recuperación futura, pero por ahora prioriza login y sesión persistente
- No hace falta sign up porque los usuarios los crearé yo manualmente en Cognito
Quiero que implementes, como mínimo:
- una pantalla de `login`
- un proveedor o capa de sesión mínima (`AuthProvider` o equivalente) si hace falta
- guardado seguro de tokens/sesión
- restauración de sesión al iniciar app
- estado `authenticated / unauthenticated / loading`
- interceptor de `axios` para adjuntar `Authorization: Bearer <token>`
- utilidad para obtener el usuario actual y el `sub` si está disponible
- logout
- protección de navegación para que las pantallas privadas no entren sin sesión
- configuración por entorno para Cognito:
  - `EXPO_PUBLIC_COGNITO_REGION`
  - `EXPO_PUBLIC_COGNITO_USER_POOL_ID`
  - `EXPO_PUBLIC_COGNITO_APP_CLIENT_ID`
  - mantener también `EXPO_PUBLIC_API_BASE_URL`
Qué espero que hagas:
1. Inspecciona el repo y entiende la estructura actual
2. Implementa el flujo completo
3. Reutiliza patrones existentes del proyecto
4. Añade solo lo necesario
5. Explica brevemente las decisiones
6. Ejecuta typecheck al final
7. Si hay algún punto no ideal, déjalo anotado claramente
Puntos importantes de AWS/Cognito:
- El login es contra Cognito User Pool
- No usar Hosted UI
- La app debe obtener tokens válidos para luego hablar con API Gateway
- El backend derivará el usuario desde el JWT, no desde datos enviados por cliente
- Si puedes extraer el `sub` desde el token o sesión, mejor
Sugerencia técnica preferida:
- Si consideras que `aws-amplify/auth` es la opción más estable/práctica para Expo RN, puedes usarla
- Si prefieres otra integración directa con Cognito User Pools y es más ligera/razonable, puedes elegirla, pero justifica la elección
- Guarda sesión de forma segura, por ejemplo con `expo-secure-store` si aplica
Entregables esperados:
- archivos creados/modificados
- breve explicación del flujo
- variables de entorno necesarias
- cómo probar login/logout
- resultado de `npx tsc --noEmit`
Muy importante:
- No implementes Hosted UI
- No implementes signup público
- No cambies la arquitectura de datos existente
- Mantén el código preparado para que luego API Gateway valide el JWT de Cognito
Si detectas tradeoffs, elige la opción más simple y robusta para esta app privada de dos usuarios.
