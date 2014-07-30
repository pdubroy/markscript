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

test('basic', function (t) {
  t.equal(evaluateFile('data/test1.md'), 3, 'test1.md');
  t.equal(evaluateFile('data/test2.md'), 'joy!', 'test2.md');

  t.throws(function() { evaluate('```\nthrow new Error("oops");'); }, /oops/);
  t.throws(function() { evaluate('```\ndoesn\'t parse'); }, /SyntaxError/);

  t.equal(evaluate('    non-fenced code\n    block\n', undefined));
  t.equal(evaluate('```blah\n3'), 3, 'info string is ignored');

  t.equal(evaluate('Some `inline code`'), undefined);

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

  t.end();
});
