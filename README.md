grubfs
======

Install NodeJS and the Node Package Manager from the nodejs site: http://nodejs.org/download/. I.e. download the appropriate binaries and add the bin directory to your path. The version in your package manager may be out of date so it's better to grab it directly.

Clone the repo and use npm to install the other dependencies:

```
git clone <repo url>
cd grubfs
npm install
npm install -g grunt-cli browserify dalek-cli mocha-phantomjs
```

Start Grunt and the development server. The grunt task rebuilds client source code and should be run after changes are made. The server will restart automatically when changes are made.

```
grunt
npm run-script dev
```

View server at localhost:8080 and hack away.

If you grab new changes from GitHub and it complains about missing packages, run

```
npm install
```

This will install any packages defined in package.json under dependencies or devDependencies. Any dependencies you use should also be added to package.json. Global dependencies need to be installed separately.
