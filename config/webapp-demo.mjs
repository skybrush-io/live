import React from 'react';
import demoShowUrl from '~/../assets/shows/demo.skyc';

/**
 * @file Application configuration at startup, suitable for the web app demo deployment.
 */

const overrides = {
  // We bundle an example show with the webapp demo but not with the "real" one
  examples: [
    {
      id: 'example-20',
      title: 'Example show with 20 drones',
      url: demoShowUrl,
    },
  ],

  // Enable the loading of the bundled example show
  features: {
    loadShowFromCloud: true,
  },

  // Defaults are suitable for the web app demo deployment. Connects back to the
  // same hostname and port by default, and does not allow overriding the
  // hostname and port from the dialog.
  server: {
    connectAutomatically: true,
    preventManualSetup: true,
  },

  // Session setup
  session: {
    maxLengthInSeconds: 3600,
  },

  // Tour setup customized to suit the default screen of the web app
  tour: {
    steps: [
      {
        selector: '#tour-welcome',
        content: (
          <>
            <b>Welcome to Skybrush Live!</b>
            <p>
              This online demo allows you to command a simulated fleet of 20
              drones to perform a drone light show, just like you would do it
              with the full version of the application.
            </p>
            <p>
              Let us walk you through a basic introduction of the user interface
              first.
            </p>
          </>
        ),
      },
      {
        selector: '#main-map-view',
        content: (
          <>
            <b>This is the map view of Skybrush Live.</b>
            <p>
              Right now it is positioned at Farkashegy Airfield near Budapest,
              Hungary, where we routinely test our drone shows.
            </p>
            <p>
              The tabs above the main map view allow you to switch to a list
              view showing the drones in your drone fleet, or to a real-time 3D
              visualization of the show.
            </p>
          </>
        ),
      },
      {
        selector: '#sidebar',
        content: (
          <>
            In fact, the entire user interface of Skybrush Live is based on tabs
            that you can freely resize and rearrange to build a layout that is
            the most convenient to you.
            <p>
              You can find the modules of the user interface in the sidebar.
              Drag one of the modules to the workspace to add it as a new tab,
              or just click on it to let Skybrush pick a suitable space for it.
            </p>
          </>
        ),
      },
      {
        selector: '#show-file-upload',
        content: (
          <>
            <b>Now, let&apos;s get down to business!</b>
            <p>
              This button lets you open a drone show in Skybrush (
              <code>.skyc</code>) format from your hard drive.
            </p>
            <p>
              If you do not have a compiled drone show file yet, you can use the
              &quot;cloud&quot; button instead to load one of our example shows.
            </p>
          </>
        ),
      },
      {
        selector: '#tour-show-control',
        content: (
          <>
            You need the rest of the <b>Show control</b> panel to set up the
            takeoff grid, upload the flight trajectories and light programs to
            the drones, perform automatic and manual preflight checks, and
            finally, to set the start time of the show.
            <p>
              If you get stuck, just <b>look for the blue lights</b> — they
              always show you the next step to take.
            </p>
          </>
        ),
      },
      {
        selector: '#tour-help-button',
        content: (
          <>
            <b>Help is always just one click away.</b>
            <p>
              If you get stuck, click on the Help button in the header to open a
              detailed tutorial about setting up a drone show in Skybrush Live.
            </p>
          </>
        ),
      },
    ],
  },

  urls: {
    exit: 'https://account.skybrush.io',
  },
};

export default overrides;
