import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import Constants from './BufferManager/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var forwarded = ['getMappedRange', 'mapAsync', 'unmap'];

function bufferSubData(device, destBuffer, destOffset, srcArrayBuffer) {
  var byteCount = srcArrayBuffer.byteLength;
  var srcBuffer = device.createBuffer({
    size: byteCount,

    /* eslint-disable no-undef */
    usage: GPUBufferUsage.COPY_SRC,

    /* eslint-enable no-undef */
    mappedAtCreation: true
  });
  var arrayBuffer = srcBuffer.getMappedRange(0, byteCount);
  new Uint8Array(arrayBuffer).set(new Uint8Array(srcArrayBuffer)); // memcpy

  srcBuffer.unmap();
  var encoder = device.createCommandEncoder();
  encoder.copyBufferToBuffer(srcBuffer, 0, destBuffer, destOffset, byteCount);
  var commandBuffer = encoder.finish();
  var queue = device.queue;
  queue.submit([commandBuffer]);
  srcBuffer.destroy();
} // ----------------------------------------------------------------------------
// vtkWebGPUBufferManager methods
// ----------------------------------------------------------------------------


function vtkWebGPUBuffer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUBuffer');

  publicAPI.create = function (sizeInBytes, usage) {
    model.handle = model.device.getHandle().createBuffer({
      size: sizeInBytes,
      usage: usage
    });
    model.sizeInBytes = sizeInBytes;
    model.usage = usage;
  };

  publicAPI.write = function (data) {
    bufferSubData(model.device.getHandle(), model.handle, 0, data.buffer);
  };

  publicAPI.createAndWrite = function (data, usage) {
    model.handle = model.device.getHandle().createBuffer({
      size: data.byteLength,
      usage: usage,
      mappedAtCreation: true
    });
    model.sizeInBytes = data.byteLength;
    model.usage = usage;
    new Uint8Array(model.handle.getMappedRange()).set(new Uint8Array(data.buffer)); // memcpy

    model.handle.unmap();
  }; // simple forwarders


  var _loop = function _loop(i) {
    publicAPI[forwarded[i]] = function () {
      var _model$handle;

      return (_model$handle = model.handle)[forwarded[i]].apply(_model$handle, arguments);
    };
  };

  for (var i = 0; i < forwarded.length; i++) {
    _loop(i);
  }
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  device: null,
  handle: null,
  sizeInBytes: 0,
  strideInBytes: 0,
  arrayInformation: null,
  usage: null,
  sourceTime: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Object methods

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['handle', 'sizeInBytes', 'usage']);
  macro.setGet(publicAPI, model, ['strideInBytes', 'device', 'arrayInformation', 'sourceTime']);
  vtkWebGPUBuffer(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend); // ----------------------------------------------------------------------------

var vtkWebGPUBuffer$1 = _objectSpread({
  newInstance: newInstance,
  extend: extend
}, Constants);

export { vtkWebGPUBuffer$1 as default, extend, newInstance };
