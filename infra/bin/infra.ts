#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CalorieCompassBackendStack } from '../lib/calorie-compass-backend-stack';
import { backendConfig } from '../lib/config';

const app = new cdk.App();

new CalorieCompassBackendStack(app, 'CalorieCompassBackendProd', {
  env: {
    account: backendConfig.accountId,
    region: backendConfig.region,
  },
});
