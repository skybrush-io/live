Skybrush Live
=============

This is the official desktop and web frontend for the Skybrush server.

Steps to install
----------------

1. Install Node.js and `npm` (the Node.js Package Manager). Note that Ubuntu
   Linux may contain an old version of Node.js at the time of writing and we
   need a recent one, so you need to run the following from the command line:

   ```sh
   curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

   If you are running Windows, you should probably download an installer from
   [here](https://nodejs.org/en/download/) that contains both.

2. Install all the dependencies of `skybrush-live` by running `npm install`
   from a fresh checkout of the repository.
   _(Note for Windows: For some reason the `PATH` environment variable of
   `cmd` is not always the same as the one in `PowerShell`, so you may have
   to use the latter one or alternatively `git-shell` for the command above
   to run properly.)_

3. Copy `.env.example` to `.env` and include your Bing Maps / Mapbox / Mapzen
   API key in it if you want to support these map providers. (None of them
   are required).

4. Start a development web server with `npm start` inside `skybrush-live`, and
   navigate to http://localhost:8080 from your browser. Alternatively, run
   `npm run start:electron` to run Skybrush Live within its own desktop app
   window.

