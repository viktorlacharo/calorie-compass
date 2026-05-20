import * as path from 'node:path';
import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { HttpApi, CorsHttpMethod, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
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
    };

    const authMe = this.createLambda('AuthMeLambda', 'src/lambdas/auth/me.ts', commonEnv);
    const foodsList = this.createLambda('FoodsListLambda', 'src/lambdas/foods/list.ts', commonEnv);
    const foodsCreate = this.createLambda('FoodsCreateLambda', 'src/lambdas/foods/create.ts', commonEnv);
    const foodsUpdate = this.createLambda('FoodsUpdateLambda', 'src/lambdas/foods/update.ts', commonEnv);
    const foodsBarcode = this.createLambda('FoodsBarcodeLambda', 'src/lambdas/foods/barcode.ts', commonEnv, 512);
    const favoritesList = this.createLambda('FavoritesListLambda', 'src/lambdas/favorites/list.ts', commonEnv);
    const favoritesCreate = this.createLambda('FavoritesCreateLambda', 'src/lambdas/favorites/create.ts', commonEnv);
    const favoriteGetById = this.createLambda('FavoriteGetByIdLambda', 'src/lambdas/favorites/get-by-id.ts', commonEnv);
    const favoriteDelete = this.createLambda('FavoriteDeleteLambda', 'src/lambdas/favorites/delete.ts', commonEnv);

    appTable.grantReadData(foodsList);
    appTable.grantReadWriteData(foodsCreate);
    appTable.grantReadWriteData(foodsUpdate);
    appTable.grantReadData(favoritesList);
    appTable.grantReadWriteData(favoritesCreate);
    appTable.grantReadData(favoriteGetById);
    appTable.grantReadWriteData(favoriteDelete);
    appTable.grantReadData(foodsBarcode);
    barcodeCacheTable.grantReadWriteData(foodsBarcode);

    api.addRoutes({ path: '/me', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('MeIntegration', authMe), authorizer });
    api.addRoutes({ path: '/foods', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('FoodsListIntegration', foodsList), authorizer });
    api.addRoutes({ path: '/foods', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('FoodsCreateIntegration', foodsCreate), authorizer });
    api.addRoutes({ path: '/foods/{id}', methods: [HttpMethod.PUT], integration: new HttpLambdaIntegration('FoodsUpdateIntegration', foodsUpdate), authorizer });
    api.addRoutes({ path: '/foods/barcode/{barcode}', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('FoodsBarcodeIntegration', foodsBarcode), authorizer });
    api.addRoutes({ path: '/favorites', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('FavoritesListIntegration', favoritesList), authorizer });
    api.addRoutes({ path: '/favorites', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('FavoritesCreateIntegration', favoritesCreate), authorizer });
    api.addRoutes({ path: '/favorites/{id}', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('FavoriteGetByIdIntegration', favoriteGetById), authorizer });
    api.addRoutes({ path: '/favorites/{id}', methods: [HttpMethod.DELETE], integration: new HttpLambdaIntegration('FavoriteDeleteIntegration', favoriteDelete), authorizer });

    new CfnOutput(this, 'ApiBaseUrl', { value: api.apiEndpoint });
    new CfnOutput(this, 'AppTableName', { value: appTable.tableName });
    new CfnOutput(this, 'BarcodeCacheTableName', { value: barcodeCacheTable.tableName });
    new CfnOutput(this, 'CognitoRegion', { value: backendConfig.region });
    new CfnOutput(this, 'CognitoUserPoolId', { value: backendConfig.existingCognito.userPoolId });
    new CfnOutput(this, 'CognitoUserPoolClientId', { value: backendConfig.existingCognito.userPoolClientId });
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
