var debug = require("local-debug")('browserify');
var extname = require('path').extname;
var browserify = require('browserify');
var watchify = require('watchify');
var path = require("path");

var transformMap = {
  '.coffee': 'coffeeify',
  '.gs': 'gorillaify',
  '.iced': 'icsify',
  '.ls': 'liveify',
  '.coco': 'cocoify',
  '.ts': 'typescriptifier'
};

var browserifyOpts = {
  debug: true,
  cache: {},
  packageCache: {},
  fullPaths: true
};

module.exports = function (files, command) {
  if (command.browserify) return proxyBrowserify(files)

  var ext = extname(files[0]);
  var transform = ext != '.js';
  var ret;

  var b = browserify(browserifyOpts);

  b.add(files);
  b.bundle();

  if (transform) {
    ret = watchify(b, { extensions: [ext, '.js', '.json'] });
  } else {
    ret = watchify(b);
  }

  if (transform) ret.transform(transformMap[ext]);

  if (command.transform && command.transform.length) {
    command.transform.split(',').forEach(function (name) {
      if (!name) return;
      debug('Transform "%s" enabled', name);
      ret.transform(path.join(process.cwd(), 'node_modules', name));
    });
  }

  if (command.plugin && command.plugin.length) {
    command.plugin.split(',').forEach(function (name) {
      if (!name) return;
      debug('Plugin "%s" enabled', name);
      ret.plugin(require(path.join(process.cwd(), 'node_modules', name)));
    });
  }

  return ret;
};

function proxyBrowserify(files){
  var fromArgs = require('browserify/bin/args');
  var argv = [];

  for (var i=0; i<process.argv.length - 1; i++) {
    if (process.argv[i] === '--browserify' ) {
      argv = process.argv[i+1].split(' ');
      break;
    }
  }

  var b = fromArgs(argv, browserifyOpts);

  b.add(files);
  b.bundle();

  return watchify(b);
};
