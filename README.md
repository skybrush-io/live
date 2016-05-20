flockwave-web
=============

This is the official web frontend for the Flockwave server.

Steps to install
----------------

1. Install Node.js and ``npm`` (the Node.js Package Manager); see the
   instructions [here](https://docs.npmjs.com/getting-started/installing-node).
   If you are on Ubuntu Linux, it is probably enough to run ``sudo apt-get
   install nodejs npm``; see also
   [here](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-an-ubuntu-14-04-server).

2. Install [Babel.js](http://babeljs.io/): ``npm install -g babel-cli``. This
   will install the command line interface of Babel _globally_; we need that
   because some JavaScript modules that we check out from Github need a global
   installation of Babel.

3. Install all the dependencies of ``flockwave-web`` by running ``npm install``
   from a fresh checkout of the repository.

4. Start a development web server with ``npm start``.

5. Navigate to http://localhost:8080 from your browser.