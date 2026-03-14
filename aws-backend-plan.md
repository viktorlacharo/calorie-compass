# Plan detallado de backend AWS

## Objetivo

Montar un backend serverless barato, simple y seguro para una app privada de nutricion usada solo por dos personas. La arquitectura debe encajar con el frontend actual en Expo + TanStack Query y permitir sustituir el backend mock por AWS Lambda sin rehacer las pantallas.

## Resumen ejecutivo

- Para este caso, la arquitectura correcta es `Cognito + API Gateway HTTP API + Lambda + DynamoDB on-demand + S3`.
- La base de datos recomendada es `DynamoDB on-demand` porque no requiere capacidad provisionada, entra bien en una fase pequena y suele costar muy poco con dos usuarios.
- `Lambda` probablemente sera gratis o casi gratis al principio. La free tier incluye `1M invocaciones/mes` y `400,000 GB-seconds/mes`.
- `API Gateway HTTP API` es la opcion recomendada y mas barata frente a REST API.
- `Cognito` para dos usuarios es practicamente despreciable en coste. La free tier de Lite/Essentials cubre de sobra el caso.
- `S3` debe usarse solo para imagenes. No metas binarios en DynamoDB.
- El mayor riesgo de coste real no sera Lambda ni DynamoDB, sino `Gemini`, almacenamiento de fotos y errores de arquitectura como meter Lambdas en una VPC con NAT Gateway.

## Servicios AWS que necesitas

### 1. Amazon Cognito User Pool

Para autenticacion.

Crear:

- `1 User Pool`
- `1 App Client` para la app Expo
- `2 usuarios iniciales` creados manualmente

Configuracion recomendada:

- Desactivar sign-up publico
- Login con email + password
- MFA desactivado al principio si quieres simplicidad maxima
- Usar el `sub` de Cognito como identificador real del usuario en toda la app

Regla importante:

- Nunca confies en un `userId` enviado por la app.
- En Lambda, el usuario se identifica siempre por el `sub` del JWT validado por API Gateway/Cognito.

### 2. API Gateway HTTP API

Para exponer endpoints HTTP al frontend.

Crear:

- `1 HTTP API`
- `1 JWT Authorizer` conectado al User Pool de Cognito

Por que HTTP API y no REST API:

- Mas barato
- Mas simple
- Suficiente para una app movil privada como esta

### 3. AWS Lambda

Para logica de negocio, proxy con Gemini y generacion de URLs presignadas.

No necesitas una Lambda por pantalla. Mejor dividir por dominio.

Crear inicialmente:

- `core-api`
- `media-api`
- `ai-suggestions`
- `ai-label-scan`
- `ai-meal-analyze`
- opcional despues: `maintenance`

Configuracion recomendada:

- Runtime Node.js + TypeScript
- Arquitectura `arm64` si esta disponible
- Memoria baja/moderada al principio, por ejemplo `256 MB` o `512 MB`
- Sin Provisioned Concurrency
- Sin VPC salvo que sea estrictamente necesario

No metas Lambda en VPC sin necesidad:

- Puede obligarte a usar NAT Gateway
- NAT Gateway puede costar mas que todo el resto del backend junto

### 4. Amazon DynamoDB

Base de datos principal.

Modo recomendado:

- `On-demand`

Por que:

- No tienes que provisionar capacidad
- Escala sola
- Para dos usuarios el coste sera normalmente bajisimo
- Encaja muy bien con uso irregular y pequeno

Free tier relevante:

- `25 GB` de almacenamiento para tablas Standard

### 5. Amazon S3

Para fotos de platos y etiquetas.

Crear:

- `1 bucket privado`

Rutas sugeridas:

- `private/{userSub}/labels/...`
- `private/{userSub}/meals/...`
- `private/{userSub}/derived/...`

Reglas recomendadas:

- Bucket privado, nunca publico
- Upload mediante `presigned URLs`
- Misma region que Lambda/API/DynamoDB
- Lifecycle rules para borrar temporales

Uso recomendado:

- Fotos de etiqueta nutricional
- Fotos de platos
- Imagenes derivadas si algun dia generas thumbnails o procesados

No recomendado:

- No usar Transfer Acceleration
- No usar Multi-Region Access Points
- No usar replicacion multi-region

### 6. SSM Parameter Store

Para secretos y configuracion sensible.

Guardar aqui:

- API key de Gemini
- IDs/config de entorno si hace falta

Por que:

- Mas simple y barato que Secrets Manager para este caso

### 7. CloudWatch

Para logs y alertas.

Crear:

- Logs por Lambda
- Alarmas basicas para errores 5xx o errores de ejecucion

Consejo:

- No loguees payloads enormes, imagenes, ni respuestas completas del modelo

## Arquitectura recomendada

Frontend:

- Expo React Native
- TanStack Query
- Axios

Backend:

- Cognito para auth
- API Gateway HTTP API
- Lambdas por dominio
- DynamoDB on-demand
- S3 privado
- Gemini solo detras de Lambda

Flujo:

