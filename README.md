grubfs
======

Install NodeJS and the Node Package Manager (npm) via your package manager e.g.

```
sudo apt-get install nodejs npm
```

If you have problems you may want to install it directly from the NodeJS site instead.

Use npm to install the other dependencies:

```
npm install
npm install -g grunt-cli browserify mocha dalek-cli
```

Start Grunt and the development server. The grunt task will rebuild client source code when changes are made and the server will restart when changes are made.

```
grunt
npm run-script dev
```

View server at localhost:8080 and hack away.
