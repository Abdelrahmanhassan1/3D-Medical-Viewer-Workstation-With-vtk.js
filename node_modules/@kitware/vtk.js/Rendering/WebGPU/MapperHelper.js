import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import macro from '../../macros.js';
import vtkWebGPUBindGroup from './BindGroup.js';
import vtkWebGPUPipeline from './Pipeline.js';
import vtkWebGPUShaderCache from './ShaderCache.js';
import vtkWebGPUShaderDescription from './ShaderDescription.js';
import vtkWebGPUVertexInput from './VertexInput.js';

var vtkWebGPUMapperHelperVS = "\n//VTK::Renderer::Dec\n\n//VTK::Color::Dec\n\n//VTK::Normal::Dec\n\n//VTK::TCoord::Dec\n\n//VTK::Select::Dec\n\n//VTK::Mapper::Dec\n\n//VTK::IOStructs::Dec\n\n[[stage(vertex)]]\nfn main(\n//VTK::IOStructs::Input\n)\n//VTK::IOStructs::Output\n{\n  var output : vertexOutput;\n\n  // var vertex: vec4<f32> = vertexBC;\n\n  //VTK::Color::Impl\n\n  //VTK::Normal::Impl\n\n  //VTK::TCoord::Impl\n\n  //VTK::Select::Impl\n\n  //VTK::Position::Impl\n\n  return output;\n}\n";
var vtkWebGPUMapperHelperFS = "\n//VTK::Renderer::Dec\n\n//VTK::Color::Dec\n\n//VTK::Normal::Dec\n\n//VTK::TCoord::Dec\n\n//VTK::Select::Dec\n\n//VTK::RenderEncoder::Dec\n\n//VTK::Mapper::Dec\n\n//VTK::IOStructs::Dec\n\n[[stage(fragment)]]\nfn main(\n//VTK::IOStructs::Input\n)\n//VTK::IOStructs::Output\n{\n  var output : fragmentOutput;\n\n  //VTK::Color::Impl\n\n  //VTK::Normal::Impl\n\n  //VTK::Light::Impl\n\n  //VTK::TCoord::Impl\n\n  //VTK::Select::Impl\n\n  // var computedColor:vec4<f32> = vec4<f32>(1.0,0.5,0.5,1.0);\n\n  //VTK::RenderEncoder::Impl\n  return output;\n}\n"; // ----------------------------------------------------------------------------
// vtkWebGPUMapperHelper methods
// ----------------------------------------------------------------------------

