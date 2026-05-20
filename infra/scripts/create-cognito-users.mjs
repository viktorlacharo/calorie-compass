import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const usersFile = process.env.COGNITO_USERS_FILE || join(process.cwd(), 'users.json');
const region = process.env.AWS_REGION || 'eu-south-2';
const userPoolId = process.env.COGNITO_USER_POOL_ID || 'eu-south-2_bPRMn2ad9';

const raw = await readFile(usersFile, 'utf8');
const users = JSON.parse(raw);

for (const user of users) {
  if (!user.email || !user.password) {
    throw new Error('Each user entry must contain email and password');
  }

  const baseArgs = [
    'cognito-idp',
    'admin-create-user',
    '--user-pool-id',
    userPoolId,
    '--region',
    region,
    '--username',
    user.email,
    '--user-attributes',
    `Name=email,Value=${user.email}`,
    `Name=email_verified,Value=true`,
    '--message-action',
    'SUPPRESS',
  ];

  await execFileAsync('aws', baseArgs);
  await execFileAsync('aws', [
    'cognito-idp',
    'admin-set-user-password',
    '--user-pool-id',
    userPoolId,
    '--region',
    region,
    '--username',
    user.email,
    '--password',
    user.password,
    '--permanent',
  ]);

  console.log(`Created user ${user.email}`);
}
