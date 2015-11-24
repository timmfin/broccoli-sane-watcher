var Promise = require('rsvp').Promise;

var Plugin = require('broccoli-plugin');
var path = require('path');

TestFilter.prototype = Object.create(Plugin.prototype);
TestFilter.prototype.constructor = TestFilter;

function TestFilter(inputNodes, outputFunc) {
  Plugin.call(this, inputNodes, {});
  this.outputFunc = outputFunc;
}

TestFilter.prototype.build = function () {
  this.outputFunc();
};

module.exports = TestFilter;
