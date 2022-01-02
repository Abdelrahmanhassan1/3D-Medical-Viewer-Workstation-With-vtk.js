import { mat4, vec3 } from 'gl-matrix';
import { newInstance as newInstance$1, obj, get, getArray, setGet, vtkDebugMacro as vtkDebugMacro$1 } from '../../macros.js';
import vtkViewNode from '../SceneGraph/ViewNode.js';
import vtkWebGPUBindGroup from './BindGroup.js';
import vtkWebGPUFullScreenQuad from './FullScreenQuad.js';
import vtkWebGPUUniformBuffer from './UniformBuffer.js';
import { registerOverride } from './ViewNodeFactory.js';

var vtkDebugMacro = vtkDebugMacro$1;
var clearFragTemplate = "\n//VTK::Renderer::Dec\n\n//VTK::Mapper::Dec\n\n//VTK::TCoord::Dec\n\n//VTK::RenderEncoder::Dec\n\n//VTK::IOStructs::Dec\n\n[[stage(fragment)]]\nfn main(\n//VTK::IOStructs::Input\n)\n//VTK::IOStructs::Output\n{\n  var output: fragmentOutput;\n\n  var computedColor: vec4<f32> = mapperUBO.BackgroundColor;\n\n  //VTK::RenderEncoder::Impl\n  return output;\n}\n"; // ----------------------------------------------------------------------------
// vtkWebGPURenderer methods
// ----------------------------------------------------------------------------

/* eslint-disable no-bitwise */

