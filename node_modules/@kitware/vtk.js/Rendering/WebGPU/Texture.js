import macro from '../../macros.js';
import HalfFloat from '../../Common/Core/HalfFloat.js';
import vtkWebGPUBufferManager from './BufferManager.js';
import vtkWebGPUTextureView from './TextureView.js';
import vtkWebGPUTypes from './Types.js';

var BufferUsage = vtkWebGPUBufferManager.BufferUsage; // ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// vtkWebGPUTexture methods
// ----------------------------------------------------------------------------

function vtkWebGPUTexture(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUTexture');

  publicAPI.create = function (device, options) {
    model.device = device;
    model.width = options.width;
    model.height = options.height;
    model.depth = options.depth ? options.depth : 1;
    var dimension = model.depth === 1 ? '2d' : '3d';
    model.format = options.format ? options.format : 'rgbaunorm';
    /* eslint-disable no-undef */

    /* eslint-disable no-bitwise */

    model.usage = options.usage ? options.usage : GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST;
    /* eslint-enable no-undef */

    /* eslint-enable no-bitwise */

    model.handle = model.device.getHandle().createTexture({
      size: [model.width, model.height, model.depth],
      format: model.format,
      // 'rgba8unorm',
      usage: model.usage,
      dimension: dimension
    });
  };

  publicAPI.assignFromHandle = function (device, handle, options) {
    model.device = device;
    model.handle = handle;
    model.width = options.width;
    model.height = options.height;
    model.depth = options.depth ? options.depth : 1;
    model.format = options.format ? options.format : 'rgbaunorm';
    /* eslint-disable no-undef */

    /* eslint-disable no-bitwise */

    model.usage = options.usage ? options.usage : GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST;
    /* eslint-enable no-undef */

    /* eslint-enable no-bitwise */
  }; // set the data


  publicAPI.writeImageData = function (req) {
    var tDetails = vtkWebGPUTypes.getDetailsFromTextureFormat(model.format);
    var bufferBytesPerRow = model.width * tDetails.stride;

    if (req.nativeArray) {
      // create and write the buffer
      var buffRequest = {
        /* eslint-disable no-undef */
        usage: BufferUsage.Texture
        /* eslint-enable no-undef */

      };

      if (req.dataArray) {
        buffRequest.dataArray = req.dataArray;
        buffRequest.time = req.dataArray.getMTime();
      }

      buffRequest.nativeArray = req.nativeArray; // bytesPerRow must be a multiple of 256 so we might need to rebuild
      // the data here before passing to the buffer. e.g. if it is unorm8x4 then
      // we need to have width be a multiple of 64

      var inWidthInBytes = req.nativeArray.length / (model.height * model.depth) * req.nativeArray.BYTES_PER_ELEMENT; // is this a half float texture?

      var halfFloat = tDetails.elementSize === 2 && tDetails.sampleType === 'float'; // if we need to copy the data

      if (halfFloat || inWidthInBytes % 256) {
        var inArray = req.nativeArray;
        var inWidth = inWidthInBytes / inArray.BYTES_PER_ELEMENT;
        var outBytesPerElement = tDetails.elementSize;
        var outWidthInBytes = 256 * Math.floor((inWidth * outBytesPerElement + 255) / 256);
        var outWidth = outWidthInBytes / outBytesPerElement;
        var outArray = macro.newTypedArray(halfFloat ? 'Uint16Array' : inArray.constructor.name, outWidth * model.height * model.depth);

        for (var v = 0; v < model.height * model.depth; v++) {
          if (halfFloat) {
            for (var i = 0; i < inWidth; i++) {
              outArray[v * outWidth + i] = HalfFloat.toHalf(inArray[v * inWidth + i]);
            }
          } else {
            outArray.set(inArray.subarray(v * inWidth, (v + 1) * inWidth), v * outWidth);
          }
        }

        buffRequest.nativeArray = outArray;
        bufferBytesPerRow = outWidthInBytes;
      }

      var buff = model.device.getBufferManager().getBuffer(buffRequest);
      model.buffer = buff;
    }

    if (req.image) {
      var canvas = document.createElement('canvas');
      canvas.width = req.image.width;
      canvas.height = req.image.height;
      var ctx = canvas.getContext('2d');
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
      ctx.drawImage(req.image, 0, 0, req.image.width, req.image.height, 0, 0, canvas.width, canvas.height);
      var imageData = ctx.getImageData(0, 0, req.image.width, req.image.height); // create and write the buffer

      var _buffRequest = {
        nativeArray: imageData.data,
        time: 0,

        /* eslint-disable no-undef */
        usage: BufferUsage.Texture,

        /* eslint-enable no-undef */
        format: 'unorm8x4'
      };

      var _buff = model.device.getBufferManager().getBuffer(_buffRequest);

      model.buffer = _buff;
    } // get a buffer for the image


    var cmdEnc = model.device.createCommandEncoder();
    cmdEnc.copyBufferToTexture({
      buffer: model.buffer.getHandle(),
      offset: 0,
      bytesPerRow: bufferBytesPerRow,
      rowsPerImage: model.height
    }, {
      texture: model.handle
    }, [model.width, model.height, model.depth]);
    model.device.submitCommandEncoder(cmdEnc);
    model.ready = true;
  }; // when data is pulled out of this texture what scale must be applied to
  // get back to the original source data. For formats such as r8unorm we
  // have to multiply by 255.0, for formats such as r16float it is 1.0


  publicAPI.getScale = function () {
    var tDetails = vtkWebGPUTypes.getDetailsFromTextureFormat(model.format);
    var halfFloat = tDetails.elementSize === 2 && tDetails.sampleType === 'float';
    return halfFloat ? 1.0 : 255.0;
  };

  publicAPI.getNumberOfComponents = function () {
    var tDetails = vtkWebGPUTypes.getDetailsFromTextureFormat(model.format);
    return tDetails.numComponents;
  };

  publicAPI.resizeToMatch = function (tex) {
    if (tex.getWidth() !== model.width || tex.getHeight() !== model.height || tex.getDepth() !== model.depth) {
      model.width = tex.getWidth();
      model.height = tex.getHeight();
      model.depth = tex.getDepth();
      model.handle = model.device.getHandle().createTexture({
        size: [model.width, model.height, model.depth],
        format: model.format,
        usage: model.usage
      });
    }
  };

  publicAPI.resize = function (width, height) {
    var depth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

    if (width !== model.width || height !== model.height || depth !== model.depth) {
      model.width = width;
      model.height = height;
      model.depth = depth;
      model.handle = model.device.getHandle().createTexture({
        size: [model.width, model.height, model.depth],
        format: model.format,
        usage: model.usage
      });
    }
  };

  publicAPI.createView = function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    // if options is missing values try to add them in
    if (!options.dimension) {
      options.dimension = model.depth === 1 ? '2d' : '3d';
    }

    var view = vtkWebGPUTextureView.newInstance();
    view.create(publicAPI, options);
    return view;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  device: null,
  handle: null,
  buffer: null,
  ready: false
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Object methods

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['handle', 'ready', 'width', 'height', 'depth', 'format', 'usage']);
  macro.setGet(publicAPI, model, ['device']);
  vtkWebGPUTexture(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend); // ----------------------------------------------------------------------------

var vtkWebGPUTexture$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkWebGPUTexture$1 as default, extend, newInstance };
