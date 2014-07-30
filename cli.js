#!/usr/bin/env node

var commander = require('commander'),
    fs = require('fs'),
    markscript = require('./lib/markscript');

var version = require('./package.json').version;

commander.version(version)
    .usage('[options] files')
    .parse(process.argv);

if (commander.args.length) {
  var args = commander.args;
  for (var i = 0; i < args.length; ++i) {
    markscript.evaluate(fs.readFileSync(args[i], 'utf-8'));
  }
} else {
  console.log(commander.helpInformation());
}
