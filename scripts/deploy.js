/*
 * Builds a production-ready version of the application and deploys it
 * to a given remote location using rsync
 */

const execa = require('execa');
const { copy, emptyDir, ensureDir, readJson } = require('fs-extra');
const isDocker = require('is-docker');
const Listr = require('listr');
const ora = require('ora');
const path = require('path');
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
  process.env.NODE_ENV = 'production';

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
  const stats = await pify(webpack)(webpackConfig);

  if (stats.hasErrors()) {
    console.log(
      stats.toString({
        colors: true // Shows colors in the console
      })
    );
    throw new Error('Error while compiling Webpack bundle');
  }
}

async function copyIcons() {
  await copy(
    path.resolve(projectRoot, 'assets', 'icons', 'mac', 'skybrush.icns'),
    path.resolve(buildDir, 'icon.icns')
  );
  await copy(
    path.resolve(projectRoot, 'assets', 'icons', 'win', 'skybrush.ico'),
    path.resolve(buildDir, 'icon.ico')
  );
}

const electronBuilderSpawnOptions = {
  cwd: projectRoot,
  env: {
    // next line is needed because react-final-form depends on ts-essentials
    // (instead of dev-depending on it), which would need typescript as a
    // peer dependency, and electron-builder chokes on it
    ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES: 'true'
  }
};

async function invokeElectronBuilder(appConfig) {
  const tasks = [];
  const linuxAndWindowsTask = {
    task: () => invokeElectronBuilderForLinuxAndWindows(appConfig),
    title: 'Linux and Windows'
  };

  /*
  if (!isDocker()) {
    tasks.push({
      task: () => invokeElectronBuilderForMacOS(appConfig),
      title: 'macOS',
      skip: () => {
        if (process.platform !== 'darwin') {
          return 'macOS packages can only be built on macOS';
        }
      }
    });
  }
  */

  if (process.platform === 'darwin') {
    // On macOS, we need to run the Linux and Windows builds in Docker because
    // Wine is not supported on macOS Catalina at the moment
    tasks.push({
      task: () => invokeElectronBuilderInDocker(appConfig),
      title: 'Linux and Windows (in Docker)'
    });
  } else {
    tasks.push(linuxAndWindowsTask);
  }

  if (tasks.length > 0) {
    return new Listr(tasks);
  }

  throw new Error('Cannot build with electron-builder on this platform');
}

async function invokeElectronBuilderInDocker(appConfig) {
  const home = process.env.HOME;
  const cacheRoot =
    process.platform === 'darwin'
      ? path.resolve(home, 'Library', 'Caches')
      : path.resolve(home, '.cache');

  const npmToken = 'Rg9NGmrAVDgE6OMz0TluQaHIQUVBDm2srtp/Kt75eCw=';

  if (!home) {
    throw new Error('No HOME variable in environment');
  }

  await execa('docker', [
    'run',
    '--rm',
    '-i',
    '--env',
    'ELECTRON_CACHE=/root/.cache/electron',
    '--env',
    'ELECTRON_BUILDER_CACHE=/root/.cache/electron-builder',
    '-v',
    projectRoot + ':/project',
    '-v',
    appConfig.name + '-node-modules:/project/node_modules',
    '-v',
    cacheRoot + '/electron:/root/cache/.electron',
    '-v',
    cacheRoot + '/electron-builder:/root/cache/.electron-builder',
    'electronuserland/builder:wine',
    '/bin/bash',
    '-c',
    `echo '//npm.collmot.com/:_authToken="${npmToken}"' >~/.npmrc && npm i && npm run dist`
  ]);
}

async function invokeElectronBuilderForMacOS() {
  await execa('electron-builder', ['-m'], electronBuilderSpawnOptions);
}

async function invokeElectronBuilderForLinuxAndWindows() {
  await execa('electron-builder', ['-lw'], electronBuilderSpawnOptions);
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
