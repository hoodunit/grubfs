grubfs
======

Install NodeJS and the Node Package Manager from the nodejs site: http://nodejs.org/download/. I.e. download the appropriate binaries and add the bin directory to your path. The version in your package manager may be out of date so it's better to grab it directly.

Clone the repo and use npm to install the other dependencies:

```
git clone <repo url>
cd grubfs
npm install
npm install -g grunt-cli browserify mocha dalek-cli
```

Start Grunt and the development server. The grunt task will rebuild client source code when changes are made and the server will restart when changes are made.

```
grunt
npm run-script dev
```

View server at localhost:8080 and hack away.
