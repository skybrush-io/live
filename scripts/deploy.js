/*
 * Builds a production-ready version of the application and deploys it
 * to a given remote location using rsync
 */

const path = require('path');
const execa = require('execa');
const { copy, emptyDir, ensureDir, readJson } = require('fs-extra');
const Listr = require('listr');
const ora = require('ora');
const pify = require('pify');
const webpack = require('webpack');

/** The root directory of the project */
const projectRoot = path.resolve(__dirname, '..');

/** The build folder where we set up the stage for electron-builder */
const buildDir = path.resolve(projectRoot, 'build');

/** The output directory where the release will be built */
const outputDir = path.resolve(projectRoot, 'dist');

const options = require('yargs')
  .usage('$0 [options] <target>')
  .option('p', {
    alias: 'production',
    default: false,
    describe: 'whether to build the application in production mode',
    type: 'boolean'
  })
  .help('h')
  .alias('h', 'help')
  .version(false).argv;

function loadAppConfig() {
  return readJson(path.resolve(projectRoot, 'package.json'));
}

async function cleanDirs() {
  await emptyDir(buildDir);
  await emptyDir(outputDir);
}

async function createBundle(configName) {
  process.env.DEPLOYMENT = '1';

  const webpackConfig = require(path.resolve(
    projectRoot,
    'webpack',
    configName + '.config.js'
  ));

  webpackConfig.context = projectRoot;
  webpackConfig.mode = options.production ? 'production' : 'development';
  webpackConfig.output = {
    filename:
      configName === 'electron' ? 'bundle.js' : configName + '.bundle.js',
    path: buildDir
  };

  await ensureDir(buildDir);
  await pify(webpack)(webpackConfig);
}

async function copyIcons() {
  await copy(
    path.resolve(projectRoot, 'assets', 'icons', 'mac', 'flockwave.icns'),
    path.resolve(buildDir, 'icon.icns')
  );
  await copy(
    path.resolve(projectRoot, 'assets', 'icons', 'win', 'flockwave.ico'),
    path.resolve(buildDir, 'icon.ico')
  );
}

async function invokeElectronBuilder(appConfig) {
  await execa('electron-builder', ['-mwl'], {
    cwd: projectRoot
  });
}

/**
 * Main entry point of the deployment script.
 */
async function main() {
  const appConfig = await loadAppConfig();

  // OutputDir = path.resolve(outputDir, appConfig.version)

  const tasks = new Listr([
    {
      task: cleanDirs,
      title: 'Cleaning build directories'
    },
    {
      task: () =>
        new Listr([
          {
            task: () => createBundle('electron'),
            title: 'Main application'
          },
          {
            task: () => createBundle('launcher'),
            title: 'Launcher script'
          },
          {
            task: () => createBundle('preload'),
            title: 'Preload script'
          }
        ]),
      title: 'Creating JavaScript bundles'
    },
    {
      task: copyIcons,
      title: 'Copying icons'
    },
    {
      task: ctx => invokeElectronBuilder(ctx.appConfig),
      title: 'Building executables'
    }
  ]);

  await tasks.run({ appConfig }).catch(error => {
    ora(error.message).fail();
    process.exit(1);
  });
}

main();
