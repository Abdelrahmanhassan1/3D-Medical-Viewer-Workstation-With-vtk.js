import _defineProperty from '@babel/runtime/helpers/defineProperty';
import { newInstance as newInstance$1, obj } from '../../macros.js';
import vtkWebGPUPolyDataMapper from './PolyDataMapper.js';
import vtkWebGPUStorageBuffer from './StorageBuffer.js';
import vtkWebGPUShaderCache from './ShaderCache.js';
import vtkWebGPUBufferManager from './BufferManager.js';
import { registerOverride } from './ViewNodeFactory.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var PrimitiveTypes = vtkWebGPUBufferManager.PrimitiveTypes; // ----------------------------------------------------------------------------
// vtkWebGPUSphereMapper methods
// ----------------------------------------------------------------------------

function vtkWebGPUGlyph3DMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUGlyph3DMapper'); // Capture 'parentClass' api for internal use

  var superClass = _objectSpread({}, publicAPI);

  publicAPI.replaceShaderPosition = function (hash, pipeline, vertexInput) {
    var vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinInput('u32', '[[builtin(instance_index)]] instanceIndex');
    vDesc.addBuiltinOutput('vec4<f32>', '[[builtin(position)]] Position');
    var code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', ['    output.Position = rendererUBO.SCPCMatrix*mapperUBO.BCSCMatrix', '      *glyphSSBO.values[input.instanceIndex].matrix', '      *vertexBC;']).result;
    vDesc.setCode(code);
  };

  publicAPI.replaceShaderNormal = function (hash, pipeline, vertexInput) {
    if (vertexInput.hasAttribute('normalMC')) {
      var vDesc = pipeline.getShaderDescription('vertex');
      var code = vDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Impl', ['  output.normalVC = normalize((rendererUBO.WCVCNormals', ' * mapperUBO.MCWCNormals', ' * glyphSSBO.values[input.instanceIndex].normal*normalMC).xyz);']).result;
      vDesc.setCode(code);
    }

    superClass.replaceShaderNormal(hash, pipeline, vertexInput);
  };

  publicAPI.replaceShaderColor = function (hash, pipeline, vertexInput) {
    if (!model.carray) {
      superClass.replaceShaderColor(hash, pipeline, vertexInput);
      return;
    }

    var vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addOutput('vec4<f32>', 'color');
    var code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', ['  output.color = glyphSSBO.values[input.instanceIndex].color;']).result;
    vDesc.setCode(code);
    var fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', ['ambientColor = input.color;', 'diffuseColor = input.color;', 'opacity = mapperUBO.Opacity * input.color.a;']).result;
    fDesc.setCode(code);
  };

  publicAPI.replaceShaderSelect = function (hash, pipeline, vertexInput) {
    if (hash.includes('sel')) {
      var vDesc = pipeline.getShaderDescription('vertex');
      vDesc.addOutput('u32', 'compositeID', 'flat');
      var code = vDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Select::Impl', ['  output.compositeID = input.instanceIndex;']).result;
      vDesc.setCode(code);
      var fDesc = pipeline.getShaderDescription('fragment');
      code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Select::Impl', ['var compositeID: u32 = input.compositeID;']).result;
      fDesc.setCode(code);
    }
  };

  publicAPI.buildPrimitives = function () {
    model.currentInput = model.renderable.getInputData(1);
    model.renderable.buildArrays(); // update the buffer objects if needed

    var garray = model.renderable.getMatrixArray();
    var narray = model.renderable.getNormalArray();
    model.carray = model.renderable.getColorArray();
    var numInstances = garray.length / 16;

    if (model.renderable.getBuildTime().getMTime() > model.glyphBOBuildTime.getMTime()) {
      // In Core class all arrays are rebuilt when this happens
      // but these arrays can be shared between all primType
      var device = model.WebGPURenderWindow.getDevice();
      model.SSBO.clearData();
      model.SSBO.setNumberOfInstances(numInstances);
      model.SSBO.addEntry('matrix', 'mat4x4<f32>');
      model.SSBO.addEntry('normal', 'mat4x4<f32>');

      if (model.carray) {
        model.SSBO.addEntry('color', 'vec4<f32>');
      }

      model.SSBO.setAllInstancesFromArray('matrix', garray);
      model.SSBO.setAllInstancesFromArray3x3To4x4('normal', narray);

      if (model.carray) {
        model.SSBO.setAllInstancesFromArrayColorToFloat('color', model.carray.getData());
      }

      model.SSBO.send(device);
      model.glyphBOBuildTime.modified();
    }

    superClass.buildPrimitives();

    for (var i = 0; i < model.primitives.length; i++) {
      var primHelper = model.primitives[i];
      primHelper.setNumberOfInstances(numInstances);
    }
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkWebGPUPolyDataMapper.extend(publicAPI, model, initialValues);
  model.glyphBOBuildTime = {};
  obj(model.glyphBOBuildTime, {
    mtime: 0
  });
  model.SSBO = vtkWebGPUStorageBuffer.newInstance();
  model.SSBO.setName('glyphSSBO'); // Object methods

  vtkWebGPUGlyph3DMapper(publicAPI, model);

  for (var i = PrimitiveTypes.Start; i < PrimitiveTypes.End; i++) {
    model.primitives[i].setSSBO(model.SSBO);
    var sr = model.primitives[i].getShaderReplacements();
    sr.set('replaceShaderPosition', publicAPI.replaceShaderPosition);
    sr.set('replaceShaderNormal', publicAPI.replaceShaderNormal);
    sr.set('replaceShaderSelect', publicAPI.replaceShaderSelect);
    sr.set('replaceShaderColor', publicAPI.replaceShaderColor);
  }
} // ----------------------------------------------------------------------------

var newInstance = newInstance$1(extend, 'vtkWebGPUGlyph3DMapper'); // ----------------------------------------------------------------------------

var index = {
  newInstance: newInstance,
  extend: extend
}; // Register ourself to WebGPU backend if imported

registerOverride('vtkGlyph3DMapper', newInstance);

export { index as default, extend, newInstance };
