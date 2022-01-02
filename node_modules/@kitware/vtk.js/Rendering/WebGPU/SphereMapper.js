import { newInstance as newInstance$1, vtkErrorMacro as vtkErrorMacro$1 } from '../../macros.js';
import { r as radiansFromDegrees } from '../../Common/Core/Math/index.js';
import vtkWebGPUPolyDataMapper from './PolyDataMapper.js';
import vtkWebGPUBufferManager from './BufferManager.js';
import vtkWebGPUShaderCache from './ShaderCache.js';
import { registerOverride } from './ViewNodeFactory.js';

var BufferUsage = vtkWebGPUBufferManager.BufferUsage,
    PrimitiveTypes = vtkWebGPUBufferManager.PrimitiveTypes;
var vtkErrorMacro = vtkErrorMacro$1;
var vtkWebGPUSphereMapperVS = "\n//VTK::Renderer::Dec\n\n//VTK::Mapper::Dec\n\n//VTK::Color::Dec\n\n//VTK::IOStructs::Dec\n\n[[stage(vertex)]]\nfn main(\n//VTK::IOStructs::Input\n)\n//VTK::IOStructs::Output\n{\n  var output : vertexOutput;\n\n  var vertexVC: vec4<f32> = rendererUBO.SCVCMatrix * mapperUBO.BCSCMatrix * vec4<f32>(vertexBC.x, vertexBC.y, vertexBC.z, 1.0);\n\n  //VTK::Color::Impl\n\n  // compute the projected vertex position\n  output.centerVC = vertexVC.xyz;\n  output.radiusVC = length(offsetMC)*0.5;\n\n  // make the triangle face the camera\n  if (rendererUBO.cameraParallel == 0u)\n    {\n    var dir: vec3<f32> = normalize(-vertexVC.xyz);\n    var base2: vec3<f32> = normalize(cross(dir,vec3<f32>(1.0,0.0,0.0)));\n    var base1: vec3<f32> = cross(base2,dir);\n    dir = vertexVC.xyz + offsetMC.x*base1 + offsetMC.y*base2;\n    vertexVC = vec4<f32>(dir, 1.0);\n    }\n  else\n    {\n    // add in the offset\n    var tmp2: vec2<f32> = vertexVC.xy + offsetMC;\n    vertexVC = vec4<f32>(tmp2, vertexVC.zw);\n    }\n\n  output.vertexVC = vertexVC.xyz;\n\n  //VTK::Position::Impl\n\n  return output;\n}\n"; // ----------------------------------------------------------------------------
// vtkWebGPUSphereMapper methods
// ----------------------------------------------------------------------------

function vtkWebGPUSphereMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUSphereMapper');

  publicAPI.replaceShaderNormal = function (hash, pipeline, vertexInput) {
    var vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addOutput('vec3<f32>', 'vertexVC');
    vDesc.addOutput('vec3<f32>', 'centerVC');
    vDesc.addOutput('f32', 'radiusVC');
    var fDesc = pipeline.getShaderDescription('fragment');
    fDesc.addBuiltinOutput('f32', '[[builtin(frag_depth)]] fragDepth');
    var sphereFrag = "\n    // compute the eye position and unit direction\n    var vertexVC: vec4<f32>;\n    var EyePos: vec3<f32>;\n    var EyeDir: vec3<f32>;\n    var invertedDepth: f32 = 1.0;\n    if (rendererUBO.cameraParallel != 0u) {\n      EyePos = vec3<f32>(input.vertexVC.x, input.vertexVC.y, input.vertexVC.z + 3.0*input.radiusVC);\n      EyeDir = vec3<f32>(0.0, 0.0, -1.0);\n    }\n    else {\n      EyeDir = input.vertexVC.xyz;\n      EyePos = vec3<f32>(0.0,0.0,0.0);\n      var lengthED: f32 = length(EyeDir);\n      EyeDir = normalize(EyeDir);\n      // we adjust the EyePos to be closer if it is too far away\n      // to prevent floating point precision noise\n      if (lengthED > input.radiusVC*3.0) {\n        EyePos = input.vertexVC.xyz - EyeDir*3.0*input.radiusVC;\n      }\n    }\n\n    // translate to Sphere center\n    EyePos = EyePos - input.centerVC;\n    // scale to radius 1.0\n    EyePos = EyePos * (1.0 / input.radiusVC);\n    // find the intersection\n    var b: f32 = 2.0*dot(EyePos,EyeDir);\n    var c: f32 = dot(EyePos,EyePos) - 1.0;\n    var d: f32 = b*b - 4.0*c;\n    var normal: vec3<f32> = vec3<f32>(0.0,0.0,1.0);\n    if (d < 0.0) { discard; }\n    else {\n      var t: f32 = (-b - invertedDepth*sqrt(d))*0.5;\n\n      // compute the normal, for unit sphere this is just\n      // the intersection point\n      normal = invertedDepth*normalize(EyePos + t*EyeDir);\n      // compute the intersection point in VC\n      vertexVC = vec4<f32>(normal * input.radiusVC + input.centerVC, 1.0);\n    }\n    // compute the pixel's depth\n    var pos: vec4<f32> = rendererUBO.VCPCMatrix * vertexVC;\n    output.fragDepth = pos.z / pos.w;\n    ";
    var code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Impl', [sphereFrag]).result;
    fDesc.setCode(code);
  };

  publicAPI.replaceShaderPosition = function (hash, pipeline, vertexInput) {
    var vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinOutput('vec4<f32>', '[[builtin(position)]] Position');
    var code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', ['  output.Position = rendererUBO.VCPCMatrix*vertexVC;']).result;
    vDesc.setCode(code);
  }; // compute a unique hash for a pipeline, this needs to be unique enough to
  // capture any pipeline code changes (which includes shader changes)
  // or vertex input changes/ bind groups/ etc


  publicAPI.computePipelineHash = function (vertexInput) {
    var pipelineHash = 'spm';

    if (vertexInput.hasAttribute("colorVI")) {
      pipelineHash += "c";
    }

    pipelineHash += model.renderEncoder.getPipelineHash();
    return pipelineHash;
  }; // was originally buildIBOs() but not using IBOs right now


  publicAPI.buildPrimitives = function () {
    var poly = model.currentInput;
    var device = model.WebGPURenderWindow.getDevice();
    model.renderable.mapScalars(poly, 1.0); // handle triangles

    var i = PrimitiveTypes.Triangles;
    var points = poly.getPoints();
    var numPoints = points.getNumberOfPoints();
    var pointArray = points.getData();
    var primHelper = model.primitives[i]; // default to one instance and computed number of verts

    primHelper.setNumberOfInstances(1);
    primHelper.setNumberOfVertices(3 * numPoints);
    var vertexInput = model.primitives[i].getVertexInput();
    var buffRequest = {
      hash: points.getMTime(),
      source: points,
      time: points.getMTime(),
      usage: BufferUsage.RawVertex,
      format: 'float32x3'
    };

    if (!device.getBufferManager().hasBuffer(buffRequest)) {
      // xyz v1 v2 v3
      var tmpVBO = new Float32Array(3 * numPoints * 3);
      var pointIdx = 0;
      var vboIdx = 0;

      for (var id = 0; id < numPoints; ++id) {
        pointIdx = id * 3;
        tmpVBO[vboIdx++] = pointArray[pointIdx];
        tmpVBO[vboIdx++] = pointArray[pointIdx + 1];
        tmpVBO[vboIdx++] = pointArray[pointIdx + 2];
        tmpVBO[vboIdx++] = pointArray[pointIdx];
        tmpVBO[vboIdx++] = pointArray[pointIdx + 1];
        tmpVBO[vboIdx++] = pointArray[pointIdx + 2];
        tmpVBO[vboIdx++] = pointArray[pointIdx];
        tmpVBO[vboIdx++] = pointArray[pointIdx + 1];
        tmpVBO[vboIdx++] = pointArray[pointIdx + 2];
      }

      buffRequest.nativeArray = tmpVBO;
      var buff = device.getBufferManager().getBuffer(buffRequest);
      vertexInput.addBuffer(buff, ['vertexBC']);
    } // compute offset VBO


    var pointData = poly.getPointData();
    var scales = null;

    if (model.renderable.getScaleArray() != null && pointData.hasArray(model.renderable.getScaleArray())) {
      scales = pointData.getArray(model.renderable.getScaleArray()).getData();
    }

    var defaultRadius = model.renderable.getRadius();

    if (scales || defaultRadius !== model._lastRadius) {
      buffRequest = {
        hash: scales,
        source: scales,
        time: scales ? pointData.getArray(model.renderable.getScaleArray()).getMTime() : 0,
        usage: BufferUsage.RawVertex,
        format: 'float32x2'
      };

      if (!device.getBufferManager().hasBuffer(buffRequest)) {
        var _tmpVBO = new Float32Array(3 * numPoints * 2);

        var cos30 = Math.cos(radiansFromDegrees(30.0));
        var _vboIdx = 0;

        for (var _id = 0; _id < numPoints; ++_id) {
          var radius = model.renderable.getRadius();

          if (scales) {
            radius = scales[_id];
          }

          _tmpVBO[_vboIdx++] = -2.0 * radius * cos30;
          _tmpVBO[_vboIdx++] = -radius;
          _tmpVBO[_vboIdx++] = 2.0 * radius * cos30;
          _tmpVBO[_vboIdx++] = -radius;
          _tmpVBO[_vboIdx++] = 0.0;
          _tmpVBO[_vboIdx++] = 2.0 * radius;
        }

        buffRequest.nativeArray = _tmpVBO;

        var _buff = device.getBufferManager().getBuffer(buffRequest);

        vertexInput.addBuffer(_buff, ['offsetMC']);
      }

      model._lastRadius = defaultRadius;
    }

    model.renderable.mapScalars(poly, 1.0); // deal with colors but only if modified

    var haveColors = false;

    if (model.renderable.getScalarVisibility()) {
      var c = model.renderable.getColorMapColors();

      if (c) {
        buffRequest = {
          hash: c,
          source: c,
          time: c.getMTime(),
          usage: BufferUsage.RawVertex,
          format: 'unorm8x4'
        };

        if (!device.getBufferManager().hasBuffer(buffRequest)) {
          var colorComponents = c.getNumberOfComponents();

          if (colorComponents !== 4) {
            vtkErrorMacro('this should be 4');
          }

          var _tmpVBO2 = new Uint8Array(3 * numPoints * 4);

          var _vboIdx2 = 0;
          var colorData = c.getData();

          for (var _id2 = 0; _id2 < numPoints; ++_id2) {
            var colorIdx = _id2 * colorComponents;

            for (var v = 0; v < 3; v++) {
              _tmpVBO2[_vboIdx2++] = colorData[colorIdx];
              _tmpVBO2[_vboIdx2++] = colorData[colorIdx + 1];
              _tmpVBO2[_vboIdx2++] = colorData[colorIdx + 2];
              _tmpVBO2[_vboIdx2++] = colorData[colorIdx + 3];
            }
          }

          buffRequest.nativeArray = _tmpVBO2;

          var _buff2 = device.getBufferManager().getBuffer(buffRequest);

          vertexInput.addBuffer(_buff2, ['colorVI']);
        }

        haveColors = true;
      }
    }

    if (!haveColors) {
      vertexInput.removeBufferIfPresent('colorVI');
    }

    primHelper.setPipelineHash(publicAPI.computePipelineHash(vertexInput));
    primHelper.setWebGPURenderer(model.WebGPURenderer);
    primHelper.setTopology('triangle-list');
    primHelper.build(model.renderEncoder, device);
    primHelper.registerToDraw();
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkWebGPUPolyDataMapper.extend(publicAPI, model, initialValues);
  model.primitives[PrimitiveTypes.Triangles].setVertexShaderTemplate(vtkWebGPUSphereMapperVS); // Object methods

  vtkWebGPUSphereMapper(publicAPI, model);
  var sr = model.primitives[PrimitiveTypes.Triangles].getShaderReplacements();
  sr.set('replaceShaderPosition', publicAPI.replaceShaderPosition);
  sr.set('replaceShaderNormal', publicAPI.replaceShaderNormal);
} // ----------------------------------------------------------------------------

var newInstance = newInstance$1(extend, 'vtkWebGPUSphereMapper'); // ----------------------------------------------------------------------------

var index = {
  newInstance: newInstance,
  extend: extend
}; // Register ourself to WebGPU backend if imported

registerOverride('vtkSphereMapper', newInstance);

export { index as default, extend, newInstance };
