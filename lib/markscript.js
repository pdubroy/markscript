// Copyright (c) 2014 Patrick Dubroy <pdubroy@gmail.com>
// This software is distributed under the terms of the MIT License.

/* global process */

'use strict';

var commonmark = require('commonmark'),
    fs = require('fs'),
    Module = require('module'),
    vm = require('vm'),
    walk = require('tree-walk');

var parser = new commonmark.DocParser();

var DEFAULT_CONFIG = {
  globals: {},
  moduleAliases: {},
  workingDir: process.cwd()
};

// Helpers
// -------

// Return true if the given AST node appears to be executable in Markscript.
function isExecutable(node) {
  return node.t === 'FencedCode' &&
      ['', 'js', 'javascript'].indexOf(node.info) >= 0;
}

function defaults(obj, defaultsObj) {
  for (var k in defaultsObj) {
    if (!(k in obj)) {
      obj[k] = defaultsObj[k];
    }
  }
  return obj;
}

// Environment
// -----------

function Environment(filename, config) {
  var mod = this.module = new Module(filename);
  this.require = function(modulePath) {
    var aliases = config.moduleAliases;
    if (modulePath in aliases) {
      modulePath = aliases[modulePath];
    }
    return mod.require(modulePath);
  };
  for (var k in config.globals) {
    this[k] = config.globals[k];
  }
}

/* eslint-disable no-console */
Environment.prototype.console = {
  log: console.log,
  info: console.info,
  error: console.error,
  warn: console.warn
};
/* eslint-enable no-console */

// Exports
// -------

// Parse `input` as Markdown, as executes the code in every fenced code block
// in order. Returns the value of the last expression in the last block.
function evaluate(input, filename, optConfig) {
  var ast = parser.parse(input);
  var walker = walk('children');
  var config = defaults(optConfig || {}, DEFAULT_CONFIG);

  var env = new Environment(filename, config);
  var result;
  walker.preorder(ast, function(node, key, parent) {
    if (isExecutable(node)) {
      var cwd = process.cwd();
      if (config.workingDir !== cwd) {
        process.chdir(config.workingDir);
      }
      result = vm.runInNewContext(node.string_content, env, filename);
      process.chdir(cwd);
    }
  });
  return result;
}

function evaluateFile(filename, config) {
  return evaluate(fs.readFileSync(filename).toString(), filename, config);
}

module.exports = {
  evaluate: evaluate,
  evaluateFile: evaluateFile
};
