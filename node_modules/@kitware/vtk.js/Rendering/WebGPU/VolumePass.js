import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import macro from '../../macros.js';
import vtkPolyData from '../../Common/DataModel/PolyData.js';
import vtkProperty from '../Core/Property.js';
import vtkRenderPass from '../SceneGraph/RenderPass.js';
import vtkWebGPUBufferManager from './BufferManager.js';
import vtkWebGPUMapperHelper from './MapperHelper.js';
import vtkWebGPURenderEncoder from './RenderEncoder.js';
import vtkWebGPUShaderCache from './ShaderCache.js';
import vtkWebGPUTexture from './Texture.js';
import vtkWebGPUVolumePassFSQ from './VolumePassFSQ.js';

var Representation = vtkProperty.Representation;
var BufferUsage = vtkWebGPUBufferManager.BufferUsage,
    PrimitiveTypes = vtkWebGPUBufferManager.PrimitiveTypes; // The volume rendering pass consists of two sub passes. The first
// (depthRange) renders polygonal cubes for the volumes to compute min and
// max bounds in depth for the image. This is then fed into the second pass
// (final) which actually does the raycasting between those bounds sampling
// the volumes along the way. So the first pass tends to be very fast whicle
// the second is where most of the work is done.
// given x then y then z ordering
//
//     2-----3
//   / |   / |
//  6-----7  |
//  |  |  |  |
//  |  0-----1
//  |/    |/
//  4-----5
//

var cubeFaceTriangles = [[0, 4, 6], [0, 6, 2], [1, 3, 7], [1, 7, 5], [0, 5, 4], [0, 1, 5], [2, 6, 7], [2, 7, 3], [0, 3, 1], [0, 2, 3], [4, 5, 7], [4, 7, 6]];
var DepthBoundsFS = "\n//VTK::Renderer::Dec\n\n//VTK::Select::Dec\n\n//VTK::VolumePass::Dec\n\n//VTK::TCoord::Dec\n\n//VTK::RenderEncoder::Dec\n\n//VTK::Mapper::Dec\n\n//VTK::IOStructs::Dec\n\n[[stage(fragment)]]\nfn main(\n//VTK::IOStructs::Input\n)\n//VTK::IOStructs::Output\n{\n  var output : fragmentOutput;\n\n  //VTK::Select::Impl\n\n  //VTK::TCoord::Impl\n\n  //VTK::VolumePass::Impl\n\n  // use the maximum (closest) of the current value and the zbuffer\n  // the blend func will then take the min to find the farthest stop value\n  var stopval: f32 = max(input.fragPos.z, textureLoad(opaquePassDepthTexture, vec2<i32>(i32(input.fragPos.x), i32(input.fragPos.y)), 0));\n\n  //VTK::RenderEncoder::Impl\n  return output;\n}\n";
/* eslint-disable no-undef */

/* eslint-disable no-bitwise */
// ----------------------------------------------------------------------------

