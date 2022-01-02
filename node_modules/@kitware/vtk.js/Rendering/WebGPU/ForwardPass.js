import macro from '../../macros.js';
import vtkWebGPUOpaquePass from './OpaquePass.js';
import vtkWebGPUOrderIndepenentTranslucentPass from './OrderIndependentTranslucentPass.js';
import vtkWebGPUVolumePass from './VolumePass.js';
import vtkRenderPass from '../SceneGraph/RenderPass.js';

function vtkForwardPass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkForwardPass'); // this pass implements a forward rendering pipeline
  // if both volumes and opaque geometry are present
  // it will mix the two together by capturing a zbuffer
  // first

  publicAPI.traverse = function (viewNode) {
    var parent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    if (model.deleted) {
      return;
    } // we just render our delegates in order


    model.currentParent = parent; // build

    publicAPI.setCurrentOperation('buildPass');
    viewNode.traverse(publicAPI);

    if (!model.opaquePass) {
      model.opaquePass = vtkWebGPUOpaquePass.newInstance();
    }

    var numlayers = viewNode.getRenderable().getNumberOfLayers(); // iterate over renderers

    var renderers = viewNode.getChildren();

    for (var i = 0; i < numlayers; i++) {
      for (var index = 0; index < renderers.length; index++) {
        var renNode = renderers[index];
        var ren = viewNode.getRenderable().getRenderers()[index];

        if (ren.getDraw() && ren.getLayer() === i) {
          // check for both opaque and volume actors
          model.opaqueActorCount = 0;
          model.translucentActorCount = 0;
          model.volumes = [];
          publicAPI.setCurrentOperation('queryPass');
          renNode.traverse(publicAPI);
          publicAPI.setCurrentOperation('cameraPass');
          renNode.traverse(publicAPI); // always do opaque pass to get a valid color and zbuffer, even if empty

          model.opaquePass.traverse(renNode, viewNode); // optional translucent pass

          if (model.translucentActorCount > 0) {
            if (!model.translucentPass) {
              model.translucentPass = vtkWebGPUOrderIndepenentTranslucentPass.newInstance();
            }

            model.translucentPass.setColorTextureView(model.opaquePass.getColorTextureView());
            model.translucentPass.setDepthTextureView(model.opaquePass.getDepthTextureView());
            model.translucentPass.traverse(renNode, viewNode);
          } // optional volume pass


          if (model.volumes.length > 0) {
            if (!model.volumePass) {
              model.volumePass = vtkWebGPUVolumePass.newInstance();
            }

            model.volumePass.setColorTextureView(model.opaquePass.getColorTextureView());
            model.volumePass.setDepthTextureView(model.opaquePass.getDepthTextureView());
            model.volumePass.setVolumes(model.volumes);
            model.volumePass.traverse(renNode, viewNode);
          }
        }
      }
    } // blit the result into the swap chain


    var sctex = viewNode.getCurrentTexture();
    var optex = model.opaquePass.getColorTexture();
    var cmdEnc = viewNode.getCommandEncoder();
    cmdEnc.copyTextureToTexture({
      texture: optex.getHandle()
    }, {
      texture: sctex
    }, {
      width: optex.getWidth(),
      height: optex.getHeight(),
      depthOrArrayLayers: 1
    });
  };

  publicAPI.incrementOpaqueActorCount = function () {
    return model.opaqueActorCount++;
  };

  publicAPI.incrementTranslucentActorCount = function () {
    return model.translucentActorCount++;
  };

  publicAPI.addVolume = function (volume) {
    model.volumes.push(volume);
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  opaqueActorCount: 0,
  translucentActorCount: 0,
  volumes: null,
  opaqueRenderEncoder: null,
  translucentPass: null,
  volumePass: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  vtkRenderPass.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['opaquePass', 'translucentPass', 'volumePass']); // Object methods

  vtkForwardPass(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkForwardPass'); // ----------------------------------------------------------------------------

var vtkForwardPass$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkForwardPass$1 as default, extend, newInstance };
