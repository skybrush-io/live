#!/usr/bin/env -S deno run --allow-all

import puppeteer from 'npm:puppeteer-core';

// --- Utilities ---

const getBrowserExecutablePath = async () => {
  for (const browser of ['chromium', 'chrome']) {
    const { stdout, stderr, code } = await new Deno.Command('which', {
      args: [browser],
    }).output();
    if (code === 0) {
      return new TextDecoder().decode(stdout).trim();
    }
  }

  throw new Error(
    [
      'Automatic search found no suitable browser executable path.',
      'Please provide one manually using `BROWSER_EXECUTABLE_PATH`!',
    ].join('\n')
  );
};

const getGitBranch = async () => {
  const command = new Deno.Command('git', {
    args: ['branch', '--show-current'],
  });
  const { stdout, stderr, code } = await command.output();
  if (code === 0) {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(stdout).replaceAll('/', '_'); // Remove / characters.
  }
  throw new Error({ code, error: stderr });
};

const sleep = (time) => new Promise((res) => setTimeout(res, time));

// --- Config (from environment) ---

// The unique key to add to image labels to differentiate between screenshots
// of different application versions. The default is the git branch name.
const key = Deno.env.get('KEY') ?? (await getGitBranch());
// The URL of the application to screenshot. The default is http://127.0.0.1:8080
const url = Deno.env.get('URL') ?? 'http://127.0.0.1:8080';
// The path to the show file to use. The default is the demo show file in the live repo.
const showFilePath =
  Deno.env.get('SHOW_FILE_PATH') ??
  (await (async () => {
    const tmpShowFilePath = await Deno.makeTempFile({
      prefix: 'skybrush-live-screenshot-automation',
    });
    const response = await fetch(
      'https://github.com/skybrush-io/live/raw/refs/heads/main/assets/shows/demo.skyc'
    );
    const data = new Uint8Array(await response.arrayBuffer());
    await Deno.writeFile(tmpShowFilePath, data);
    return tmpShowFilePath;
  })());

// --- Prepare ---

console.log('Preparing...');

const folder = `etc/dev/screenshots/${new Date().toISOString()}`;
Deno.mkdir(folder, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  executablePath:
    Deno.env.get('BROWSER_EXECUTABLE_PATH') ??
    (await getBrowserExecutablePath()),
});
const page = await browser.newPage();

const snap = (label) =>
  page.screenshot({ path: `${folder}/${label}-${key}.png` });

const dispatch = (action) => {
  const reactContainerKey = Object.keys(document.getElementById('root')).filter(
    (k) => k[0] === '_' && k.includes('$')
  )[0];
  const reactContainer = root[reactContainerKey];
  const store =
    reactContainer.child.child.sibling.child.child.child.child.child
      .pendingProps.store;
  store.dispatch(action);
};

await page.setViewport({ width: 1600, height: 1000 });
await page.goto(url);

// --- Run ---

console.log('Running...');

// TODO: Properly wait for splash screen to disappear instead of fixed timeout.
console.log('00-init');
await sleep(1000);
await page.locator('text/No show file loaded').wait();
await sleep(500); // Wait for map to load
await snap('00-init');
console.log('00-init done');

console.log('01-show-loaded waiting...');
const [fileChooser] = await Promise.all([
  page.waitForFileChooser(),
  page.click('text/Select or drop a show file here'),
]);
await fileChooser.accept([showFilePath]);
await sleep(750);
await snap('01-show-loaded');
console.log('01-show-loaded done');

// --- Dialogs ---

console.log('02-server-settings-dialog waiting...');
await page.evaluate(dispatch, {
  type: 'server-settings-dialog/showServerSettingsDialog',
});
await sleep(250);
await snap('02a-server-settings-dialog');
await page.evaluate(dispatch, {
  type: 'server-settings-dialog/updateServerSettings',
  payload: { selectedTab: 'manual' },
});
await sleep(250);
await snap('02b-server-settings-dialog');
await page.evaluate(dispatch, {
  type: 'server-settings-dialog/updateServerSettings',
  payload: { hostname: 'locahost', port: 5000 },
});
await sleep(250);
await snap('02c-server-settings-dialog');
await page.evaluate(dispatch, {
  type: 'server-settings-dialog/closeServerSettingsDialog',
});
console.log('02-server-settings-dialog done');