function vtkWebGPUVolumePass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUVolumePass');

  publicAPI.traverse = function (renNode, viewNode) {
    if (model.deleted) {
      return;
    } // we just render our delegates in order


    model.currentParent = viewNode; // first render the boxes to generate a min max depth
    // map for all the volumes

    publicAPI.renderDepthBounds(renNode, viewNode); // then perform the ray casting using the depth bounds texture

    if (!model.finalEncoder) {
      publicAPI.createFinalEncoder(viewNode);
    }

    publicAPI.finalPass(viewNode, renNode);
  };

  publicAPI.finalPass = function (viewNode, renNode) {
    model.finalEncoder.setColorTextureView(0, model.colorTextureView);
    model.finalEncoder.attachTextureViews();
    renNode.setRenderEncoder(model.finalEncoder);
    model.finalEncoder.begin(viewNode.getCommandEncoder());
    renNode.scissorAndViewport(model.finalEncoder);
    model.fullScreenQuad.setWebGPURenderer(renNode);
    model.fullScreenQuad.setVolumes(model.volumes);
    model.fullScreenQuad.render(model.finalEncoder, viewNode.getDevice());
    model.finalEncoder.end();
  };

  publicAPI.renderDepthBounds = function (renNode, viewNode) {
    publicAPI.updateDepthPolyData(renNode);
    var pd = model._boundsPoly;
    var cells = pd.getPolys();
    var hash = cells.getMTime(); // points

    var points = pd.getPoints();
    var buffRequest = {
      hash: hash + points.getMTime(),
      dataArray: points,
      source: points,
      cells: cells,
      primitiveType: PrimitiveTypes.Triangles,
      representation: Representation.SURFACE,
      time: Math.max(points.getMTime(), cells.getMTime()),
      usage: BufferUsage.PointArray,
      format: 'float32x4',
      packExtra: true
    };
    var buff = viewNode.getDevice().getBufferManager().getBuffer(buffRequest);

    model._mapper.getVertexInput().addBuffer(buff, ['vertexBC']);

    model._mapper.setNumberOfVertices(buff.getSizeInBytes() / buff.getStrideInBytes());

    publicAPI.drawDepthRange(renNode, viewNode);
  };

  publicAPI.updateDepthPolyData = function (renNode) {
    // check mtimes first
    var update = false;

    for (var i = 0; i < model.volumes.length; i++) {
      var mtime = model.volumes[i].getMTime();

      if (!model._lastMTimes[i] || mtime !== model._lastMTimes[i]) {
        update = true;
        model._lastMTimes[i] = mtime;
      }
    } // also check stabilized time


    var stime = renNode.getStabilizedTime();

    if (!model._lastMTimes[model.volumes.length] || stime !== model._lastMTimes[model.volumes.length]) {
      update = true;
      model._lastMTimes[model.volumes.length] = stime;
    } // if no need to update then return


    if (!update) {
      return;
    } // rebuild


    var center = renNode.getStabilizedCenterByReference();
    var numPts = model.volumes.length * 8;
    var points = new Float64Array(numPts * 3);
    var numTris = model.volumes.length * 12;
    var polys = new Uint16Array(numTris * 4); // add points and cells

    for (var _i = 0; _i < model.volumes.length; _i++) {
      model.volumes[_i].getBoundingCubePoints(points, _i * 24);

      var cellIdx = _i * 12 * 4;
      var offset = _i * 8;

      for (var t = 0; t < 12; t++) {
        polys[cellIdx++] = 3;
        polys[cellIdx++] = offset + cubeFaceTriangles[t][0];
        polys[cellIdx++] = offset + cubeFaceTriangles[t][1];
        polys[cellIdx++] = offset + cubeFaceTriangles[t][2];
      }
    }

    for (var p = 0; p < points.length; p += 3) {
      points[p] -= center[0];
      points[p + 1] -= center[1];
      points[p + 2] -= center[2];
    }

    model._boundsPoly.getPoints().setData(points, 3);

    model._boundsPoly.getPoints().modified();

    model._boundsPoly.getPolys().setData(polys, 1);

    model._boundsPoly.getPolys().modified();

    model._boundsPoly.modified();
  };

  publicAPI.drawDepthRange = function (renNode, viewNode) {
    var device = viewNode.getDevice(); // copy current depth buffer to

    if (!model.depthRangeEncoder) {
      publicAPI.createDepthRangeEncoder();
      model.depthRangeTexture = vtkWebGPUTexture.newInstance();
      model.depthRangeTexture.create(device, {
        width: viewNode.getCanvas().width,
        height: viewNode.getCanvas().height,
        format: 'r16float',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
      });
      var maxView = model.depthRangeTexture.createView();
      maxView.setName('maxTexture');
      model.depthRangeEncoder.setColorTextureView(0, maxView);
      model.depthRangeTexture2 = vtkWebGPUTexture.newInstance();
      model.depthRangeTexture2.create(device, {
        width: viewNode.getCanvas().width,
        height: viewNode.getCanvas().height,
        format: 'r16float',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
      });
      var minView = model.depthRangeTexture2.createView();
      minView.setName('minTexture');
      model.depthRangeEncoder.setColorTextureView(1, minView);

      model._mapper.setDevice(viewNode.getDevice());

      model._mapper.setTextureViews([model.depthTextureView]);
    } else {
      model.depthRangeTexture.resizeToMatch(model.colorTextureView.getTexture());
      model.depthRangeTexture2.resizeToMatch(model.colorTextureView.getTexture());
    }

    model.depthRangeEncoder.attachTextureViews();
    publicAPI.setCurrentOperation('volumeDepthRangePass');
    renNode.setRenderEncoder(model.depthRangeEncoder);
    renNode.volumeDepthRangePass(true);

    model._mapper.setWebGPURenderer(renNode);

    model._mapper.build(model.depthRangeEncoder, device);

    model._mapper.registerToDraw();

    renNode.volumeDepthRangePass(false);
  };

  publicAPI.createDepthRangeEncoder = function () {
    model.depthRangeEncoder = vtkWebGPURenderEncoder.newInstance();
    model.depthRangeEncoder.setPipelineHash('volr');
    model.depthRangeEncoder.setReplaceShaderCodeFunction(function (pipeline) {
      var fDesc = pipeline.getShaderDescription('fragment');
      fDesc.addOutput('vec4<f32>', 'outColor1');
      fDesc.addOutput('vec4<f32>', 'outColor2');
      var code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::RenderEncoder::Impl', ['output.outColor1 = vec4<f32>(stopval, 0.0, 0.0, 0.0);', 'output.outColor2 = vec4<f32>(input.fragPos.z, 0.0, 0.0, 0.0);']).result;
      fDesc.setCode(code);
    });
    model.depthRangeEncoder.setDescription({
      colorAttachments: [{
        view: null,
        loadValue: [0.0, 0.0, 0.0, 0.0],
        storeOp: 'store'
      }, {
        view: null,
        loadValue: [1.0, 1.0, 1.0, 1.0],
        storeOp: 'store'
      }]
    });
    model.depthRangeEncoder.setPipelineSettings({
      primitive: {
        cullMode: 'none'
      },
      fragment: {
        targets: [{
          format: 'r16float',
          blend: {
            color: {
              srcFactor: 'one',
              dstFactor: 'one',
              operation: 'max'
            },
            alpha: {
              srcfactor: 'one',
              dstFactor: 'one',
              operation: 'max'
            }
          }
        }, {
          format: 'r16float',
          blend: {
            color: {
              srcFactor: 'one',
              dstFactor: 'one',
              operation: 'min'
            },
            alpha: {
              srcfactor: 'one',
              dstFactor: 'one',
              operation: 'min'
            }
          }
        }]
      }
    });
  };

  publicAPI.createFinalEncoder = function (viewNode) {
    model.fullScreenQuad = vtkWebGPUVolumePassFSQ.newInstance();
    model.fullScreenQuad.setDevice(viewNode.getDevice());
    model.fullScreenQuad.setTextureViews(_toConsumableArray(model.depthRangeEncoder.getColorTextureViews()));
    model.finalEncoder = vtkWebGPURenderEncoder.newInstance();
    model.finalEncoder.setDescription({
      colorAttachments: [{
        view: null,
        loadValue: 'load',
        storeOp: 'store'
      }]
    });
    model.finalEncoder.setReplaceShaderCodeFunction(function (pipeline) {
      var fDesc = pipeline.getShaderDescription('fragment');
      fDesc.addOutput('vec4<f32>', 'outColor');
      var code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::RenderEncoder::Impl', ['output.outColor = vec4<f32>(computedColor.rgb*computedColor.a, computedColor.a);']).result;
      fDesc.setCode(code);
    });
    model.finalEncoder.setPipelineHash('volpf');
    model.finalEncoder.setPipelineSettings({
      primitive: {
        cullMode: 'none'
      },
      fragment: {
        targets: [{
          format: 'bgra8unorm',
          blend: {
            color: {
              srcFactor: 'one',
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
  }; // marks modified when needed


  publicAPI.setVolumes = function (val) {
    if (!model.volumes || model.volumes.length !== val.length) {
      model.volumes = _toConsumableArray(val);
      publicAPI.modified();
      return;
    }

    for (var i = 0; i < val.length; i++) {
      if (val[i] !== model.volumes[i]) {
        model.volumes = _toConsumableArray(val);
        publicAPI.modified();
        return;
      }
    }
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  colorTextureView: null,
  depthTextureView: null,
  volumes: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  vtkRenderPass.extend(publicAPI, model, initialValues);
  model._mapper = vtkWebGPUMapperHelper.newInstance();

  model._mapper.setFragmentShaderTemplate(DepthBoundsFS);

  model._mapper.getShaderReplacements().set('replaceShaderVolumePass', function (hash, pipeline, vertexInput) {
    var fDesc = pipeline.getShaderDescription('fragment');
    fDesc.addBuiltinInput('vec4<f32>', '[[builtin(position)]] fragPos');
  });

  model._boundsPoly = vtkPolyData.newInstance();
  model._lastMTimes = [];
  macro.setGet(publicAPI, model, ['colorTextureView', 'depthTextureView']); // Object methods

  vtkWebGPUVolumePass(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkWebGPUVolumePass'); // ----------------------------------------------------------------------------

var vtkWebGPUVolumePass$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkWebGPUVolumePass$1 as default, extend, newInstance };
