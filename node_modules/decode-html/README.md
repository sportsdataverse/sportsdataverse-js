# decode-html

- decode html entities
- tiny function that replaces the html entities for the chars: "<", ">", "''", "&"

# install
```shell
npm install decode-html
```

# use
```javascript
var decode = require('decode-html');

console.log(decode('&lt;div class="hidden"&gt;NON&amp;SENSE&apos;s&lt;/div&gt;'));
// -> '<div class="hidden">NON&SENSE\'s</div>'

```
> (opposite) encode function [encode-html](https://www.npmjs.com/encode-html)

# test
```shell
npm test
```

# license
MIT

# author
Andi Neck | [@andineck](https://twitter.com/andineck) | intesso