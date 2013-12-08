grubfs
======

Install dependencies:

```
npm install
npm install -g grunt-cli
npm install -g browserify
```
Install testing tools:

```
npm install -g dalek-cli
npm install grunt-dalek --save-dev
npm install dalekjs --save-dev
```
Run jshint and build client-side script:

```
grunt
```

Start development server:

```
npm run-script dev
```

View server at localhost:8080.

Run tests (they should also run on grunt):
```
dalek test/test.js
```
