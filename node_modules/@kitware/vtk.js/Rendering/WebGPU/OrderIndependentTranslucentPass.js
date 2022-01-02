import macro from '../../macros.js';
import vtkWebGPUTexture from './Texture.js';
import vtkWebGPURenderEncoder from './RenderEncoder.js';
import vtkWebGPUShaderCache from './ShaderCache.js';
import vtkRenderPass from '../SceneGraph/RenderPass.js';
import vtkWebGPUFullScreenQuad from './FullScreenQuad.js';

var oitpFragTemplate = "\n//VTK::Mapper::Dec\n\n//VTK::TCoord::Dec\n\n//VTK::RenderEncoder::Dec\n\n//VTK::IOStructs::Dec\n\n[[stage(fragment)]]\nfn main(\n//VTK::IOStructs::Input\n)\n//VTK::IOStructs::Output\n{\n  var output: fragmentOutput;\n\n  var tcoord: vec2<i32> = vec2<i32>(i32(input.fragPos.x), i32(input.fragPos.y));\n  var reveal: f32 = textureLoad(oitpAccumTexture, tcoord, 0).r;\n  if (reveal == 1.0) { discard; }\n  var tcolor: vec4<f32> = textureLoad(oitpColorTexture, tcoord, 0);\n  var total: f32 = max(tcolor.a, 0.01);\n  var computedColor: vec4<f32> = vec4<f32>(tcolor.r/total, tcolor.g/total, tcolor.b/total, 1.0 - reveal);\n\n  //VTK::RenderEncoder::Impl\n  return output;\n}\n";

