# AI Backend Notes

Usa este archivo como contexto rapido para futuras sesiones de IA sobre el backend.

## Regla principal

- Todo el backend AWS se gestiona como IaC.
- No usar la consola de AWS para crear o editar infraestructura.
- Hacer cambios en `infra/` y desplegar con CDK.

## Infra actual

- Proyecto CDK: `infra/`
- Stack principal: `CalorieCompassBackendProd`
- Cuenta AWS: `651045361536`
- Region: `eu-south-2`

## Cognito

- Reutilizar el User Pool existente para no perder usuarios.
- User Pool ID: `eu-south-2_bPRMn2ad9`
- App Client ID: `1joifova376ngpurjpbh8fhgbn`
- No recrear Cognito salvo instruccion explicita del usuario.

## Backend desplegado

- API base URL: `https://jfd1wc60og.execute-api.eu-south-2.amazonaws.com`
- Tabla app: `calorie-compass-prod-app`
- Tabla barcode cache: `calorie-compass-prod-barcode-cache`

## Lambdas core

- Codigo en `infra/src/lambdas/`
- Endpoints actuales:
  - `GET /me`
  - `GET /foods`
  - `POST /foods`
  - `PUT /foods/{id}`
  - `GET /foods/barcode/{barcode}`
  - `GET /favorites`
  - `POST /favorites`
  - `GET /favorites/{id}`
  - `DELETE /favorites/{id}`

## Deploy

Desde `infra/`:

```bash
npm run deploy -- --require-approval never
npm run outputs
```

## Frontend config

- Archivo local generado: `.generated/backend.env`
- Archivo usado por Expo: `.env`
- Si cambia el API o Cognito, sincronizar ambos y `openapi/aws-api.yaml`.

## Scripts utiles

- Crear usuarios Cognito: `npm run users:create`
- Outputs del stack: `npm run outputs`

## Preferencias del proyecto

- Mantener TypeScript estricto.
- Mantener IAM de menor privilegio.
- Si hay cambios de DynamoDB con riesgo de reemplazo o perdida de datos, avisar antes.
- Para nuevas funcionalidades, generar tanto CDK como Lambda y dar el comando exacto de despliegue.
