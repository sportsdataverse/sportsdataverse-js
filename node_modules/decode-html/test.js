var decode = require('./index');
var test = require('tape');

test('should have an apostrophe', function(t) {
  var text = 'SENSE &apos; s';
  var decoded = decode(text);

  t.equal(decoded, "SENSE ' s");
  t.end();
});

test('should have "< > \' &(single)" ', function(t) {
  var text = '&lt;div class="hidden"&gt;NON&amp;SENSE&apos;s&lt;/div&gt;';
  var decoded = decode(text);

  t.equal(decoded, '<div class="hidden">NON&SENSE\'s</div>');
  t.end();
});