grubfs
======

Install NodeJS and the Node Package Manager (npm) via your package manager e.g.

```
sudo apt-get install nodejs
sudo apt-get install npm
```
Install testing tools:

```
npm install -g mocha
npm install -g dalek-cli
npm install grunt-dalek --save-dev
npm install dalekjs --save-dev
```

Use npm to install the other dependencies:

```
npm install
npm install -g grunt-cli
npm install -g browserify
```

Start Grunt and the development server. The grunt task will rebuild client source code when changes are made and the server will restart when changes are made.

```
grunt
npm run-script dev
```

View server at localhost:8080 and hack away.
