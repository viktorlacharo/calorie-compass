import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const stackName = process.env.STACK_NAME || 'CalorieCompassBackendProd';
const region = process.env.AWS_REGION || 'eu-south-2';
const rootDir = join(process.cwd(), '..');
const generatedDir = join(rootDir, '.generated');

const { stdout } = await execFileAsync('aws', [
  'cloudformation',
  'describe-stacks',
  '--stack-name',
  stackName,
  '--region',
  region,
  '--query',
  'Stacks[0].Outputs',
  '--output',
  'json',
]);

const outputs = JSON.parse(stdout);
const values = Object.fromEntries(outputs.map((output) => [output.OutputKey, output.OutputValue]));

await mkdir(generatedDir, { recursive: true });

const envContent = [
  `EXPO_PUBLIC_API_BASE_URL=${values.ApiBaseUrl ?? ''}`,
  `EXPO_PUBLIC_COGNITO_REGION=${values.CognitoRegion ?? ''}`,
  `EXPO_PUBLIC_COGNITO_USER_POOL_ID=${values.CognitoUserPoolId ?? ''}`,
  `EXPO_PUBLIC_COGNITO_APP_CLIENT_ID=${values.CognitoUserPoolClientId ?? ''}`,
].join('\n');

await writeFile(join(generatedDir, 'backend.env'), `${envContent}\n`, 'utf8');

console.log(`Wrote ${join('.generated', 'backend.env')}`);
