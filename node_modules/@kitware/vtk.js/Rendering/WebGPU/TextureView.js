import macro from '../../macros.js';
import vtkWebGPUSampler from './Sampler.js';
import vtkWebGPUTypes from './Types.js';

// vtkWebGPUTextureView methods
// ----------------------------------------------------------------------------

/* eslint-disable no-bitwise */

function vtkWebGPUTextureView(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUTextureView');

  publicAPI.create = function (texture, options) {
    model.texture = texture;
    model.options = options;
    model.options.dimension = model.options.dimension || '2d';
    model.textureHandle = texture.getHandle();
    model.handle = model.textureHandle.createView(model.options);
    model.bindGroupLayoutEntry.texture.viewDimension = model.options.dimension;
    var tDetails = vtkWebGPUTypes.getDetailsFromTextureFormat(model.texture.getFormat());
    model.bindGroupLayoutEntry.texture.sampleType = tDetails.sampleType;
  };

  publicAPI.getBindGroupEntry = function () {
    var foo = {
      resource: publicAPI.getHandle()
    };
    return foo;
  };

  publicAPI.getShaderCode = function (binding, group) {
    var ttype = 'f32';

    if (model.bindGroupLayoutEntry.texture.sampleType === 'sint') {
      ttype = 'i32';
    } else if (model.bindGroupLayoutEntry.texture.sampleType === 'uint') {
      ttype = 'u32';
    }

    var result = "[[binding(".concat(binding, "), group(").concat(group, ")]] var ").concat(model.name, ": texture_").concat(model.options.dimension, "<").concat(ttype, ">;");

    if (model.bindGroupLayoutEntry.texture.sampleType === 'depth') {
      result = "[[binding(".concat(binding, "), group(").concat(group, ")]] var ").concat(model.name, ": texture_depth_").concat(model.options.dimension, ";");
    }

    return result;
  };

  publicAPI.addSampler = function (device, options) {
    var newSamp = vtkWebGPUSampler.newInstance();
    newSamp.create(device, options);
    publicAPI.setSampler(newSamp);
    model.sampler.setName("".concat(model.name, "Sampler"));
  };

  publicAPI.setName = function (val) {
    if (model.sampler) {
      model.sampler.setName("".concat(val, "Sampler"));
    }

    if (model.name === val) {
      return;
    }

    model.name = val;
    publicAPI.modified();
  };

  publicAPI.getBindGroupTime = function () {
    // check if the handle changed
    if (model.texture.getHandle() !== model.textureHandle) {
      model.textureHandle = model.texture.getHandle();
      model.handle = model.textureHandle.createView(model.options);
      model.bindGroupTime.modified();
    }

    return model.bindGroupTime;
  }; // if the texture has changed then get a new view


  publicAPI.getHandle = function () {
    if (model.texture.getHandle() !== model.textureHandle) {
      model.textureHandle = model.texture.getHandle();
      model.handle = model.textureHandle.createView(model.options);
      model.bindGroupTime.modified();
    }

    return model.handle;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  texture: null,
  handle: null,
  name: null,
  sampler: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Object methods

  macro.obj(publicAPI, model);
  model.bindGroupLayoutEntry = {
    /* eslint-disable no-undef */
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,

    /* eslint-enable no-undef */
    texture: {
      sampleType: 'float',
      viewDimension: '2d' // multisampled: false,

    }
  };
  model.bindGroupTime = {};
  macro.obj(model.bindGroupTime, {
    mtime: 0
  });
  macro.get(publicAPI, model, ['bindGroupTime', 'name', 'texture']);
  macro.setGet(publicAPI, model, ['bindGroupLayoutEntry', 'sampler']);
  vtkWebGPUTextureView(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend); // ----------------------------------------------------------------------------

var vtkWebGPUTextureView$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkWebGPUTextureView$1 as default, extend, newInstance };
