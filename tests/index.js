var fs = require('fs');
var broccoli = require('broccoli');
var rimraf = require('rimraf');
var assert = require("assert");
var Watcher = require('..');
var TestFilter = require('./test_filter');
var Promise = require('rsvp').Promise;
var path    = require('path');
var sane = require('sane');

describe('broccoli-sane-watcher', function (done) {
  var watcher;

  beforeEach(function () {
    fs.mkdirSync('tests/fixtures');
  });

  afterEach(function (done) {
    if (watcher) {
      watcher.close();
      watcher = null;
    }
    rimraf('tests/fixtures', done);
  });

  it('should pass poll option to sane', function () {
    fs.mkdirSync('tests/fixtures/a');
    var filter = new TestFilter(['tests/fixtures/a'], function () {
      return 'output';
    });
    var builder = new broccoli.Builder(filter);

    watcher = new Watcher(builder, {
      poll: true
    });

    return watcher.sequence.then(function () {
      assert.ok(watcher.watched['tests/fixtures/a'] instanceof sane.PollWatcher);
    });
  });

  it('should emit change event when file is added', function (done) {
    fs.mkdirSync('tests/fixtures/a');

    var changes = 0;

    var filter = new TestFilter(['tests/fixtures/a'], function () {
      return 'output';
    });

    var builder = new broccoli.Builder(filter);
    watcher = new Watcher(builder);
    watcher.on('change', function () {
      if (changes++) {
        done();
      } else {
        fs.writeFileSync('tests/fixtures/a/file.js');
      }
    });

    watcher.on('error', function (error) {
      assert.ok(false, error.message);
      done();
    });
  });

  it('should emit an error when a filter errors', function (done) {
    fs.mkdirSync('tests/fixtures/a');
    var filter = new TestFilter(['tests/fixtures/a'], function () {
      throw new Error('filter error');
    });
    var count = 0;
    var builder = new broccoli.Builder(filter);
    watcher = new Watcher(builder);
    watcher.on('change', function () {
      count++;
      assert.equal(count, 2, "only the second build should be here");
      done();
    });
    watcher.on('error', function (error) {
      count++;
      assert.equal(count, 1, "only the first build should be here");
      if (count !== 1) done();
      // next result shouldn't fail
      filter.outputFunc = function () {
        return 'output';
      };
      // trigger next build
      fs.writeFileSync('tests/fixtures/a/file.js');
    });
  });

  it('should emit a pleasant error when attempting to watch a missing directory', function () {
    var builder = new broccoli.Builder('test/fixtures/b');

    assert.throws(function() {
      var watcher = new Watcher(builder)
    }, /Attempting to watch missing directory: test\/fixtures\/b/)
  });
});
