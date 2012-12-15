var uglifyjs = require('uglify-js');
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

var dst = 'mapwith';

var canonical = function (name) {
  return 'client/' + name + '.js';
}

var canonicalDst = function (name) {
  return 'client/' + name + '.js';
}

var canonicalMinDst = function (name) {
  return 'client/' + name + '.min.js';
}

//desc('Create distribution directory');
//directory('dist');

desc('Concatenate source files');
task('concat', [], function () {
  var files = [];
  src.forEach(function (file) {
    files.push(canonical(file));
  });
  var out = files.map(function (file) {
    return fs.readFileSync(file, 'utf-8');
  });
  fs.writeFileSync(
    canonicalDst(dst), 
    out.join('\n'), 
    'utf-8'
  );
});

desc('Minify final source file');
task('min', ['concat'], function () {
  var result = uglifyjs.minify([canonicalDst(dst)]); 
  fs.writeFileSync(
    canonicalMinDst(dst), 
    result.code, 
    'utf-8'
  );
});

task('default', ['concat']);
