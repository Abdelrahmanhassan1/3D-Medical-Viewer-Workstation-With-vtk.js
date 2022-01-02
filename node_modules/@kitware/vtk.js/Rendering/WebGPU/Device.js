import { newInstance as newInstance$1, obj, setGet, get } from '../../macros.js';
import vtkWebGPUBufferManager from './BufferManager.js';
import vtkWebGPUShaderCache from './ShaderCache.js';
import vtkWebGPUTextureManager from './TextureManager.js';

// vtkWebGPUDevice methods
// ----------------------------------------------------------------------------

function vtkWebGPUDevice(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUDevice');

  publicAPI.initialize = function (handle) {
    model.handle = handle;
  };

  publicAPI.createCommandEncoder = function () {
    return model.handle.createCommandEncoder();
  };

  publicAPI.submitCommandEncoder = function (commandEncoder) {
    model.handle.queue.submit([commandEncoder.finish()]);
  };

  publicAPI.getShaderModule = function (sd) {
    return model.shaderCache.getShaderModule(sd);
  };
  /* eslint-disable no-bitwise */

  /* eslint-disable no-undef */


  publicAPI.getBindGroupLayout = function (val) {
    if (!val.entries) {
      return null;
    } // add in basic required values if missing


    for (var i = 0; i < val.entries.length; i++) {
      var ent = val.entries[i];
      ent.binding = ent.binding || 0;
      ent.visibility = ent.visibility || GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
    } // do we already have one?


    var sval = JSON.stringify(val);

    for (var _i = 0; _i < model.bindGroupLayouts.length; _i++) {
      if (model.bindGroupLayouts[_i].sval === sval) {
        return model.bindGroupLayouts[_i].layout;
      }
    } // create one and store it


    var layout = model.handle.createBindGroupLayout(val); // we actually only store the stringified version
    // as that is what we always compare against

    model.bindGroupLayouts.push({
      sval: sval,
      layout: layout
    });
    return layout;
  };

  publicAPI.getBindGroupLayoutDescription = function (layout) {
    for (var i = 0; i < model.bindGroupLayouts.length; i++) {
      if (model.bindGroupLayouts[i].layout === layout) {
        return model.bindGroupLayouts[i].sval;
      }
    }

    vtkErrorMacro('layout not found');
    console.trace();
    return null;
  };

  publicAPI.getPipeline = function (hash) {
    if (hash in model.pipelines) {
      return model.pipelines[hash];
    }

    return null;
  };

  publicAPI.createPipeline = function (hash, pipeline) {
    pipeline.initialize(publicAPI);
    model.pipelines[hash] = pipeline;
  };

  publicAPI.onSubmittedWorkDone = function () {
    return model.handle.queue.onSubmittedWorkDone();
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  handle: null,
  pipelines: null,
  shaderCache: null,
  bindGroupLayouts: null,
  bufferManager: null,
  textureManager: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  obj(publicAPI, model);
  setGet(publicAPI, model, ['handle']);
  get(publicAPI, model, ['bufferManager', 'shaderCache', 'textureManager']);
  model.shaderCache = vtkWebGPUShaderCache.newInstance();
  model.shaderCache.setDevice(publicAPI);
  model.bindGroupLayouts = [];
  model.bufferManager = vtkWebGPUBufferManager.newInstance();
  model.bufferManager.setDevice(publicAPI);
  model.textureManager = vtkWebGPUTextureManager.newInstance();
  model.textureManager.setDevice(publicAPI);
  model.pipelines = {}; // For more macro methods, see "Sources/macros.js"
  // Object specific methods

  vtkWebGPUDevice(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = newInstance$1(extend, 'vtkWebGPUDevice'); // ----------------------------------------------------------------------------

var vtkWebGPUDevice$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkWebGPUDevice$1 as default, extend, newInstance };
