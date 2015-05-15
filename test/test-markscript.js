/* eslint-env node */

'use strict';

var assert = require('assert'),
    fs = require('fs'),
    fork = require('child_process').fork,
    join = require('path').join,
    test = require('tape');

var evaluate = require('../lib/markscript').evaluate;

function evaluateFile(filename) {
  var path = join(__dirname, filename);
  return evaluate(fs.readFileSync(path, 'utf-8'));
}

function readAll(stream, cb) {
  var content = '';
  stream.on('data', function(buf) { content += buf.toString(); });
  stream.on('end', function() { cb(content); });
}

test('basic', function(t) {
  t.equal(evaluateFile('data/test1.md'), 3, 'test1.md');
  t.equal(evaluateFile('data/test2.md'), 'joy!', 'test2.md');

  t.throws(function() { evaluate('```\nthrow new Error("oops");'); }, /oops/);
  t.throws(function() { evaluate('```\ndoesn\'t parse'); }, /SyntaxError/);

  t.equal(evaluate('    non-fenced code\n    block\n', undefined));
  t.equal(evaluate('```javascript\n3'), 3, 'can specify language in info string');
  t.equal(evaluate('```js\n3'), 3, "works when language is 'js'");
  t.equal(evaluate('```blah\nNot#js'), undefined, 'other languages are ignored');

  t.equal(evaluate('Some `inline code`'), undefined);

  t.end();
});

test('assert', function(t) {
  t.equal(evaluate('```\nassert(true); "ok"'), 'ok', 'assert works');
  t.equal(evaluate('```\nassert.equal(true, true); "ok"'), 'ok', 'assert works');
  t.equal(evaluate('```\nassert.ok(true); "ok"'), 'ok', 'assert works');

  t.throws(function() {
    evaluate('```\nassert(false); "ok"');
  }, /AssertionError/, 'assert is not caught by markscript');

  t.end();
});

test('hidden scripts', function(t) {
  var input = ['<script type="text/markscript">var deadbeef, x = 4;</script>',
               '',
               '```',
               'typeof x'].join('\n');
  t.equal(evaluate(input), 'number', '<script> tag is executed');

  var newInput = input.replace('markscript', 'fooscript');
  t.equal(evaluate(newInput), 'undefined', 'not executed when type is wrong');

  newInput = input.replace('type=', 'foo="bar" type=');
  t.equal(evaluate(newInput), 'undefined', 'not executed without type attr');

  newInput = input.replace('markscript', 'markscript" anotherAttr="foo');
  t.equal(evaluate(newInput), 'number', 'executed with extra attrs');

  newInput = input.replace('</script>', '</script\t\t>');
  t.equal(evaluate(newInput), 'number', 'executed with weird end tag');

  newInput = input.replace('<script>', '  <script>');
  t.equal(evaluate(newInput), 'number', 'executed with leading spaces');

  t.end();
});

function runCli(args) {
  return fork('cli.js', args, { silent: true });
}

function assertEmpty(stream, message) {
  readAll(stream, function(data) {
    assert.equal(data.length, 0, message);
  });
}

test('cli', function(t) {
  var p = runCli([]);
  readAll(p.stdout, function(out) { t.ok(/Usage/.exec(out)); });
  assertEmpty(p.stderr, 'stderr should be empty');

  p = runCli(['test/data/test1.md']);
  assertEmpty(p.stdout, 'successful run produces no output');
  assertEmpty(p.stderr, 'stderr should be empty');

  p = runCli(['README.md']);
  assertEmpty(p.stdout, 'README produces no output');
  assertEmpty(p.stderr, 'README produces no errors');

  t.end();
});