console.log('03-time-sync-dialog waiting...');
await page.evaluate(dispatch, { type: 'servers/openTimeSyncWarningDialog' });
await sleep(250);
await snap('03-time-sync-dialog');
await page.evaluate(dispatch, { type: 'servers/closeTimeSyncWarningDialog' });
console.log('03-time-sync-dialog done');

console.log('04-safety-dialog waiting...');
await page.evaluate(dispatch, { type: 'safety/openSafetyDialog' });
await sleep(250);
await snap('04-safety-dialog');
await page.evaluate(dispatch, { type: 'safety/closeSafetyDialog' });
console.log('04-safety-dialog done');

console.log('05-authentication-dialog waiting...');
await page.evaluate(dispatch, {
  type: 'authentication-dialog/showAuthenticationDialog',
});
await sleep(250);
await snap('05-authentication-dialog');
await page.evaluate(dispatch, {
  type: 'authentication-dialog/closeAuthenticationDialog',
});
console.log('05-authentication-dialog done');

console.log('06-averaging-dialog waiting...');
await page.evaluate(dispatch, { type: 'measurement/showAveragingDialog' });
await sleep(250);
await snap('06-averaging-dialog');
await page.evaluate(dispatch, { type: 'measurement/closeAveragingDialog' });
console.log('06-averaging-dialog done');

console.log('07-firmware-update-dialog waiting...');
await page.evaluate(dispatch, {
  type: 'firmware-update/showFirmwareUpdateSetupDialog',
});
await sleep(250);
await snap('07-firmware-update-dialog');
await page.evaluate(dispatch, {
  type: 'firmware-update/hideFirmwareUpdateSetupDialog',
});
console.log('07-firmware-update-dialog done');

console.log('08-map-caching-dialog waiting...');
await page.evaluate(dispatch, { type: 'map-caching/showMapCachingDialog' });
await sleep(250);
await snap('08-map-caching-dialog');
await page.evaluate(dispatch, { type: 'map-caching/closeMapCachingDialog' });
console.log('08-map-caching-dialog done');

console.log('09-parameter-upload-dialog waiting...');
await page.evaluate(dispatch, {
  type: 'parameters/showParameterUploadSetupDialog',
});
await sleep(250);
await snap('09-parameter-upload-dialog');
await page.evaluate(dispatch, {
  type: 'parameters/closeParameterUploadSetupDialog',
});
console.log('09-parameter-upload-dialog done');

console.log('10-app-settings-dialog-A-display waiting...');
await page.evaluate(dispatch, {
  type: 'app-settings/toggleAppSettingsDialog',
});
await sleep(250);
await snap('10-app-settings-dialog-A-display');
console.log('10-app-settings-dialog-A-display done');

console.log('10-app-settings-dialog-B-3dview waiting...');
await page.evaluate(dispatch, {
  type: 'app-settings/setAppSettingsDialogTab',
  payload: 'threeD',
});
await sleep(250);
await snap('10-app-settings-dialog-B-3dview');
console.log('10-app-settings-dialog-B-3dview done');

console.log('10-app-settings-dialog-C-uavs waiting...');
await page.evaluate(dispatch, {
  type: 'app-settings/setAppSettingsDialogTab',
  payload: 'uavs',
});
await sleep(250);
await snap('10-app-settings-dialog-C-uavs');
console.log('10-app-settings-dialog-C-uavs done');

console.log('10-app-settings-dialog-D-preflight waiting...');
await page.evaluate(dispatch, {
  type: 'app-settings/setAppSettingsDialogTab',
  payload: 'preflight',
});
await sleep(250);
await snap('10-app-settings-dialog-D-preflight');
console.log('10-app-settings-dialog-D-preflight done');

