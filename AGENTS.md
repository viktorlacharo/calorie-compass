# Contexto del Proyecto: App de Nutrición AI Privada (v1.0)

## Visión General

Desarrollo de una aplicación móvil privada para dos usuarios (Android) orientada al registro altamente preciso de calorías y macronutrientes. El objetivo principal de esta versión es superar la imprecisión de las apps comerciales mediante una base de datos propia ("fine-grained") curada manualmente por el usuario, combinada con la API Multimodal de Gemini para el reconocimiento inteligente de platos y etiquetas nutricionales.

## Stack Tecnológico

- **Frontend Mobile:** React Native (Framework: Expo).
- **Lenguaje:** TypeScript estricto.
- **UI y Estilos:** \* **NativeWind v4** (funcionando sobre Tailwind CSS v3 con archivo `tailwind.config.js` para asegurar la compatibilidad y compilación en el entorno nativo).
  - **Componentes:** `react-native-reusables` (filosofía shadcn/ui: componentes accesibles e interactivos copiados directamente en el código fuente para tener control total).
- **Distribución:** Expo EAS (generación de artefactos .apk para Android).
- **Backend Serverless (AWS):**
  - Autenticación: AWS Cognito (User Pools para aislamiento total de datos por usuario).
  - API Gateway: Exposición de endpoints REST seguros.
  - Computación: AWS Lambda (Node.js/TypeScript) para la lógica de negocio, cálculos y proxy de IA.
  - Base de Datos: Amazon DynamoDB (NoSQL). Patrón de diseño con PK basada en el ID de usuario (Cognito sub) para garantizar la privacidad y aislamiento de los registros.
- **Inteligencia Artificial:** API de Gemini Multimodal (Google) consumida exclusivamente desde el entorno seguro de AWS Lambda.

## El Motor de Precisión: Base de Datos Curada

El sistema descarta bases de datos genéricas de terceros en favor de una colección interna controlada por el usuario:

- **Alimentos Comunes:** Registros exactos con valores energéticos y macros por cada 100g (o unidad), introducidos a mano o mediante escaneo de etiquetas.
- **Platos Favoritos:** Agrupaciones predefinidas de alimentos y cantidades que se consumen habitualmente, para un registro de un solo toque.
- **Motor de Cálculo:** Funciones en AWS Lambda que aplican reglas de 3 estrictas cruzando las detecciones visuales de la IA con los valores exactos de la base de datos local del usuario.

## Flujos de Usuario Principales (Core v1)

1. **Gestión de Alimentos y Etiquetas:**
   - **Manual:** Creación directa de un alimento introduciendo sus macros.
   - **Escaneo de Etiqueta:** Fotografía de la tabla nutricional. Lambda y Gemini extraen los datos y proponen el modelo JSON. El usuario revisa, asigna un nombre, una cantidad por defecto y guarda el alimento en su catálogo de DynamoDB.

2. **Registro de Platos Favoritos:**
   - Selección rápida de comidas preconfiguradas que insertan directamente los valores exactos en el registro diario sin necesidad de análisis visual.

3. **Análisis Visual de Platos (Cálculo Preciso):**
   - El usuario fotografía un plato.
   - La imagen se envía a AWS Lambda, que utiliza Gemini para identificar los componentes visuales del plato.
   - Lambda busca esos componentes en la base de datos "fine-grained" del usuario.
   - Se aplican las raciones por defecto del usuario y se realiza la regla de 3 con los macros curados.
   - El frontend recibe un desglose preciso. El usuario puede confirmar la detección o ajustar ligeramente las cantidades si visualmente detecta que la ración es diferente a su estándar.

## Directrices de Desarrollo para el Agente IA

- Todo el código nuevo debe escribirse en TypeScript, priorizando el tipado fuerte para los modelos de DynamoDB, respuestas de la API y props de los componentes.
- Utilizar Functional Components y Hooks nativos de React.
- Aplicar los estilos utilizando exclusivamente NativeWind (`className`).
- Para añadir nueva UI compleja (botones, inputs, modales, etc.), utilizar el CLI de `react-native-reusables` (`npx react-native-reusables add [component]`) en lugar de crearlos desde cero o importar librerías externas de UI de terceros.
- Arquitectura de seguridad: El frontend NO debe contener claves de AWS ni de Gemini. Toda interacción pesada o autenticada pasa por API Gateway validando el JWT de Cognito.
- Minimizar dependencias externas en el frontend; mantener el bundle ligero para un rendimiento óptimo en Android.