function vtkWebGPURenderer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPURenderer'); // Builds myself.

  publicAPI.buildPass = function (prepass) {
    if (prepass) {
      if (!model.renderable) {
        return;
      }

      model.camera = model.renderable.getActiveCamera();
      publicAPI.updateLights();
      publicAPI.prepareNodes();
      publicAPI.addMissingNode(model.camera);
      publicAPI.addMissingNodes(model.renderable.getViewPropsWithNestedProps());
      publicAPI.removeUnusedNodes();
      model.webgpuCamera = publicAPI.getViewNodeFor(model.camera);
      publicAPI.updateStabilizedMatrix();
    }
  };

  publicAPI.updateStabilizedMatrix = function () {
    // This method is designed to help with floating point
    // issues when rendering datasets that push the limits of
    // resolutions on float.
    //
    // One of the most common cases is when the dataset is located far
    // away from the origin relative to the clipping range we are looking
    // at. For that case we want to perform the floating point sensitive
    // multiplications on the CPU in double. To this end we want the
    // vertex rendering ops to look something like
    //
    // Compute shifted points and load those into the VBO
    // pointCoordsSC = WorldToStabilizedMatrix * pointCoords;
    //
    // In the vertex shader do the following
    // positionVC = StabilizedToDeviceMatrix * ModelToStabilizedMatrix*vertexIn;
    //
    // We use two matrices because it is expensive to change the
    // WorldToStabilized matrix as we have to reupload all pointCoords
    // So that matrix (MCSCMatrix) is fairly static, the Stabilized to
    // Device matrix is the one that gets updated every time the camera
    // changes.
    //
    // The basic idea is that we should translate the data so that
    // when the center of the view frustum moves a lot
    // we recenter it. The center of the view frustum is roughly
    // camPos + dirOfProj*(far + near)*0.5
    var clipRange = model.camera.getClippingRange();
    var pos = model.camera.getPositionByReference();
    var dop = model.camera.getDirectionOfProjectionByReference();
    var center = [];
    var offset = [];
    vec3.scale(offset, dop, 0.5 * (clipRange[0] + clipRange[1]));
    vec3.add(center, pos, offset);
    vec3.sub(offset, center, model.stabilizedCenter);
    var length = vec3.len(offset);

    if (length / (clipRange[1] - clipRange[0]) > model.recenterThreshold) {
      model.stabilizedCenter = center;
      model.stabilizedTime.modified();
    }
  };

  publicAPI.updateLights = function () {
    var count = 0;
    var lights = model.renderable.getLightsByReference();

    for (var index = 0; index < lights.length; ++index) {
      if (lights[index].getSwitch() > 0.0) {
        count++;
      }
    }

    if (!count) {
      vtkDebugMacro('No lights are on, creating one.');
      model.renderable.createLight();
    }

    return count;
  }; // register pipeline callbacks from a mapper


  publicAPI.registerPipelineCallback = function (pipeline, cb) {
    // if there is a matching pipeline just add the cb
    for (var i = 0; i < model.pipelineCallbacks.length; i++) {
      if (model.pipelineCallbacks[i].pipeline === pipeline) {
        model.pipelineCallbacks[i].callbacks.push(cb);
        return;
      }
    }

    model.pipelineCallbacks.push({
      pipeline: pipeline,
      callbacks: [cb]
    });
  };

  publicAPI.updateUBO = function () {
    // make sure the data is up to date
    // has the camera changed?
    var utime = model.UBO.getSendTime();

    if (model.parent.getMTime() > utime || publicAPI.getMTime() > utime || model.camera.getMTime() > utime || model.renderable.getMTime() > utime) {
      var keyMats = model.webgpuCamera.getKeyMatrices(publicAPI);
      model.UBO.setArray('WCVCMatrix', keyMats.wcvc);
      model.UBO.setArray('SCPCMatrix', keyMats.scpc);
      model.UBO.setArray('PCSCMatrix', keyMats.pcsc);
      model.UBO.setArray('SCVCMatrix', keyMats.scvc);
      model.UBO.setArray('VCPCMatrix', keyMats.vcpc);
      model.UBO.setArray('WCVCNormals', keyMats.normalMatrix);
      var tsize = publicAPI.getYInvertedTiledSizeAndOrigin();
      model.UBO.setArray('viewportSize', [tsize.usize, tsize.vsize]);
      model.UBO.setValue('cameraParallel', model.camera.getParallelProjection());
      var device = model.parent.getDevice();
      model.UBO.sendIfNeeded(device);
    }
  };

  publicAPI.scissorAndViewport = function (encoder) {
    var tsize = publicAPI.getYInvertedTiledSizeAndOrigin();
    encoder.getHandle().setViewport(tsize.lowerLeftU, tsize.lowerLeftV, tsize.usize, tsize.vsize, 0.0, 1.0); // set scissor

    encoder.getHandle().setScissorRect(tsize.lowerLeftU, tsize.lowerLeftV, tsize.usize, tsize.vsize);
  };

  publicAPI.bindUBO = function (renderEncoder) {
    renderEncoder.activateBindGroup(model.bindGroup);
  }; // Renders myself


  publicAPI.opaquePass = function (prepass) {
    if (prepass) {
      // clear last pipelines
      model.pipelineCallbacks = [];
      model.renderEncoder.begin(model.parent.getCommandEncoder());
      publicAPI.updateUBO();
    } else {
      publicAPI.scissorAndViewport(model.renderEncoder);
      publicAPI.clear(); // loop over registered pipelines

      for (var i = 0; i < model.pipelineCallbacks.length; i++) {
        var pStruct = model.pipelineCallbacks[i];
        var pl = pStruct.pipeline;
        model.renderEncoder.setPipeline(pl);
        publicAPI.bindUBO(model.renderEncoder);

        for (var cb = 0; cb < pStruct.callbacks.length; cb++) {
          pStruct.callbacks[cb](model.renderEncoder);
        }
      }

      model.renderEncoder.end();
    }
  };

  publicAPI.clear = function () {
    if (model.renderable.getTransparent() || model.suppressClear) {
      return;
    }

    var device = model.parent.getDevice();

    if (!model.clearFSQ) {
      model.clearFSQ = vtkWebGPUFullScreenQuad.newInstance();
      model.clearFSQ.setDevice(device);
      model.clearFSQ.setPipelineHash('clearfsq');
      model.clearFSQ.setFragmentShaderTemplate(clearFragTemplate);
      var ubo = vtkWebGPUUniformBuffer.newInstance();
      ubo.setName('mapperUBO');
      ubo.addEntry('BackgroundColor', 'vec4<f32>');
      model.clearFSQ.setUBO(ubo);
    }

    var background = model.renderable.getBackgroundByReference();
    model.clearFSQ.getUBO().setArray('BackgroundColor', background);
    model.clearFSQ.getUBO().sendIfNeeded(device);
    model.clearFSQ.render(model.renderEncoder, device);
  };

  publicAPI.translucentPass = function (prepass) {
    if (prepass) {
      // clear last pipelines
      model.pipelineCallbacks = [];
      model.renderEncoder.begin(model.parent.getCommandEncoder());
    } else {
      publicAPI.scissorAndViewport(model.renderEncoder); // loop over registered pipelines

      for (var i = 0; i < model.pipelineCallbacks.length; i++) {
        var pStruct = model.pipelineCallbacks[i];
        var pl = pStruct.pipeline;
        model.renderEncoder.setPipeline(pl);
        publicAPI.bindUBO(model.renderEncoder);

        for (var cb = 0; cb < pStruct.callbacks.length; cb++) {
          pStruct.callbacks[cb](model.renderEncoder);
        }
      }

      model.renderEncoder.end();
    }
  };

  publicAPI.volumeDepthRangePass = function (prepass) {
    if (prepass) {
      // clear last pipelines
      model.pipelineCallbacks = [];
      model.renderEncoder.begin(model.parent.getCommandEncoder());
    } else {
      publicAPI.scissorAndViewport(model.renderEncoder); // loop over registered pipelines

      for (var i = 0; i < model.pipelineCallbacks.length; i++) {
        var pStruct = model.pipelineCallbacks[i];
        var pl = pStruct.pipeline;
        model.renderEncoder.setPipeline(pl);
        publicAPI.bindUBO(model.renderEncoder);

        for (var cb = 0; cb < pStruct.callbacks.length; cb++) {
          pStruct.callbacks[cb](model.renderEncoder);
        }
      }

      model.renderEncoder.end();
    }
  };

  publicAPI.getAspectRatio = function () {
    var size = model.parent.getSizeByReference();
    var viewport = model.renderable.getViewportByReference();
    return size[0] * (viewport[2] - viewport[0]) / ((viewport[3] - viewport[1]) * size[1]);
  };

  publicAPI.convertToOpenGLDepth = function (val) {
    return model.webgpuCamera.convertToOpenGLDepth(val);
  };

  publicAPI.getYInvertedTiledSizeAndOrigin = function () {
    var res = publicAPI.getTiledSizeAndOrigin();
    var size = model.parent.getSizeByReference();
    res.lowerLeftV = size[1] - res.vsize - res.lowerLeftV;
    return res;
  };

  publicAPI.getTiledSizeAndOrigin = function () {
    var vport = model.renderable.getViewportByReference(); // if there is no window assume 0 1

    var tileViewPort = [0.0, 0.0, 1.0, 1.0]; // find the lower left corner of the viewport, taking into account the
    // lower left boundary of this tile

    var vpu = vport[0] - tileViewPort[0];
    var vpv = vport[1] - tileViewPort[1]; // store the result as a pixel value

    var ndvp = model.parent.normalizedDisplayToDisplay(vpu, vpv);
    var lowerLeftU = Math.round(ndvp[0]);
    var lowerLeftV = Math.round(ndvp[1]); // find the upper right corner of the viewport, taking into account the
    // lower left boundary of this tile

    var vpu2 = vport[2] - tileViewPort[0];
    var vpv2 = vport[3] - tileViewPort[1];
    var ndvp2 = model.parent.normalizedDisplayToDisplay(vpu2, vpv2); // now compute the size of the intersection of the viewport with the
    // current tile

    var usize = Math.round(ndvp2[0]) - lowerLeftU;
    var vsize = Math.round(ndvp2[1]) - lowerLeftV;

    if (usize < 0) {
      usize = 0;
    }

    if (vsize < 0) {
      vsize = 0;
    }

    return {
      usize: usize,
      vsize: vsize,
      lowerLeftU: lowerLeftU,
      lowerLeftV: lowerLeftV
    };
  };

  publicAPI.getPropFromID = function (id) {
    for (var i = 0; i < model.children.length; i++) {
      var res = model.children[i].getPropID ? model.children[i].getPropID() : -1;

      if (res === id) {
        return model.children[i];
      }
    }

    return null;
  };

  publicAPI.getStabilizedTime = function () {
    return model.stabilizedTime.getMTime();
  };

  publicAPI.releaseGraphicsResources = function () {
    if (model.selector !== null) {
      model.selector.releaseGraphicsResources();
    }
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  bindGroup: null,
  selector: null,
  renderEncoder: null,
  recenterThreshold: 20.0,
  suppressClear: false,
  stabilizedCenter: [0.0, 0.0, 0.0]
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkViewNode.extend(publicAPI, model, initialValues);
  model.UBO = vtkWebGPUUniformBuffer.newInstance();
  model.UBO.setName('rendererUBO');
  model.UBO.addEntry('WCVCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('SCPCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('PCSCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('SCVCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('VCPCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('WCVCNormals', 'mat4x4<f32>');
  model.UBO.addEntry('viewportSize', 'vec2<f32>');
  model.UBO.addEntry('cameraParallel', 'u32');
  model.bindGroup = vtkWebGPUBindGroup.newInstance();
  model.bindGroup.setName('rendererBG');
  model.bindGroup.setBindables([model.UBO]);
  model.tmpMat4 = mat4.identity(new Float64Array(16));
  model.stabilizedTime = {};
  obj(model.stabilizedTime, {
    mtime: 0
  }); // Build VTK API

  get(publicAPI, model, ['bindGroup', 'stabilizedTime']);
  getArray(publicAPI, model, ['stabilizedCenter']);
  setGet(publicAPI, model, ['renderEncoder', 'selector', 'suppressClear', 'UBO']); // Object methods

  vtkWebGPURenderer(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = newInstance$1(extend, 'vtkWebGPURenderer'); // ----------------------------------------------------------------------------

var index = {
  newInstance: newInstance,
  extend: extend
}; // Register ourself to WebGPU backend if imported

registerOverride('vtkRenderer', newInstance);

export { index as default, extend, newInstance };
