# Plan de migracion a TanStack Query + backend mock

## Objetivo

Migrar la app desde estado global en contexto hacia una capa de datos orientada a servidor usando `@tanstack/react-query`, empezando por el dominio de `foods` con un backend mock asincrono. La UI debe empezar a comportarse como si hablara con un backend real, pero sin depender todavia de AWS.

## Checklist global

### 1. Infraestructura base de datos cliente

- [x] Definir el plan de migracion y dejarlo escrito en `plan.md`
- [x] Instalar `@tanstack/react-query`
- [x] Instalar `expo-network` para integracion mobile-friendly con estado online
- [x] Crear un `QueryClient` compartido para toda la app
- [x] Envolver la raiz de la app con `QueryClientProvider`
- [x] Configurar `focusManager` con `AppState` para React Native
- [x] Configurar `onlineManager` con `expo-network`
- [ ] Evaluar y anadir persistencia opcional con AsyncStorage cuando la base este estable

### 2. Dominio foods

- [x] Crear backend mock asincrono para `foods`
- [x] Mover el dominio `foods` a servicios/repositorios desacoplados del `NutritionContext`
- [x] Definir query keys del dominio `foods`
- [x] Crear hooks de query para listado y detalle de alimentos
- [x] Crear hooks de mutation para crear, editar y borrar alimentos
- [x] Migrar `src/app/(tabs)/foods.tsx` a TanStack Query
- [x] Migrar `src/app/food/[id].tsx` a TanStack Query
- [x] Migrar `src/app/food/add.tsx` a TanStack Query
- [x] Migrar `src/app/food/edit/[id].tsx` a TanStack Query
- [ ] Eliminar codigo legacy del dominio `foods` que quede sin uso

### 3. Dominio favorites

- [x] Crear backend mock asincrono para `favorites`
- [x] Crear queries y mutations del dominio `favorites`
- [x] Permitir tags custom al crear platos favoritos
- [x] Migrar `src/app/(tabs)/favorites.tsx`
- [x] Migrar `src/app/favorite/[id].tsx`
- [x] Migrar `src/app/favorite/create.tsx`

### 4. Dominio logs, dashboard e historial

- [x] Crear backend mock asincrono para `logs`
- [x] Crear query para resumen diario/dashboard
- [x] Migrar `src/app/(tabs)/index.tsx`
- [x] Crear query para timeline
- [x] Migrar `src/app/(tabs)/timeline.tsx`
- [x] Crear query para calendario mensual
- [x] Migrar `src/app/history/calendar.tsx`

### 5. Dominio AI

- [x] Crear mutation/query para sugerencias de comidas
- [x] Migrar `src/app/ai/suggestions.tsx`
- [x] Persistir el borrador seleccionado en cache de TanStack Query
- [x] Generar borrador de receta editable separado de la lista de sugerencias
- [x] Crear mutation para escaneo de etiqueta
- [x] Migrar `src/app/food/scan.tsx`
- [x] Crear mutation para analisis visual de plato
- [x] Migrar `src/app/log/analyze.tsx`

### 6. Estado global restante

- [x] Reducir `NutritionContext` para que deje de contener datos persistentes
- [x] Eliminar `NutritionContext` y su provider al dejar de tener consumidores
- [x] Mover `aiRecipeDraft` a query cache
- [x] Mover el alta de `mealLogEntries` al dominio `logs` con mutations
- [ ] Mantener en contexto solo auth, preferencias UI y estado efimero si hace falta

### 7. Paso final hacia backend real

- [x] Definir contratos de request/response para endpoints AI serverless
- [x] Anadir cliente HTTP base y selector mock/lambda por configuracion
- [x] Sustituir implementaciones AI por una capa de servicio intercambiable
- [ ] Sustituir implementaciones mock por cliente HTTP real
- [ ] Mantener query keys y hooks publicos para no reescribir pantallas
- [ ] Conectar con API Gateway + Lambdas por dominio
- [ ] Conectar autenticacion con Cognito
- [ ] Conectar almacenamiento de imagenes con S3

## Notas de este primer paso

- La app ya no depende de `NutritionContext`; el estado de datos activo pasa por dominios query-backed y cache de TanStack Query.
- `foods`, `favorites`, `logs/dashboard/history` y `ai suggestions` ya siguen el flujo mock asincrono con contratos mas cercanos a backend real.
- La app ya tiene contratos AI y una capa `service` intercambiable lista para apuntar a Lambda mediante `EXPO_PUBLIC_AI_API_MODE=lambda` y `EXPO_PUBLIC_API_BASE_URL`.
- Queda pendiente conectar endpoints reales en AWS, autenticacion, subida de imagenes y persistencia serverless completa.
