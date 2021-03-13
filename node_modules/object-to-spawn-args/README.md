[![view on npm](http://img.shields.io/npm/v/object-to-spawn-args.svg)](https://www.npmjs.org/package/object-to-spawn-args)
[![npm module downloads](http://img.shields.io/npm/dt/object-to-spawn-args.svg)](https://www.npmjs.org/package/object-to-spawn-args)
[![Build Status](https://travis-ci.org/75lb/object-to-spawn-args.svg?branch=master)](https://travis-ci.org/75lb/object-to-spawn-args)
[![Dependency Status](https://badgen.net/david/dep/75lb/object-to-spawn-args)](https://david-dm.org/75lb/object-to-spawn-args)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

# object-to-spawn-args

Converts an options object to an array suitable for passing to `child_process.spawn()`.

Single letter object properties (e.g. `c: 'red'`) convert to short-option args (e.g. `-c red`). Longer object properties (e.g. `colour: 'red'`) convert to long-option args (e.g. `--colour red`). Object property values equalling `true` convert to flags (e.g. `-l`).

## Synopsis

Simple usage:

```js
> const objectToSpawnArgs = require('object-to-spawn-args')

> const spawnArgs = objectToSpawnArgs({
  l: true,
  c: 'red',
  name: 'pete',
  tramp: true
})

> console.log(spawnArgs)
[ '-l', '-c', 'red', '--name', 'pete', '--tramp' ]
```

Alternatively, convert to `--object=value` notation.

```js
> const options = {
  l: true,
  c: 'red',
  name: 'pete',
  tramp: true
}
> const spawnArgs = objectToSpawnArgs(options, { optionEqualsValue: true })

> console.log(spawnArgs)
[ '-l', '-c=red', '--name=pete', '--tramp' ]
```

Typical real-life example.

```js
const objectToSpawnArgs = require('object-to-spawn-args')
const spawn = require('child_process').spawn

const options = {
  l: true,
  a: true
}

spawn('ls', objectToSpawnArgs(options), { stdio: 'inherit' })
```

## Installation

```sh
$ npm install object-to-spawn-args
```

* * *

&copy; 2014-19 Lloyd Brookes \<75pound@gmail.com\>.
