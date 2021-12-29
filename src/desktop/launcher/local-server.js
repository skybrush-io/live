const { spawn } = require('child_process');
const { dialog } = require('electron');
const ndjson = require('ndjson');
const path = require('path');
const pDefer = require('p-defer');
const pTimeout = require('p-timeout');
const process = require('process');
const which = require('which');

const makeEventProxy = require('../event-proxy');
const { isMac, isWindows } = require('../platform');

const getApplicationFolder = require('./app-folder');

/**
 * Event proxy for the local server object.
 *
 * We will use this object to emit events when something happens with the
 * server in the main process. The events will be broadcast to all renderer
 * processes having the same event proxy.
 */
const events = makeEventProxy('localServer');

/**
 * The local executable of the Skybrush server on this machine.
 */
let localServerPath;

/**
 * Deferred that will resolve to the local executable of the Skybrush server
 * on this machine.
 */
let localServerPathDeferred = pDefer();

/**
 * The process representing the launched Skybrush server instance on this
 * machine. We only support one Skybrush server instance per Skybrush Live
 * process.
 */
let localServerProcess;

/**
 * Executable path and arguments for the server process that is currently
 * running, or null if no process is running now.
 */
let localServerProcessArgs;

/**
 * Status code that Windows batch files return when they were terminated
 * with Ctrl-C.
 */
const STATUS_CONTROL_C_EXIT = 0xc000013a;

const endsWith = (string, target) =>
  string.slice(string.length - target.length) === target;

/**
 * Returns an array containing the names of all directories to scan on
 * the system when looking for the server executable, _in addition to_ the
 * system path.
 *
 * These directories are derived from the current installed location of
 * the application, with a few platform-specific tweaks.
 *
 * @return {string[]}  the names of the directories to search for the local
 *         Skybrush server executable, besides the system path and the
 *         directories added explicitly by the user in the settings
 */
function getPathsRelatedToAppLocation() {
  const appFolder = getApplicationFolder();
  const folders = [];

  if (isMac) {
    // First, search in /usr/local/opt/skybrush-server/current/bin, which is
    // the standard folder on macOS
    folders.push('/usr/local/opt/skybrush-server/current/bin');

    if (endsWith(appFolder, '.app/Contents/MacOS')) {
      // This is an .app bundle so let's search the Resources folder within
      // the bundle
      folders.push(path.resolve(path.dirname(appFolder), 'Resources'));
    } else {
      // Probably not an .app bundle so let's just assume that the server
      // might be in the same folder
      folders.push(appFolder);
    }
  } else {
    folders.push(appFolder);
  }

  // On Windows, we also look for the server one level higher for a folder
  // named "Skybrush Server". This allows us to find it when the server and
  // Live are installed in two folders in C:\Program Files, next to each
  // other. We also add "Program Files" and "Program Files (x86)" explicitly,
  // and also search in "%LOCALAPPDATA%\Programs"
  if (isWindows) {
    const SERVER_FOLDER_NAME = 'Skybrush Server';
    const rootFolders = [
      path.dirname(appFolder),
      process.env.PROGRAMFILES,
      process.env['PROGRAMFILES(X86)'],
      process.env.LOCALAPPDATA
        ? path.resolve(process.env.LOCALAPPDATA, 'Programs')
        : null,
    ];

    for (const folder of rootFolders) {
      if (typeof folder === 'string' && folder.length > 0) {
        folders.push(path.resolve(folder, SERVER_FOLDER_NAME));
      }
    }
  }

  return folders;
}

const pathsRelatedToAppLocation = Object.freeze(
  getPathsRelatedToAppLocation().filter(
    (x) => typeof x === 'string' && x.length > 0
  )
);

/**
 * Derives the list of arguments to pass to the server, given the options that
 * the user passed to `ensureStarted()`.
 *
 * @param {Object}   options         options to tweak how the server is launched
 * @param {string[]} options.args    additional arguments to pass to the server
 *        when launching
 * @param {number}   options.port    the port to launch the server on
 * @return a tuple consisting of the path and the arguments of the server to launch
 */
const deriveServerPathAndArgumentsFromOptions = async (options) => {
  const { args, timeout } = {
    args: '',
    timeout: 5000,
    ...options,
  };

  if (localServerPathDeferred) {
    localServerPathDeferred = pDefer();
    await pTimeout(localServerPathDeferred.promise, timeout);
  }

  if (!localServerPath) {
    throw new Error('local Skybrush server not found');
  }

  // TODO(ntamas): respect the port setting provided by the user
  return [localServerPath, ['--log-style', 'json', ...args]];
};

/**
 * Ensures that a Skybrush server executable with the given arguments is up and
 * running. Re-uses an already running instance if needed.
 */
const ensureRunning = async (options) => {
  const [serverPath, realArgs] = await deriveServerPathAndArgumentsFromOptions(
    options
  );
  const value = [serverPath, ...realArgs];

  if (
    localServerProcess &&
    JSON.stringify(value) === JSON.stringify(localServerProcessArgs)
  ) {
    // Existing server process can be re-used
    console.log('Re-using already running server instance');
  } else {
    // New server process needs to ba launched. This will also terminate any
    // previously running server process.
    const { port } = options;
    console.log('Launching local server instance on port', port);
    await launch(options);
  }
};

/**
 * Launches the local Skybrush server executable with the given arguments.
 *
 * @param {Object}   options         options to tweak how the server is launched
 * @param {string[]} options.args    additional arguments to pass to the server
 *        when launching
 * @param {number}   options.port    the port to launch the server on
 * @param {number}   options.timeout number of milliseconds to wait for the
 *        server detection to complete and the server to launch
 */
