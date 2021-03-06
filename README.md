# Markscript

Markscript is a tool for executing JavaScript embedded in Markdown files. It's
useful for writing executable documentation, or "[literate-style][lp]"
JavaScript code. You can run Markscript as part of your build process to make
sure that your documentation is up-to-date.

[lp]: http://en.wikipedia.org/wiki/Literate_programming

[![NPM](https://nodei.co/npm/markscript.png?compact=true)](https://nodei.co/npm/markscript/)

## Installation

`npm install markscript`

## Usage

`markscript FILES...`

This will run Markscript on each of the given files, executing any JavaScript
code that is found in a [fenced code block](http://spec.commonmark.org/0.12/#fenced-code-blocks).
The blocks are executed individually, but every block in a file shares the
same global environment. This means that you can do something like this:

```
var x = 'fan';
```

and then refer to `x` in a separate block:

```
var y = x + 'tastisch';
```

You can also use `require` and `console.log`, just like a regular Node script:

```
require('assert').equal(y, 'fantastisch');
```

Oh, in case it wasn't obvious -- this README itself an example of executable
documentation. This project's tests will fail if the assertion above fails, or
if any other errors occur.

## Development

After checking out the source, run `npm install` in the project directory to
install the dev dependencies. Use `npm test` to run the tests, or
`npm run test-continuous` to have them run every time the code changes.

Before submitting a pull request, please run `npm run prepublish` to make
sure that the tests pass and there are no lint warnings. You can do this
automatically on every commit by copying `bin/pre-commit` to the `.git/hooks`
directory in your Git checkout.