function vtkWebGPUOrderIndependentTranslucentPass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUOrderIndependentTranslucentPass'); // this pass implements a forward rendering pipeline
  // if both volumes and opaque geometry are present
  // it will mix the two together by capturing a zbuffer
  // first

  publicAPI.traverse = function (renNode, viewNode) {
    if (model.deleted) {
      return;
    } // we just render our delegates in order


    model.currentParent = viewNode;
    var device = viewNode.getDevice();

    if (!model.translucentRenderEncoder) {
      publicAPI.createRenderEncoder();
      publicAPI.createFinalEncoder();
      model.translucentColorTexture = vtkWebGPUTexture.newInstance();
      model.translucentColorTexture.create(device, {
        width: viewNode.getCanvas().width,
        height: viewNode.getCanvas().height,
        format: 'rgba16float',

        /* eslint-disable no-undef */

        /* eslint-disable no-bitwise */
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
      });
      var v1 = model.translucentColorTexture.createView();
      v1.setName('oitpColorTexture');
      model.translucentRenderEncoder.setColorTextureView(0, v1);
      model.translucentAccumulateTexture = vtkWebGPUTexture.newInstance();
      model.translucentAccumulateTexture.create(device, {
        width: viewNode.getCanvas().width,
        height: viewNode.getCanvas().height,
        format: 'r16float',

        /* eslint-disable no-undef */

        /* eslint-disable no-bitwise */
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
      });
      var v2 = model.translucentAccumulateTexture.createView();
      v2.setName('oitpAccumTexture');
      model.translucentRenderEncoder.setColorTextureView(1, v2);
      model.fullScreenQuad = vtkWebGPUFullScreenQuad.newInstance();
      model.fullScreenQuad.setDevice(viewNode.getDevice());
      model.fullScreenQuad.setPipelineHash('oitpfsq');
      model.fullScreenQuad.setTextureViews(model.translucentRenderEncoder.getColorTextureViews());
      model.fullScreenQuad.setFragmentShaderTemplate(oitpFragTemplate);
    } else {
      model.translucentColorTexture.resizeToMatch(model.colorTextureView.getTexture());
      model.translucentAccumulateTexture.resizeToMatch(model.colorTextureView.getTexture());
    }

    model.translucentRenderEncoder.setDepthTextureView(model.depthTextureView);
    model.translucentRenderEncoder.attachTextureViews();
    publicAPI.setCurrentOperation('translucentPass');
    renNode.setRenderEncoder(model.translucentRenderEncoder);
    renNode.traverse(publicAPI);
    publicAPI.finalPass(viewNode, renNode);
  };

  publicAPI.finalPass = function (viewNode, renNode) {
    model.translucentFinalEncoder.setColorTextureView(0, model.colorTextureView);
    model.translucentFinalEncoder.attachTextureViews();
    renNode.setRenderEncoder(model.translucentFinalEncoder);
    model.translucentFinalEncoder.begin(viewNode.getCommandEncoder()); // set viewport

    renNode.scissorAndViewport(model.translucentFinalEncoder);
    model.fullScreenQuad.render(model.translucentFinalEncoder, viewNode.getDevice());
    model.translucentFinalEncoder.end();
  };

  publicAPI.getTextures = function () {
    return [model.translucentColorTexture, model.translucentAccumulateTexture];
  };

  publicAPI.createRenderEncoder = function () {
    model.translucentRenderEncoder = vtkWebGPURenderEncoder.newInstance();
    var rDesc = model.translucentRenderEncoder.getDescription();
    rDesc.colorAttachments = [{
      view: undefined,
      loadValue: [0.0, 0.0, 0.0, 0.0],
      storeOp: 'store'
    }, {
      view: undefined,
      loadValue: [1.0, 0.0, 0.0, 0.0],
      storeOp: 'store'
    }];
    rDesc.depthStencilAttachment = {
      view: undefined,
      depthLoadValue: 'load',
      depthStoreOp: 'store',
      stencilLoadValue: 'load',
      stencilStoreOp: 'store'
    };
    model.translucentRenderEncoder.setReplaceShaderCodeFunction(function (pipeline) {
      var fDesc = pipeline.getShaderDescription('fragment');
      fDesc.addOutput('vec4<f32>', 'outColor');
      fDesc.addOutput('f32', 'outAccum');
      fDesc.addBuiltinInput('vec4<f32>', '[[builtin(position)]] fragPos');
      var code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::RenderEncoder::Impl', [// very simple depth weighting in w
      'var w: f32 = 1.0 - input.fragPos.z * 0.9;', 'output.outColor = vec4<f32>(computedColor.rgb*computedColor.a, computedColor.a) * w;', 'output.outAccum = computedColor.a;']).result;
      fDesc.setCode(code);
    });
    model.translucentRenderEncoder.setPipelineHash('oitpr');
    model.translucentRenderEncoder.setPipelineSettings({
      primitive: {
        cullMode: 'none'
      },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: 'greater',
        format: 'depth32float'
      },
      fragment: {
        targets: [{
          format: 'rgba16float',
          blend: {
            color: {
              srcFactor: 'one',
              dstFactor: 'one'
            },
            alpha: {
              srcfactor: 'one',
              dstFactor: 'one'
            }
          }
        }, {
          format: 'r16float',
          blend: {
            color: {
              srcFactor: 'zero',
              dstFactor: 'one-minus-src'
            },
            alpha: {
              srcfactor: 'one',
              dstFactor: 'one-minus-src-alpha'
            }
          }
        }]
      }
    });
  };

  publicAPI.createFinalEncoder = function () {
    model.translucentFinalEncoder = vtkWebGPURenderEncoder.newInstance();
    model.translucentFinalEncoder.setDescription({
      colorAttachments: [{
        view: null,
        loadValue: 'load',
        storeOp: 'store'
      }]
    });
    model.translucentFinalEncoder.setReplaceShaderCodeFunction(function (pipeline) {
      var fDesc = pipeline.getShaderDescription('fragment');
      fDesc.addOutput('vec4<f32>', 'outColor');
      fDesc.addBuiltinInput('vec4<f32>', '[[builtin(position)]] fragPos');
      var code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::RenderEncoder::Impl', ['output.outColor = vec4<f32>(computedColor.rgb*computedColor.a, computedColor.a);']).result;
      fDesc.setCode(code);
    });
    model.translucentFinalEncoder.setPipelineHash('oitpf');
    model.translucentFinalEncoder.setPipelineSettings({
      primitive: {
        cullMode: 'none'
      },
      fragment: {
        targets: [{
          format: 'bgra8unorm',
          blend: {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha'
            },
            alpha: {
              srcfactor: 'one',
              dstFactor: 'one-minus-src-alpha'
            }
          }
        }]
      }
    });
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  colorTextureView: null,
  depthTextureView: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  vtkRenderPass.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['colorTextureView', 'depthTextureView']); // Object methods

  vtkWebGPUOrderIndependentTranslucentPass(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkWebGPUOrderIndependentTranslucentPass'); // ----------------------------------------------------------------------------

var vtkWebGPUOrderIndepenentTranslucentPass = {
  newInstance: newInstance,
  extend: extend
};

export { vtkWebGPUOrderIndepenentTranslucentPass as default, extend, newInstance };
