# Calorie Compass Infra

Infraestructura backend en AWS CDK v2 con TypeScript para el backend core.

## Incluye

- API Gateway HTTP API
- DynamoDB single-table para app core
- DynamoDB para cache de barcode
- Lambdas TypeScript para auth, foods y favorites
- Reutilizacion del User Pool de Cognito existente para no perder usuarios

## Comandos

```bash
npm install
npm run bootstrap
npm run deploy
npm run outputs
```

## Crear usuarios Cognito

1. Copia `users.example.json` a `users.json`
2. Rellena emails y passwords
3. Ejecuta:

```bash
npm run users:create
```