console.log('10-app-settings-dialog-E-apiKeys waiting...');
await page.evaluate(dispatch, {
  type: 'app-settings/setAppSettingsDialogTab',
  payload: 'apiKeys',
});
await sleep(250);
await snap('10-app-settings-dialog-E-apiKeys');
await page.evaluate(dispatch, {
  type: 'app-settings/toggleAppSettingsDialog',
});
console.log('10-app-settings-dialog-E-apiKeys done');

// --- Locations ---

await page.evaluate(dispatch, {
  type: 'saved-locations/updateSavedLocation',
  payload: {
    id: 'elte',
    name: 'ELTE Garden',
    center: { lon: 19.0622, lat: 47.4733 },
    rotation: 348,
    zoom: 19,
    notes: '',
  },
});
await sleep(250);
await page.click('.lm_tab[title="Locations"]');
await page.click('text/ELTE Garden');
await sleep(500);
await snap('11-location-elte-garden');

// --- Show control ---

await page.evaluate(dispatch, { type: 'show/openEnvironmentEditorDialog' });
await sleep(250);
await snap('12-environment-editor-dialog');
await page.evaluate(dispatch, {
  type: 'show/setOutdoorShowOrigin',
  payload: [19.0622, 47.4733],
});
await sleep(250);
await snap('13-environment-editor-dialog-filled');
await page.evaluate(dispatch, { type: 'show/closeEnvironmentEditorDialog' });

await page.evaluate(dispatch, { type: 'site-survey/showDialog' });
await sleep(500);
await snap('14-site-survey-dialog');
await page.evaluate(dispatch, { type: 'site-survey/closeDialog' });

await page.evaluate(dispatch, { type: 'show/openTakeoffAreaSetupDialog' });
await sleep(250);
await snap('15-takeoff-area-setup-dialog');
await page.evaluate(dispatch, { type: 'show/closeTakeoffAreaSetupDialog' });

await page.evaluate(dispatch, {
  type: 'upload/openUploadDialogForJob',
  payload: { job: { type: 'showUpload' } },
});
await sleep(250);
await snap('16-upload-dialog');
await page.evaluate(dispatch, { type: 'upload/closeUploadDialog' });

await page.evaluate(dispatch, {
  type: 'show/openOnboardPreflightChecksDialog',
});
await sleep(250);
await snap('17-onboard-preflight-checks-dialog');
await page.evaluate(dispatch, {
  type: 'show/closeOnboardPreflightChecksDialog',
});

await page.evaluate(dispatch, {
  type: 'show/openManualPreflightChecksDialog',
});
await sleep(250);
await snap('18-manual-preflight-checks-dialog');
await page.evaluate(dispatch, {
  type: 'show/closeManualPreflightChecksDialog',
});

// await page.locator("text/Choose start time").click();
await page.evaluate(dispatch, { type: 'show/openStartTimeDialog' });
await sleep(250);
await snap('19-start-time-dialog');
await page.evaluate(dispatch, { type: 'show/closeStartTimeDialog' });

await page.evaluate(dispatch, {
  type: 'show/setShowAuthorization',
  payload: true,
});
await sleep(250);
await snap('20-show-authorization');

await page.evaluate(dispatch, {
  type: 'uav-details/openUAVDetailsDialog',
  payload: '0',
});
await sleep(250);
await snap('21-uav-details-dialog');
await page.evaluate(dispatch, { type: 'uav-details/closeUAVDetailsDialog' });

await sleep(250);

await page.click('.lm_tab[title="Layers"]');
await sleep(250);
await snap('22-layers-panel');

await page.click('.lm_tab[title="UAVs"]');
await sleep(250);
await snap('23-uavs-panel');

await page.click('.lm_tab[title="Light control"]');
await sleep(250);
await snap('24-light-control-panel');

await page.click('#header-inner > :first-child');
await sleep(250);
await snap('25-sidebar');

await browser.close();
