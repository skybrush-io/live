import { GitRevisionPlugin } from 'git-revision-webpack-plugin';
import path from 'path';
import inject from '@rollup/plugin-inject';
import { createHtmlPlugin } from 'vite-plugin-html';
import react from '@vitejs/plugin-react';

const gitRevisionPlugin = new GitRevisionPlugin();

const projectRoot = path.resolve(__dirname, '..');

/* eslint-disable import/no-anonymous-default-export */
/** @type {import('vite').UserConfig} */
export default {
  define: {
    VERSION: JSON.stringify(gitRevisionPlugin.version()),
  },
  plugins: [
    inject({
      process: 'process/browser',
    }),
    createHtmlPlugin({
      entry: 'src/index.jsx',
      inject: {
        data: {
          title:
            'Skybrush Live | The Next-generation Drone Light Show Software Suite',
        },
      },
    }),
    react(),
  ],
  resolve: {
    alias: {
      '~': path.resolve(projectRoot, 'src'),
      config: path.resolve(projectRoot, 'config', 'default'),
      // 'config-overrides': path.resolve(projectRoot, 'config', 'none'),
    },
  },
};
/* eslint-enable import/no-anonymous-default-export */
