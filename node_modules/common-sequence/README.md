[![view on npm](http://img.shields.io/npm/v/common-sequence.svg)](https://www.npmjs.org/package/common-sequence)
[![npm module downloads per month](http://img.shields.io/npm/dt/common-sequence.svg)](https://www.npmjs.org/package/common-sequence)
[![Build Status](https://travis-ci.org/75lb/common-sequence.svg?branch=master)](https://travis-ci.org/75lb/common-sequence)
[![Dependency Status](https://badgen.net/david/dep/75lb/common-sequence)](https://david-dm.org/75lb/common-sequence)

<a name="module_common-sequence"></a>

## common-sequence
Returns an array containing the initial elements which both input arrays have in common.

A common use-case for this is discovering common ancestors between two file paths.

```js
> commonSequence = require("common-sequence");

> pathA = "/Users/lloyd/Documents/75lb/dmd".split("/");
> pathB = "/Users/lloyd/Documents/75lb/array-tools".split("/");

> commonSequence(pathA, pathB).join("/");
'/Users/lloyd/Documents/75lb'
```

or a more trivial example:
```js
> a.commonSequence([ 1, 2, 3 ], [ 1, 2, 4 ])
[ 1, 2 ]
```

<a name="exp_module_common-sequence--commonSequence"></a>

### commonSequence(a, b) ⇒ <code>Array</code> ⏏
Returns the initial elements which both input arrays have in common

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| a | <code>Array</code> | first array to compare |
| b | <code>Array</code> | second array to compare |


### Load anywhere

This library is compatible with Node.js, the Web and any style of module loader. It can be loaded anywhere, natively without transpilation.

Node.js:

```js
const arrayify = require('common-sequence')
```

Within Node.js with ECMAScript Module support enabled:

```js
import arrayify from 'common-sequence'
```

Within an modern browser ECMAScript Module:

```js
import arrayify from './node_modules/common-sequence/index.mjs'
```

Old browser (adds `window.commonSequence`):

```html
<script nomodule src="./node_modules/common-sequence/dist/index.js"></script>
```

* * *

&copy; 2015-19 Lloyd Brookes \<75pound@gmail.com\>. Documented by [jsdoc-to-markdown](https://github.com/jsdoc2md/jsdoc-to-markdown).