function vtkWebGPUMapperHelper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUMapperHelper');

  publicAPI.generateShaderDescriptions = function (hash, pipeline, vertexInput) {
    // create the shader descriptions
    var vDesc = vtkWebGPUShaderDescription.newInstance({
      type: 'vertex',
      hash: hash,
      code: model.vertexShaderTemplate
    });
    var fDesc = vtkWebGPUShaderDescription.newInstance({
      type: 'fragment',
      hash: hash,
      code: model.fragmentShaderTemplate
    }); // add them to the pipeline

    var sdrs = pipeline.getShaderDescriptions();
    sdrs.push(vDesc);
    sdrs.push(fDesc); // look for replacements to invoke

    var scode = model.vertexShaderTemplate + model.fragmentShaderTemplate;
    var re = new RegExp('//VTK::[^:]*::', 'g');
    var unique = scode.match(re).filter(function (v, i, a) {
      return a.indexOf(v) === i;
    });
    var fnames = unique.map(function (v) {
      return "replaceShader".concat(v.substring(7, v.length - 2));
    }); // now invoke shader replacement functions

    for (var i = 0; i < fnames.length; i++) {
      var fname = fnames[i];

      if (fname !== 'replaceShaderIOStructs' && model.shaderReplacements.has(fname)) {
        model.shaderReplacements.get(fname)(hash, pipeline, vertexInput);
      }
    } // always replace the IOStructs last as other replacement funcs may
    // add inputs or outputs


    publicAPI.replaceShaderIOStructs(hash, pipeline, vertexInput); // console.log(vDesc.getCode());
    // console.log(fDesc.getCode());
  };

  publicAPI.replaceShaderIOStructs = function (hash, pipeline, vertexInput) {
    var vDesc = pipeline.getShaderDescription('vertex');
    vDesc.replaceShaderCode(null, vertexInput);
    var fDesc = pipeline.getShaderDescription('fragment');
    fDesc.replaceShaderCode(vDesc);
  };

  publicAPI.replaceShaderRenderEncoder = function (hash, pipeline, vertexInput) {
    model.renderEncoder.replaceShaderCode(pipeline);
  };

  model.shaderReplacements.set('replaceShaderRenderEncoder', publicAPI.replaceShaderRenderEncoder);

  publicAPI.replaceShaderRenderer = function (hash, pipeline, vertexInput) {
    if (!model.WebGPURenderer) {
      return;
    }

    var ubocode = model.WebGPURenderer.getBindGroup().getShaderCode(pipeline);
    var vDesc = pipeline.getShaderDescription('vertex');
    var code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Renderer::Dec', [ubocode]).result;
    vDesc.setCode(code);
    var fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Renderer::Dec', [ubocode]).result;
    fDesc.setCode(code);
  };

  model.shaderReplacements.set('replaceShaderRenderer', publicAPI.replaceShaderRenderer);

  publicAPI.replaceShaderMapper = function (hash, pipeline, vertexInput) {
    var ubocode = model.bindGroup.getShaderCode(pipeline);
    var vDesc = pipeline.getShaderDescription('vertex');
    var code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Mapper::Dec', [ubocode]).result;
    vDesc.setCode(code);
    var fDesc = pipeline.getShaderDescription('fragment');
    fDesc.addBuiltinInput('bool', '[[builtin(front_facing)]] frontFacing');
    code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Mapper::Dec', [ubocode]).result;
    fDesc.setCode(code);
  };

  model.shaderReplacements.set('replaceShaderMapper', publicAPI.replaceShaderMapper);

  publicAPI.replaceShaderPosition = function (hash, pipeline, vertexInput) {
    var vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinOutput('vec4<f32>', '[[builtin(position)]] Position');
    var code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', ['    output.Position = rendererUBO.SCPCMatrix*vertexBC;']).result;
    vDesc.setCode(code);
  };

  model.shaderReplacements.set('replaceShaderPosition', publicAPI.replaceShaderPosition);

  publicAPI.replaceShaderTCoord = function (hash, pipeline, vertexInput) {
    var vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addOutput('vec2<f32>', 'tcoordVS');
  };

  model.shaderReplacements.set('replaceShaderTCoord', publicAPI.replaceShaderTCoord);

  publicAPI.addTextureView = function (view) {
    // is it already there?
    if (model.textureViews.includes(view)) {
      return;
    }

    model.textureViews.push(view);
  };

  publicAPI.renderForPipeline = function (renderEncoder) {
    var pipeline = renderEncoder.getBoundPipeline(); // bind the mapper bind group

    renderEncoder.activateBindGroup(model.bindGroup); // bind the vertex input

    pipeline.bindVertexInput(renderEncoder, model.vertexInput);
    renderEncoder.draw(model.numberOfVertices, model.numberOfInstances, 0, 0);
  };

  publicAPI.registerToDraw = function () {
    if (model.pipeline) {
      model.WebGPURenderer.registerPipelineCallback(model.pipeline, publicAPI.renderForPipeline);
    }
  };

  publicAPI.render = function (renderEncoder, device) {
    publicAPI.build(renderEncoder, device);
    renderEncoder.setPipeline(model.pipeline);

    if (model.WebGPURenderer) {
      model.WebGPURenderer.bindUBO(renderEncoder);
    }

    publicAPI.renderForPipeline(renderEncoder);
  };

  publicAPI.getBindables = function () {
    var bindables = _toConsumableArray(model.additionalBindables);

    if (model.UBO) {
      bindables.push(model.UBO);
    }

    if (model.SSBO) {
      bindables.push(model.SSBO);
    } // add texture BindGroupLayouts


    for (var t = 0; t < model.textureViews.length; t++) {
      bindables.push(model.textureViews[t]);
      var samp = model.textureViews[t].getSampler();

      if (samp) {
        bindables.push(samp);
      }
    }

    return bindables;
  };

  publicAPI.build = function (renderEncoder, device) {
    // handle per primitive type
    model.renderEncoder = renderEncoder;
    model.pipeline = device.getPipeline(model.pipelineHash);
    model.bindGroup.setBindables(publicAPI.getBindables()); // build VBO for this primitive
    // build the pipeline if needed

    if (!model.pipeline) {
      model.pipeline = vtkWebGPUPipeline.newInstance();
      model.pipeline.setDevice(device);

      if (model.WebGPURenderer) {
        model.pipeline.addBindGroupLayout(model.WebGPURenderer.getBindGroup());
      }

      model.pipeline.addBindGroupLayout(model.bindGroup);
      publicAPI.generateShaderDescriptions(model.pipelineHash, model.pipeline, model.vertexInput);
      model.pipeline.setTopology(model.topology);
      model.pipeline.setRenderEncoder(renderEncoder);
      model.pipeline.setVertexState(model.vertexInput.getVertexInputInformation());
      device.createPipeline(model.pipelineHash, model.pipeline);
    }
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  additionalBindables: undefined,
  bindGroup: null,
  device: null,
  fragmentShaderTemplate: null,
  numberOfInstances: 1,
  numberOfVertices: 0,
  pipelineHash: null,
  shaderReplacements: null,
  SSBO: null,
  textureViews: null,
  topology: 'triangle-list',
  UBO: null,
  vertexShaderTemplate: null,
  WebGPURenderer: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  macro.obj(publicAPI, model);
  model.textureViews = [];
  model.vertexInput = vtkWebGPUVertexInput.newInstance();
  model.bindGroup = vtkWebGPUBindGroup.newInstance();
  model.bindGroup.setName('mapperBG');
  model.additionalBindables = [];
  model.fragmentShaderTemplate = model.fragmentShaderTemplate || vtkWebGPUMapperHelperFS;
  model.vertexShaderTemplate = model.vertexShaderTemplate || vtkWebGPUMapperHelperVS;
  model.shaderReplacements = new Map(); // Build VTK API

  macro.get(publicAPI, model, ['vertexInput']);
  macro.setGet(publicAPI, model, ['additionalBindables', 'device', 'fragmentShaderTemplate', 'interpolate', 'numberOfInstances', 'numberOfVertices', 'pipelineHash', 'shaderReplacements', 'SSBO', 'textureViews', 'topology', 'UBO', 'vertexShaderTemplate', 'WebGPURenderer']); // Object methods

  vtkWebGPUMapperHelper(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkWebGPUMapperHelper'); // ----------------------------------------------------------------------------

var vtkWebGPUMapperHelper$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkWebGPUMapperHelper$1 as default, extend, newInstance };
