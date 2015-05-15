// Copyright (c) 2014 Patrick Dubroy <pdubroy@gmail.com>
// This software is distributed under the terms of the MIT License.

/* global process */

'use strict';

var assert = require('assert'),
    commonmark = require('commonmark'),
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

function startswith(str, prefix) {
  return str.indexOf(prefix) === 0;
}

// If the given AST node appears to be executable in Markscript, return the
// code to be executed, otherwise return null.
function getExecutableContents(node) {
  // Detect <script> tags that should be executed by Markscript.
  // This is not an HTML parser! The script tag must be well formed, and must
  // have the attribute 'type="text/markscript"' as its first attribute.
  if (node.t === 'HtmlBlock') {
    var content = node.string_content.trim();
    if (startswith(content, '<script type="text/markscript"')) {
      // Strip off the opening and closing <script> tags.
      var start = content.indexOf('>') + 1;
      var end = content.lastIndexOf('</');
      if (start > 0 && end > 0) {
        return content.slice(start, end);
      }
    }
  }
  if (node.t === 'FencedCode' &&
      ['', 'js', 'javascript'].indexOf(node.info) >= 0) {
    return node.string_content;
  }
  return null;
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

// Expose all the console methods to scripts.
/* eslint-disable no-console */
Environment.prototype.console = {
  log: console.log,
  info: console.info,
  error: console.error,
  warn: console.warn
};
/* eslint-enable no-console */

// Expose `assert` to scripts since it's really handy.
Environment.prototype.assert = assert;

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
    var script = getExecutableContents(node);
    if (script != null) {
      var cwd = process.cwd();
      if (config.workingDir !== cwd) {
        process.chdir(config.workingDir);
      }
      result = vm.runInNewContext(script, env, filename);
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
