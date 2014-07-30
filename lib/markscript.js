// Copyright (c) 2014 Patrick Dubroy <pdubroy@gmail.com>
// This software is distributed under the terms of the MIT License.

var assert = require('assert'),
    commonmark = require('commonmark'),
    Module = require('module'),
    vm = require('vm'),
    walk = require('tree-walk');

var parser = new commonmark.DocParser();

// Environment
// -----------

function Environment(filename) {
  var mod = this.module = new Module(filename);
  this.console = {
    log: console.log,
    info: console.info,
    error: console.error,
    warn: console.warn
  };
  this.require = function(path) {
    return mod.require(path);
  };
}

// Exports
// -------

// Parse `input` as Markdown, as executes the code in every fenced code block
// in order. Returns the value of the last expression in the last block.
function evaluate(input, filename) {
  var ast = parser.parse(input);
  var walker = walk(function(node) {
    if (node.inline_content) {
      assert(node.children.length === 0);
      return node.inline_content;
    }
    return node.children;
  });

  var env = new Environment(filename);
  var result;
  walker.preorder(ast, function(node, key, parent) {
    if (node.t === 'FencedCode')
      result = vm.runInNewContext(node.string_content, env, filename);
  });
  return result;
}

module.exports = {
  evaluate: evaluate
};
