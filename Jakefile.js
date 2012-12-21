var JSHINT = require('jshint').JSHINT;
var uglifyjs = require('uglify-js');
var browserify = require('browserify');
var fs = require('fs');

var src = [
  'library',
  'globals',
  'content',
  'collab',
  'chat-window',
  'map',
  'search-field',
  'search',
  'share-button',
  'session-init-window',
  'session-join-window'
];

var lib = [
  'log',
  'parallel_load',
  'venue_merge'
];

var dst = 'mapwith';

var jshintOptions = {
  'expr': true,
  'laxbreak': true,
  'trailing': true,
  'white': true,
  'indent': 2
};

var jshintGlobals = {
  'document': false
};

var canonical = function (path, name) {
  return path + name + '.js';
};

var lint = function (file) {
  var code = fs.readFileSync(file, 'utf-8');
  var good = JSHINT(code, jshintOptions, jshintGlobals);
  if (!good) {
    JSHINT.errors.forEach(function (err) {
      var errString = file
        + ': line ' + err.line
        + ', col ' + err.character
        + ', ' + err.reason;
      console.log(errString);
    });
  }
  return good;
};

//desc('Create distribution directory');
//directory('dist');

desc('Concatenate source files');
task('concat', ['lint', 'lib'], function () {
  var out = src.map(function (file) {
    return fs.readFileSync(canonical('client/src/', file), 'utf-8');
  });
  fs.writeFileSync(
    canonical('client/dist/', dst),
    out.join('\n'),
    'utf-8'
  );
});

desc('Minify final source file');
task('min', ['concat'], function () {
  var out = uglifyjs.minify([canonical('client/dist/', dst)]);
  fs.writeFileSync(
    canonical('client/dist/', dst + '.min'),
    out.code,
    'utf-8'
  );
});

desc('Check for JSHint errors');
task('lint', [], function () {
  var srcGood = true;
  var libGood = true;
  src.forEach(function (file) {
    if (file !== 'library') {
      var good = lint(canonical('client/src/', file));
      if (!good) srcGood = false;
    }
  });
  lib.forEach(function (file) {
    var good = lint(canonical('lib/', file));
    if (!good) libGood = false;
  });
  if (!srcGood || !libGood) {
    fail('Need to solve JSHint errors.');
  }
});

desc('Browserify library files');
task('lib', [], function () {
  var b = browserify();
  b.require(canonical('./lib/', 'log'));
  var out = b.bundle();
  fs.writeFileSync(
    canonical('client/src/', 'library'),
    out,
    'utf-8'
  );
});


task('default', ['min']);
