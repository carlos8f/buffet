
/*!
 * gzip-buffer
 * Copyright(c) 2011 Russell Bradberry <rbradberry@gmail.com>
 * MIT Licensed
 */
var zlib = require('zlib'),
    Stream = require('stream').Stream,
    util = require('util');

/**
 * Collects a stream into a buffer and when the stream ends it emits the collected buffer
 * @constructor
 * @private
 */
var StreamCollector = function(){
  this.writable = true;
  this._data = new Buffer(0);
};
util.inherits(StreamCollector, Stream);

/**
 * Writes data to the buffer
 * @param {Object} chunk The chunk to buffer
 */
StreamCollector.prototype.write = function(chunk){
  if (chunk !== undefined){
    if (!Buffer.isBuffer(chunk)){
      chunk = new Buffer(chunk);
    }
    
    var newBuffer = new Buffer(chunk.length + this._data.length);
    
    this._data.copy(newBuffer);
    chunk.copy(newBuffer, this._data.length);

    this._data = newBuffer;
  }
};

/**
 * Ends the stream writing the final chunk
 * @param {Object} chunk The chunk to buffer
 */
StreamCollector.prototype.end = function(chunk){
  this.write(chunk);
  this.emit('end', this._data);
};

/**
 * Creates the StreamCollector, zips or unzips it and calls back with the data
 * @param {Object} data The data to zip or unzip
 * @param {Object} gz The zipping mechanism
 * @param {Function} callback The callback to call once the stream has finished
 * @private
 */
function process(data, gz, options, callback){
  var stream = new StreamCollector();
  
  if (typeof options === 'function'){
    callback = options;
    options = null;
  }
  
  callback = callback || function(){};
  gz = gz(options);
  
  stream.on('end', function(data){
    callback(null, data);
  });

  gz.pipe(stream);
  gz.end(data);
}

/**
 * Compresses data using deflate and calls back with the compressed data
 * @param {Object} data The data to compress
 * @param {Object} options Options to pass to the zlib class
 * @param {Function} callback The callback function that returns the data
 */
exports.deflate = function(data, options, callback){
  process(data, zlib.createDeflate, options, callback);
};

/**
 * Uncompresses data using inflate and calls back with the compressed data
 * @param {Object} data The data to uncompress
 * @param {Object} options Options to pass to the zlib class
 * @param {Function} callback The callback function that returns the data
 */
exports.inflate = function(data, options, callback){
  process(data, zlib.createInflate, options, callback);
};

/**
 * Compresses data using deflateRaw and calls back with the compressed data
 * @param {Object} data The data to compress
 * @param {Object} options Options to pass to the zlib class
 * @param {Function} callback The callback function that returns the data
 */
exports.deflateRaw = function(data, options, callback){
  process(data, zlib.createDeflateRaw, options, callback);
};

/**
 * Uncompresses data using inflateRaw and calls back with the compressed data
 * @param {Object} data The data to uncompress
 * @param {Object} options Options to pass to the zlib class
 * @param {Function} callback The callback function that returns the data
 */
exports.inflateRaw = function(data, options, callback){
  process(data, zlib.createInflateRaw, options, callback);
};

/**
 * Compresses data using gzip and calls back with the compressed data
 * @param {Object} data The data to compress
 * @param {Object} options Options to pass to the zlib class
 * @param {Function} callback The callback function that returns the data
 */
exports.gzip = function(data, options, callback){
  process(data, zlib.createGzip, options, callback);
};

/**
 * Uncompresses data using gunzip and calls back with the compressed data
 * @param {Object} data The data to uncompress
 * @param {Object} options Options to pass to the zlib class
 * @param {Function} callback The callback function that returns the data
 */
exports.gunzip = function(data, options, callback){
  process(data, zlib.createGunzip, options, callback);
};

/**
 * Uncompresses data using the header of the data and calls back with the compressed data
 * @param {Object} data The data to uncompress
 * @param {Object} options Options to pass to the zlib class
 * @param {Function} callback The callback function that returns the data
 */
exports.unzip = function(data, options, callback){
  process(data, zlib.createUnzip, options, callback);
};

/**
 * Library version.
 */
exports.version = '0.0.2';