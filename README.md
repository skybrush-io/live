flockwave-web
=============

This is the official web frontend for the Flockwave server.

Steps to install
----------------

1. Install Node.js and `npm` (the Node.js Package Manager). Note that Ubuntu
   Linux contains an old version of Node.js at the time of writing and we need
   a recent one, so you need to run the following from the command line:

   ```sh
   curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
   
   If you are running Windows, you should probably download installer from
   [here](https://nodejs.org/en/download/) that contains both.

2. Install [Babel.js](http://babeljs.io/): `npm install -g babel-cli`.
   <sup>[1](#global-install-footnote)</sup>
   This will install the command line interface of Babel _globally_; we need that
   because some JavaScript modules that we check out from Github need a global
   installation of Babel.

3. Install all the dependencies of `flockwave-web` by running `npm install`
   from a fresh checkout of the repository.  
   _(Note for Windows: For some reason the `PATH` environmental variable of
   `cmd` is not always the same as the one in `PowerShell`, so you may have
   to use the latter one or alternatively `git-shell` for the command above
   to run properly.)_

4. Place a `production.js` file (or if you'd like,
   you can specify other names via the environmental variable `NODE_ENV`)
   into the `config` folder based on the `production.js.sample` format,
   and include your Bing Maps API key inside it.

5. Start a development web server with `npm start` inside `flockwave-web`.

6. Navigate to http://localhost:8080 from your browser.

<a name="global-install-footnote">1</a>: You may need to run this command with elevated rights to succesfully install a package globally.  
In case you would prefer to avoid using sudo for global installs: [https://docs.npmjs.com/getting-started/fixing-npm-permissions](https://docs.npmjs.com/getting-started/fixing-npm-permissions)