const launch = async (options) => {
  if (localServerProcess) {
    // Terminate the previous instance
    await terminate();
  }

  const [serverPath, realArgs] = await deriveServerPathAndArgumentsFromOptions(
    options
  );

  /* on Windows we might use batch files for launching, and those need a shell */
  const needsShell =
    isWindows &&
    ['.com', '.bat'].includes(path.extname(serverPath).toLowerCase());

  localServerProcess = spawn(
    // Windows quirk: if we need a shell, we need to quote the full path in case
    // it includes a space
    isWindows && needsShell ? `"${serverPath}"` : serverPath,
    realArgs,
    {
      cwd: path.dirname(serverPath),
      shell: needsShell,

      // stdin of child is closed; stderr is piped to us so we can parse the
      // log messages. stdout is piped to our own stdout in case the server prints
      // something there, although it shouldn't.
      stdio: ['ignore', 'inherit', 'pipe'],

      // hide the subprocess window
      windowsHide: true,
    }
  );
  localServerProcessArgs = [serverPath, ...realArgs];

  localServerProcess.on('error', (reason) => {
    console.log('Local server process error, reason =', reason);
    events.emit('emit', 'error', reason);
    localServerProcess = undefined;
    localServerProcessArgs = undefined;
  });
  localServerProcess.on('exit', (code, signal) => {
    localServerProcess.hasTerminatedSuccessfully = true;

    // Remap Ctrl-C exit code to zero on Windows
    if (isWindows && code === STATUS_CONTROL_C_EXIT) {
      code = 0;
    }

    console.log(
      'Local server process exited',
      code === null
        ? `with signal ${signal}`
        : code === 0
        ? ''
        : `with code ${code}`
    );
    events.emit('emit', 'exit', code, signal);
    localServerProcess = undefined;
    localServerProcessArgs = undefined;
  });

  // Parse newline-delimited JSON log messages from stderr. We use
  // { strict: false }, which does _not_ return error events for malformed
  // lines. Unfortunately the only other option is the default (strict: true),
  // which emits an error event, but then the stream is required to close
  // because no other events may be emitted after an 'error'. So, in order not
  // to terminate the server process when some module accidentally prints to
  // stderr, the safer option is strict: false.
  localServerProcess.stderr
    .pipe(ndjson.parse({ strict: false }))
    .on('data', (item) => {
      events.emit('emit', 'log', item);
    })
    .on('error', (error) => {
      // Invalid line received, emit a log item formatted as an error. This
      // should not happen if we set { strict: false } but let's be on the
      // safe side.
      events.emit('emit', 'log', {
        levelname: 'ERROR',
        message:
          'Error while parsing server process output: ' +
          (error.message || String(error)),
      });
    });
};

/**
 * Searches for the local Skybrush server executable in the following places,
 * in this order of precedence:
 *
 * - the application folder and typical platform-dependent related folders
 * - custom folders specified by the user
 * - the system path
 *
 * As a side effect, stores the path found with the last invocation so we
 * can launch the executable later if needed.
 *
 * @param {string[]} paths    custom search folders to scan
 * @return {Promise<string>}  a promise that resolves to the full path of the
 *         server executable if found and `null` if it is not found
 */
const search = async (paths) => {
  // Do _not_ use the async version of which here. It does not have a nothrow
  // option, and when it throws an exception, it will be caught by
  // Electron's unhandled exception handler, which might throw a dialog box in
  // the user's face in production mode even though we nicely handle the
  // exception later.
  //
  // Note that which.sync() searches for EXE, CMD, BAT and COM on Windows, in
  // this order, so we don't need to specify the extension explicitly.
  const result = which.sync('skybrushd', {
    nothrow: true,
    path: [
      ...paths,
      ...pathsRelatedToAppLocation,
      ...process.env.PATH.split(path.delimiter),
    ].join(path.delimiter),
  });

  localServerPath = result;
  if (localServerPathDeferred) {
    localServerPathDeferred.resolve(result);
    localServerPathDeferred = undefined;
  }

  return result;
};

/**
 * Shows a dialog that allows the user to select a single directory that will be
 * scanned for the server executable.
 */
const selectPath = async (defaultPath, browserWindow) => {
  const options = {
    title: 'Select directory containing Skybrush Server',
    properties: ['openDirectory'],
  };

  if (typeof defaultPath === 'string') {
    options.defaultPath = defaultPath;
  }

  const { canceled, filePaths } = await dialog.showOpenDialog(
    browserWindow,
    options
  );

  return canceled ? null : filePaths[0];
};

/**
 * Terminate the local server instance that the main process is currently
 * managing.
 */
const terminate = async (options) => {
  const { timeout } = { timeout: 5000, ...options };

  if (localServerProcess) {
    const proc = localServerProcess;
    console.log('Terminating local server process');

    const exitDeferred = pDefer();
    proc.on('exit', () => {
      exitDeferred.resolve();
    });

    // Wait for kill() to actually terminate the process
    proc.kill();
    await pTimeout(exitDeferred.promise, timeout);

    proc.removeAllListeners();

    if (proc.exitCode === null && !proc.hasTerminatedSuccessfully) {
      // Process still running, terminate forcefully
      console.warn(
        'Local server process failed to exit in time, terminating forcefully...'
      );
      proc.kill('SIGKILL');
    }

    localServerProcess = undefined;
    localServerProcessArgs = undefined;
  }
};

module.exports = {
  ensureRunning,
  search,
  selectPath,
  terminate,
};
