const { app, Menu, shell } = require('electron');
const {
  aboutMenuItem,
  appMenu,
  is,
  openUrlMenuItem,
} = require('electron-util');

const { showAppSettingsDialog } = require('./dispatcher');

const helpSubmenu = [
  openUrlMenuItem({
    label: 'Website',
    url: 'https://skybrush.io',
  }),
];

const preferencesItem = {
  label: 'Preferences…',
  accelerator: 'Command+,',
  click: () => showAppSettingsDialog(),
};

const macOsMenuTemplate = [
  appMenu([preferencesItem]),
  {
    role: 'editMenu',
  },
  {
    role: 'windowMenu',
  },
  {
    role: 'help',
    submenu: helpSubmenu,
  },
];

const linuxWindowsMenuTemplate = [
  {
    label: 'File',
    submenu: [preferencesItem, { type: 'separator' }, { role: 'quit' }],
  },
  {
    role: 'editMenu',
  },
  {
    role: 'windowMenu',
  },
  {
    role: 'help',
    submenu: helpSubmenu,
  },
];

if (!is.macos) {
  helpSubmenu.push(
    { type: 'separator' },
    aboutMenuItem({
      copyright: 'Copyright © CollMot Robotics',
    })
  );
}

const template = is.macos ? macOsMenuTemplate : linuxWindowsMenuTemplate;

if (!app.isPackaged) {
  template.push({
    label: 'Debug',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { role: 'toggledevtools' },
      { type: 'separator' },
      {
        label: 'Show App Data',
        async click() {
          await shell.openPath(app.getPath('userData'));
        },
      },
      {
        label: 'Delete App Data',
        async click() {
          await shell.trashItem(app.getPath('userData'));
          app.relaunch();
          app.quit();
        },
      },
    ],
  });
}

module.exports = () => Menu.buildFromTemplate(template);
