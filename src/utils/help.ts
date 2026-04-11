import config from 'config';

export const isHelpAvailable = Boolean(config.urls.help);

/**
 * Function that opens the URL designated for the online help in a new window.
 */
export const showHelp = () => {
  if (config.urls.help) {
    window.open(config.urls.help, '_blank');
  }
};
