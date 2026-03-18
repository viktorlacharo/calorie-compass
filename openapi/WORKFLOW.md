# OpenAPI Workflow (Manual Step 1)

Current strategy for this project:

1. Use API Gateway export as the route/security skeleton.
2. Enrich the exported spec with request/response schemas manually.
3. Generate typed client/models with Orval.

## Files

- Source spec for generation: `openapi/aws-api.yaml`
- Orval config: `orval.config.ts`
- Generated client: `src/lib/api/generated/aws-api.ts`
- Generated models: `src/lib/api/generated/model/*`

## Generate

Run:

```bash
npm run api:generate
```

## Scope currently covered

- `GET /me`
- `GET /foods`
- `POST /foods`

With schemas for:

- `MeResponse`
- `Food`
- `CreateFoodRequest`
- `MacroNutrients`
- `ErrorResponse`

## Notes

- API Gateway HTTP API export does not provide complete request/response schemas by default.
- For useful type generation, schemas are maintained in `openapi/aws-api.yaml`.
- Keep this file aligned with real Lambda responses.