1. La app inicia sesion con Cognito
2. La app obtiene JWT
3. Axios llama a API Gateway con Bearer token
4. API Gateway valida JWT
5. Lambda extrae `sub`
6. Lambda opera solo sobre datos del usuario autenticado
7. Si hay imagen, se sube primero a S3 con presigned URL
8. Lambda lee de S3 y llama a Gemini si hace falta

## Diseno de base de datos en DynamoDB

### Recomendacion

Usar `1 sola tabla` al principio.

Nombre sugerido:

- `nutrition-app`

Claves:

- `PK`
- `SK`

Patron base:

- `PK = USER#{sub}`
- `SK = tipo de entidad + id + prefijos utiles`

### Items sugeridos

- Perfil:
  - `PK=USER#{sub}`
  - `SK=PROFILE`

- Settings:
  - `PK=USER#{sub}`
  - `SK=SETTINGS`

- Food:
  - `PK=USER#{sub}`
  - `SK=FOOD#{foodId}`

- Favorite:
  - `PK=USER#{sub}`
  - `SK=FAVORITE#{favoriteId}`

- Log entry:
  - `PK=USER#{sub}`
  - `SK=LOG#{yyyy-mm-dd}#ENTRY#{entryId}`

- Agregado diario:
  - `PK=USER#{sub}`
  - `SK=DAY#{yyyy-mm-dd}`

- Draft o resultado AI temporal:
  - `PK=USER#{sub}`
  - `SK=AI#{draftId}`

### Por que esta tabla unica tiene sentido

- Aislamiento total por usuario
- Casi todas las lecturas son `Query` sobre la particion de un usuario
- Evitas `Scan`
- Simplifica operacion y despliegue
- Para dos usuarios no necesitas separar tablas por entidad

### Reglas de modelado importantes

- En logs, guarda snapshot de nombre/macros del alimento o receta en el momento del registro
- No dependas de recalcular historico a partir de foods actuales
- Mantener un item `DAY#{date}` con agregados diarios te abarata dashboard e historial
- Usa TTL solo para drafts temporales AI o artefactos temporales, no para datos finales del usuario

## Lambdas recomendadas

### 1. `core-api`

Responsable de:

- foods CRUD
- favorites CRUD
- logs CRUD
- dashboard
- history
- settings

Endpoints sugeridos:

- `GET /foods`
- `GET /foods/{id}`
- `POST /foods`
- `PATCH /foods/{id}`
- `DELETE /foods/{id}`
- `GET /favorites`
- `GET /favorites/{id}`
- `POST /favorites`
- `PATCH /favorites/{id}`
- `DELETE /favorites/{id}`
- `GET /logs`
- `POST /logs`
- `PATCH /logs/{id}`
- `DELETE /logs/{id}`
- `GET /dashboard`
- `GET /history`
- `GET /settings`
- `PATCH /settings`

### 2. `media-api`

Responsable de:

- generar presigned URLs para subir fotos
- validar mime type y ruta de destino

Endpoint sugerido:

- `POST /uploads/presign`

### 3. `ai-suggestions`

Responsable de:

- sugerencias basadas solo en catalogo del usuario + favoritos + contexto del dia
- generacion de recipe drafts

Endpoints sugeridos:

- `POST /ai/suggestions`
- `POST /ai/recipe-drafts`

### 4. `ai-label-scan`

Responsable de:

- leer imagen de etiqueta desde S3
- llamar a Gemini
- devolver propuesta de alimento escaneado

Endpoint sugerido:

- `POST /ai/scan-label`

### 5. `ai-meal-analyze`

Responsable de:

- leer imagen del plato desde S3
- llamar a Gemini
- cruzar detecciones con el catalogo del usuario
- devolver items estimados y macros

Endpoint sugerido:

- `POST /ai/analyze-meal`

### 6. `maintenance` (opcional despues)

Responsable de:

- borrar imagenes temporales
- limpiar drafts expirados
- trabajos periodicos ligeros

## Integracion con Gemini

Principios:

- La app nunca ve la API key de Gemini
- Toda llamada pasa por Lambda
- La IA no debe ser fuente de verdad definitiva para macros persistidos sin confirmacion del usuario

Flujos:

### Suggestions

- Input: foods del usuario, favorites del usuario, contexto diario
- Lambda llama a Gemini o a una logica hibrida
- Devuelve solo sugerencias basadas en datos del usuario

### Label scan

- La app sube foto a S3
- `POST /ai/scan-label` con key/uri
- Lambda lee imagen
- Gemini extrae tabla nutricional
- Lambda devuelve draft editable

### Meal analyze

- La app sube foto a S3
- `POST /ai/analyze-meal`
- Lambda detecta componentes del plato
- Cruza con foods del usuario
- Devuelve propuesta editable

## Free tier y coste estimado

### Lambda

- Free tier: `1M requests/mes` + `400,000 GB-seconds/mes`
- Para dos usuarios, el CRUD normal seguramente costara `0` o casi `0`
- El coste depende mucho mas de tiempo de ejecucion y memoria que del numero de peticiones

### API Gateway HTTP API

