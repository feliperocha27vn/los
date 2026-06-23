import { defineConfig } from '@kubb/core';
import { pluginOas } from '@kubb/plugin-oas';
import { pluginTs } from '@kubb/plugin-ts';
import { pluginClient } from '@kubb/plugin-client';
import { pluginReactQuery } from '@kubb/plugin-react-query';

export default defineConfig({
  root: '.',
  input: {
    path: '../api/swagger.json',
  },
  output: {
    path: './src/core/api/gen',
    clean: true,
  },
  plugins: [
    pluginOas({}),
    pluginTs({}),
    pluginClient({
      output: {
        path: './clients',
      },
      importPath: '@core/api/client',
    }),
    pluginReactQuery({
      output: {
        path: './hooks',
      },
      client: {
        importPath: '@core/api/client',
      },
    }),
  ],
});
