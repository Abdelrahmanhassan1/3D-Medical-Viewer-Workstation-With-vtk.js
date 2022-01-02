import { newInstance as newInstance$1, obj, get, setGet } from '../../macros.js';
import vtkWebGPUShaderCache from './ShaderCache.js';

var forwarded = ['setBindGroup', 'setVertexBuffer', 'draw']; // ----------------------------------------------------------------------------
// vtkWebGPURenderEncoder methods
// ----------------------------------------------------------------------------

function vtkWebGPURenderEncoder(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPURenderEncoder');

  publicAPI.begin = function (encoder) {
    model.handle = encoder.beginRenderPass(model.description);
  };

  publicAPI.end = function () {
    model.handle.endPass();
  };

  publicAPI.setPipeline = function (pl) {
    model.handle.setPipeline(pl.getHandle());
    var pd = pl.getPipelineDescription(); // check attachment state

    if (model.colorTextureViews.length !== pd.fragment.targets.length) {
      console.log("mismatched attachment counts on pipeline ".concat(pd.fragment.targets.length, " while encoder has ").concat(model.colorTextureViews.length));
      console.trace();
    } else {
      for (var i = 0; i < model.colorTextureViews.length; i++) {
        var fmt = model.colorTextureViews[i].getTexture().getFormat();

        if (fmt !== pd.fragment.targets[i].format) {
          console.log("mismatched attachments for attachment ".concat(i, " on pipeline ").concat(pd.fragment.targets[i].format, " while encoder has ").concat(fmt));
          console.trace();
        }
      }
    } // check depth buffer


    if (!model.depthTextureView !== !('depthStencil' in pd)) {
      console.log('mismatched depth attachments');
      console.trace();
    } else if (model.depthTextureView) {
      var dfmt = model.depthTextureView.getTexture().getFormat();

      if (dfmt !== pd.depthStencil.format) {
        console.log("mismatched depth attachments on pipeline ".concat(pd.depthStencil.format, " while encoder has ").concat(dfmt));
        console.trace();
      }
    }

    model.boundPipeline = pl;
  };

  publicAPI.replaceShaderCode = function (pipeline) {
    model.replaceShaderCodeFunction(pipeline);
  };

  publicAPI.setColorTextureView = function (idx, view) {
    if (model.colorTextureViews[idx] === view) {
      return;
    }

    model.colorTextureViews[idx] = view;
  };

  publicAPI.activateBindGroup = function (bg) {
    var device = model.boundPipeline.getDevice();
    var midx = model.boundPipeline.getBindGroupLayoutCount(bg.getName());
    model.handle.setBindGroup(midx, bg.getBindGroup(device)); // verify bind group layout matches

    var bgl1 = device.getBindGroupLayoutDescription(bg.getBindGroupLayout(device));
    var bgl2 = device.getBindGroupLayoutDescription(model.boundPipeline.getBindGroupLayout(midx));

    if (bgl1 !== bgl2) {
      console.log("renderEncoder ".concat(model.pipelineHash, " mismatched bind group layouts bind group has\n").concat(bgl1, "\n versus pipeline\n").concat(bgl2, "\n"));
      console.trace();
    }
  };

  publicAPI.attachTextureViews = function () {
    // for each texture create a view if we do not already have one
    for (var i = 0; i < model.colorTextureViews.length; i++) {
      if (!model.description.colorAttachments[i]) {
        model.description.colorAttachments[i] = {
          view: model.colorTextureViews[i].getHandle()
        };
      } else {
        model.description.colorAttachments[i].view = model.colorTextureViews[i].getHandle();
      }
    }

    if (model.depthTextureView) {
      model.description.depthStencilAttachment.view = model.depthTextureView.getHandle();
    }
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
  description: null,
  handle: null,
  boundPipeline: null,
  pipelineHash: null,
  pipelineSettings: null,
  replaceShaderCodeFunction: null,
  depthTextureView: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  obj(publicAPI, model);
  model.description = {
    colorAttachments: [{
      view: undefined,
      loadValue: 'load',
      storeOp: 'store'
    }],
    depthStencilAttachment: {
      view: undefined,
      depthLoadValue: 0.0,
      depthStoreOp: 'store',
      stencilLoadValue: 0,
      stencilStoreOp: 'store'
    }
  }; // default shader code just writes out the computedColor

  model.replaceShaderCodeFunction = function (pipeline) {
    var fDesc = pipeline.getShaderDescription('fragment');
    fDesc.addOutput('vec4<f32>', 'outColor');
    var code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::RenderEncoder::Impl', ['output.outColor = computedColor;']).result;
    fDesc.setCode(code);
  }; // default pipeline settings


  model.pipelineSettings = {
    primitive: {
      cullMode: 'none'
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'greater-equal',
      format: 'depth32float'
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
  };
  model.colorTextureViews = [];
  get(publicAPI, model, ['boundPipeline', 'colorTextureViews']);
  setGet(publicAPI, model, ['depthTextureView', 'description', 'handle', 'pipelineHash', 'pipelineSettings', 'replaceShaderCodeFunction']); // For more macro methods, see "Sources/macros.js"
  // Object specific methods

  vtkWebGPURenderEncoder(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = newInstance$1(extend, 'vtkWebGPURenderEncoder'); // ----------------------------------------------------------------------------

var vtkWebGPURenderEncoder$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkWebGPURenderEncoder$1 as default, extend, newInstance };
