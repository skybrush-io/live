import { defineConfig, globalIgnores } from 'eslint/config';
import skybrush from '@skybrush/eslint-config';

export default defineConfig(
  skybrush.configs.recommended,
  globalIgnores(['build']),
  globalIgnores(['**/*.js'])
);
