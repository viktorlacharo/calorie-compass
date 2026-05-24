import * as path from 'node:path';
import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { HttpApi, CorsHttpMethod, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { backendConfig, getJwtIssuer } from './config';

export class CalorieCompassBackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const appTable = new Table(this, 'AppTable', {
      tableName: backendConfig.tables.app,
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const barcodeCacheTable = new Table(this, 'BarcodeCacheTable', {
      tableName: backendConfig.tables.barcodeCache,
      partitionKey: { name: 'barcode', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'expiresAt',
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const mediaBucket = new Bucket(this, 'MediaBucket', {
      bucketName: `${backendConfig.appName}-${backendConfig.environmentName}-media`,
      removalPolicy: RemovalPolicy.DESTROY,
      cors: [
        {
          allowedMethods: [HttpMethods.PUT, HttpMethods.GET, HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
      lifecycleRules: [
        {
          id: 'ExpireTemporaryUploads',
          expiration: Duration.days(7),
        },
      ],
    });

    const geminiApiKey = StringParameter.valueForStringParameter(this, '/calorie-compass/prod/gemini-api-key');

    const authorizer = new HttpJwtAuthorizer('CognitoJwtAuthorizer', getJwtIssuer(), {
      jwtAudience: [backendConfig.existingCognito.userPoolClientId],
    });

    const api = new HttpApi(this, 'HttpApi', {
      apiName: `${backendConfig.appName}-${backendConfig.environmentName}`,
      corsPreflight: {
        allowHeaders: ['Authorization', 'Content-Type'],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.DELETE,
          CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ['*'],
        maxAge: Duration.days(10),
      },
    });

    const commonEnv = {
      TABLE_NAME: appTable.tableName,
      FOODS_TABLE_NAME: appTable.tableName,
      BARCODE_CACHE_TABLE: barcodeCacheTable.tableName,
      OPENFOODFACTS_BASE_URL: backendConfig.openFoodFacts.baseUrl,
      OPENFOODFACTS_FIELDS: backendConfig.openFoodFacts.fields,
      OFF_TIMEOUT_MS: backendConfig.openFoodFacts.timeoutMs,
      CACHE_TTL_OK_SECONDS: backendConfig.openFoodFacts.cacheTtlOkSeconds,
      CACHE_TTL_NOT_FOUND_SECONDS: backendConfig.openFoodFacts.cacheTtlNotFoundSeconds,
      CACHE_TTL_INCOMPLETE_SECONDS: backendConfig.openFoodFacts.cacheTtlIncompleteSeconds,
      MEM_CACHE_TTL_MS: backendConfig.openFoodFacts.memCacheTtlMs,
      MEDIA_BUCKET_NAME: mediaBucket.bucketName,
      GEMINI_API_KEY: geminiApiKey,
    };

    const authMe = this.createLambda('AuthMeLambda', 'src/lambdas/auth/me.ts', commonEnv);
    const foodsList = this.createLambda('FoodsListLambda', 'src/lambdas/foods/list.ts', commonEnv);
    const foodsCreate = this.createLambda('FoodsCreateLambda', 'src/lambdas/foods/create.ts', commonEnv);
    const foodsUpdate = this.createLambda('FoodsUpdateLambda', 'src/lambdas/foods/update.ts', commonEnv);
    const foodsDelete = this.createLambda('FoodsDeleteLambda', 'src/lambdas/foods/delete.ts', commonEnv);
    const foodsBarcode = this.createLambda('FoodsBarcodeLambda', 'src/lambdas/foods/barcode.ts', commonEnv, 512);
    const favoritesList = this.createLambda('FavoritesListLambda', 'src/lambdas/favorites/list.ts', commonEnv);
    const favoritesCreate = this.createLambda('FavoritesCreateLambda', 'src/lambdas/favorites/create.ts', commonEnv);
    const favoriteGetById = this.createLambda('FavoriteGetByIdLambda', 'src/lambdas/favorites/get-by-id.ts', commonEnv);
    const favoriteDelete = this.createLambda('FavoriteDeleteLambda', 'src/lambdas/favorites/delete.ts', commonEnv);
    const logsCreate = this.createLambda('LogsCreateLambda', 'src/lambdas/logs/create.ts', commonEnv);
    const logsDashboard = this.createLambda('LogsDashboardLambda', 'src/lambdas/logs/dashboard.ts', commonEnv);
    const logsList = this.createLambda('LogsListLambda', 'src/lambdas/logs/list.ts', commonEnv);
    const mediaPresign = this.createLambda('MediaPresignLambda', 'src/lambdas/media/presign.ts', commonEnv);
    const aiSuggestions = this.createLambda('AiSuggestionsLambda', 'src/lambdas/ai/suggestions.ts', commonEnv);
    const aiRecipeDrafts = this.createLambda('AiRecipeDraftsLambda', 'src/lambdas/ai/recipe-drafts.ts', commonEnv);
    const aiScanLabel = this.createLambda('AiScanLabelLambda', 'src/lambdas/ai/scan-label.ts', commonEnv, 512);
    const aiAnalyzeMeal = this.createLambda('AiAnalyzeMealLambda', 'src/lambdas/ai/analyze-meal.ts', commonEnv, 512);

    appTable.grantReadData(foodsList);
    appTable.grantReadWriteData(foodsCreate);
    appTable.grantReadWriteData(foodsUpdate);
    appTable.grantReadWriteData(foodsDelete);
    appTable.grantReadData(favoritesList);
    appTable.grantReadWriteData(favoritesCreate);
    appTable.grantReadData(favoriteGetById);
    appTable.grantReadWriteData(favoriteDelete);
    appTable.grantReadWriteData(logsCreate);
    appTable.grantReadData(logsDashboard);
    appTable.grantReadData(logsList);
    appTable.grantReadData(foodsBarcode);
    barcodeCacheTable.grantReadWriteData(foodsBarcode);

    mediaBucket.grantWrite(mediaPresign);
    mediaBucket.grantRead(aiScanLabel);
    mediaBucket.grantRead(aiAnalyzeMeal);

    appTable.grantReadData(aiSuggestions);
    appTable.grantReadData(aiRecipeDrafts);
    appTable.grantReadData(aiAnalyzeMeal);

    api.addRoutes({ path: '/me', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('MeIntegration', authMe), authorizer });
    api.addRoutes({ path: '/foods', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('FoodsListIntegration', foodsList), authorizer });
    api.addRoutes({ path: '/foods', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('FoodsCreateIntegration', foodsCreate), authorizer });
    api.addRoutes({ path: '/foods/{id}', methods: [HttpMethod.PUT], integration: new HttpLambdaIntegration('FoodsUpdateIntegration', foodsUpdate), authorizer });
    api.addRoutes({ path: '/foods/{id}', methods: [HttpMethod.DELETE], integration: new HttpLambdaIntegration('FoodsDeleteIntegration', foodsDelete), authorizer });
    api.addRoutes({ path: '/foods/barcode/{barcode}', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('FoodsBarcodeIntegration', foodsBarcode), authorizer });
    api.addRoutes({ path: '/favorites', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('FavoritesListIntegration', favoritesList), authorizer });
    api.addRoutes({ path: '/favorites', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('FavoritesCreateIntegration', favoritesCreate), authorizer });
    api.addRoutes({ path: '/favorites/{id}', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('FavoriteGetByIdIntegration', favoriteGetById), authorizer });
    api.addRoutes({ path: '/favorites/{id}', methods: [HttpMethod.DELETE], integration: new HttpLambdaIntegration('FavoriteDeleteIntegration', favoriteDelete), authorizer });
    api.addRoutes({ path: '/logs', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('LogsCreateIntegration', logsCreate), authorizer });
    api.addRoutes({ path: '/logs', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('LogsListIntegration', logsList), authorizer });
    api.addRoutes({ path: '/logs/dashboard', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('LogsDashboardIntegration', logsDashboard), authorizer });
    api.addRoutes({ path: '/uploads/presign', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('MediaPresignIntegration', mediaPresign), authorizer });
    api.addRoutes({ path: '/ai/suggestions', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('AiSuggestionsIntegration', aiSuggestions), authorizer });
    api.addRoutes({ path: '/ai/recipe-drafts', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('AiRecipeDraftsIntegration', aiRecipeDrafts), authorizer });
    api.addRoutes({ path: '/ai/scan-label', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('AiScanLabelIntegration', aiScanLabel), authorizer });
    api.addRoutes({ path: '/ai/analyze-meal', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('AiAnalyzeMealIntegration', aiAnalyzeMeal), authorizer });

    new CfnOutput(this, 'ApiBaseUrl', { value: api.apiEndpoint });
    new CfnOutput(this, 'AppTableName', { value: appTable.tableName });
    new CfnOutput(this, 'BarcodeCacheTableName', { value: barcodeCacheTable.tableName });
    new CfnOutput(this, 'CognitoRegion', { value: backendConfig.region });
    new CfnOutput(this, 'CognitoUserPoolId', { value: backendConfig.existingCognito.userPoolId });
    new CfnOutput(this, 'CognitoUserPoolClientId', { value: backendConfig.existingCognito.userPoolClientId });
    new CfnOutput(this, 'MediaBucketName', { value: mediaBucket.bucketName });
  }

  private createLambda(id: string, entry: string, environment: Record<string, string>, memorySize = 256) {
    return new NodejsFunction(this, id, {
      entry: path.join(__dirname, '..', entry),
      handler: 'handler',
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      memorySize,
      timeout: Duration.seconds(10),
      environment,
      bundling: {
        target: 'node22',
        minify: false,
        sourceMap: true,
        externalModules: [],
      },
      logRetention: RetentionDays.ONE_WEEK,
    });
  }
}
