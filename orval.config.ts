import { defineConfig } from 'orval';

export default defineConfig({
  awsApi: {
    input: {
      target: './openapi/aws-api.yaml',
    },
    output: {
      mode: 'single',
      target: './src/lib/api/generated/aws-api.ts',
      schemas: './src/lib/api/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      override: {
        query: {
          useQuery: true,
          useMutation: true,
        },
        mutator: {
          path: './src/lib/api/orval-mutator.ts',
          name: 'orvalHttpClient',
        },
      },
    },
  },
});