- Free tier para nuevos clientes durante el periodo aplicable
- Aun fuera de free tier, para dos usuarios el coste deberia ser minimo

### DynamoDB

- `25 GB` gratis de almacenamiento
- On-demand ideal para evitar pagar capacidad ociosa
- Para dos usuarios, el coste deberia ser muy bajo

### Cognito

- Lite/Essentials tienen free tier generosa para muchisimos mas usuarios de los que necesitas
- Con 2 usuarios, deberia ser practicamente gratis

### S3

- Sin coste fijo
- Pagas por almacenamiento, requests y salida a internet
- Con pocas imagenes y lifecycle rules, coste bajo

### Donde probablemente gastarás mas dinero

- Gemini
- almacenar demasiadas fotos sin borrado
- errores de arquitectura como NAT Gateway o logs excesivos

## Lo mas barato y recomendable para esta app

- `API Gateway HTTP API` y no REST API
- `DynamoDB on-demand`
- `1 sola region`
- `1 sola tabla`
- `1 bucket S3 privado`
- Lambdas fuera de VPC
- `SSM Parameter Store` para secretos
- imagenes subidas directo a S3 con presigned URLs

## Plan de integracion por fases

### Fase 1. Base de infraestructura

Crear:

- AWS account
- 1 region principal
- Cognito User Pool
- App Client
- 2 usuarios manuales
- API Gateway HTTP API
- DynamoDB table
- S3 bucket privado
- SSM parameters

Objetivo:

- que la app pueda autenticarse y que exista la base del backend

### Fase 2. Backend core sin AI

Implementar:

- `core-api`
- CRUD de foods
- CRUD de favorites
- CRUD de logs
- dashboard e history

Objetivo:

- sustituir definitivamente mocks de datos persistentes por AWS real

### Fase 3. Upload de imagenes

Implementar:

- `media-api`
- presigned URLs
- subida de fotos a S3 desde la app
- lifecycle rules para temporales

Objetivo:

- no pasar imagenes por API Gateway/Lambda como payload grande

### Fase 4. AI real

Implementar:

- `ai-suggestions`
- `ai-label-scan`
- `ai-meal-analyze`

Objetivo:

- conectar Gemini manteniendo los contratos de frontend actuales

### Fase 5. Hardening

Implementar:

- alarmas CloudWatch
- logs estructurados
- validacion de inputs
- permisos IAM minimos
- backups/PITR si te compensa

Objetivo:

- tener una v1 estable y segura

## Que tienes que hacer tecnicamente en la app

### 1. Auth con Cognito

Necesitaras:

- integrar login/logout
- guardar token de forma segura
- enviar JWT en Axios

### 2. Axios interceptors

Debes preparar:

- `Authorization: Bearer <token>`
- renovacion o re-login cuando expire sesion

### 3. Configuracion por entorno

Variables utiles:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_AI_API_MODE=lambda`
- luego probablemente tambien configuracion de Cognito

### 4. Sustitucion de adapters mock por HTTP

Ya tienes la arquitectura bien encaminada:

- query hooks
- service layer
- cliente HTTP

Solo faltaria ir sustituyendo implementaciones por endpoints reales.

## Errores que debes evitar

- Usar email como clave principal en DB en lugar de `sub`
- Aceptar `userId` desde el cliente para autorizar
- Hacer `Scan` en DynamoDB
- Crear una tabla por entidad desde el inicio
- Meter imagenes en DynamoDB
- Exponer la API key de Gemini en la app
- No usar snapshots en logs historicos
- Usar REST API en vez de HTTP API para este caso
- Poner Lambdas en VPC sin necesidad
- Dejar fotos temporales para siempre en S3
- Crear demasiadas Lambdas demasiado pronto

## Checklist de recursos AWS a crear

### Imprescindible

- [ ] 1 AWS account
- [ ] 1 region principal
- [ ] 1 Cognito User Pool
- [ ] 1 Cognito App Client
- [ ] 2 usuarios creados manualmente
- [ ] 1 API Gateway HTTP API
- [ ] 1 JWT authorizer para Cognito
- [ ] 1 DynamoDB table `nutrition-app`
- [ ] 1 bucket S3 privado
- [ ] 1 ruta en Parameter Store para secretos
- [ ] IAM roles por Lambda

### Lambdas iniciales

- [ ] `core-api`
- [ ] `media-api`
- [ ] `ai-suggestions`
- [ ] `ai-label-scan`
- [ ] `ai-meal-analyze`

### Observabilidad minima

- [ ] logs en CloudWatch
- [ ] alarma de errores Lambda
- [ ] alarma de 5xx en API Gateway

## Mi recomendacion final

Para una app privada de dos personas:

- DynamoDB on-demand es la mejor opcion de base de datos
- Cognito tiene sentido y te evita construir auth
- HTTP API + Lambda es suficiente y barato
- S3 solo para imagenes, siempre con presigned uploads
- todo en una sola region
- sin VPC, sin NAT Gateway, sin microservicios innecesarios

Si haces esto asi, tendras una arquitectura muy razonable, barata y alineada con la app que ya estas construyendo.
