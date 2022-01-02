import { mat3, mat4 } from 'gl-matrix';
import { newInstance as newInstance$1, get, setGet } from '../../macros.js';
import vtkMapper from '../Core/Mapper.js';
import vtkProperty from '../Core/Property.js';
import vtkTexture from '../Core/Texture.js';
import vtkWebGPUBufferManager from './BufferManager.js';
import vtkWebGPUShaderCache from './ShaderCache.js';
import vtkWebGPUUniformBuffer from './UniformBuffer.js';
import vtkWebGPUMapperHelper from './MapperHelper.js';
import vtkViewNode from '../SceneGraph/ViewNode.js';
import { registerOverride } from './ViewNodeFactory.js';

var BufferUsage = vtkWebGPUBufferManager.BufferUsage,
    PrimitiveTypes = vtkWebGPUBufferManager.PrimitiveTypes;
var Representation = vtkProperty.Representation;
var ScalarMode = vtkMapper.ScalarMode;
var StartEvent = {
  type: 'StartEvent'
};
var EndEvent = {
  type: 'EndEvent'
};
var vtkWebGPUPolyDataVS = "\n//VTK::Renderer::Dec\n\n//VTK::Color::Dec\n\n//VTK::Normal::Dec\n\n//VTK::TCoord::Dec\n\n//VTK::Select::Dec\n\n//VTK::Mapper::Dec\n\n//VTK::IOStructs::Dec\n\n[[stage(vertex)]]\nfn main(\n//VTK::IOStructs::Input\n)\n//VTK::IOStructs::Output\n{\n  var output : vertexOutput;\n\n  var vertex: vec4<f32> = vertexBC;\n\n  //VTK::Color::Impl\n\n  //VTK::Normal::Impl\n\n  //VTK::TCoord::Impl\n\n  //VTK::Select::Impl\n\n  //VTK::Position::Impl\n\n  return output;\n}\n";
var vtkWebGPUPolyDataFS = "\n//VTK::Renderer::Dec\n\n//VTK::Color::Dec\n\n// optional surface normal declaration\n//VTK::Normal::Dec\n\n//VTK::TCoord::Dec\n\n//VTK::Select::Dec\n\n//VTK::RenderEncoder::Dec\n\n//VTK::Mapper::Dec\n\n//VTK::IOStructs::Dec\n\n[[stage(fragment)]]\nfn main(\n//VTK::IOStructs::Input\n)\n//VTK::IOStructs::Output\n{\n  var output : fragmentOutput;\n\n  var ambientColor: vec4<f32> = mapperUBO.AmbientColor;\n  var diffuseColor: vec4<f32> = mapperUBO.DiffuseColor;\n  var opacity: f32 = mapperUBO.Opacity;\n\n  //VTK::Color::Impl\n\n  //VTK::Normal::Impl\n\n  //VTK::Light::Impl\n\n  var computedColor: vec4<f32> = vec4<f32>(ambientColor.rgb * mapperUBO.AmbientIntensity\n     + diffuse * mapperUBO.DiffuseIntensity\n     + specular * mapperUBO.SpecularIntensity,\n     opacity);\n\n  //VTK::TCoord::Impl\n\n  //VTK::Select::Impl\n\n  if (computedColor.a == 0.0) { discard; };\n\n  //VTK::Position::Impl\n\n  //VTK::RenderEncoder::Impl\n  return output;\n}\n";

function isEdges(hash) {
  // edge pipelines have "edge" in them
  return hash.indexOf('edge') >= 0;
} // ----------------------------------------------------------------------------
// vtkWebGPUPolyDataMapper methods
// ----------------------------------------------------------------------------


function vtkWebGPUPolyDataMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUPolyDataMapper');

  publicAPI.buildPass = function (prepass) {
    if (prepass) {
      model.WebGPUActor = publicAPI.getFirstAncestorOfType('vtkWebGPUActor');
      model.WebGPURenderer = model.WebGPUActor.getFirstAncestorOfType('vtkWebGPURenderer');
      model.WebGPURenderWindow = model.WebGPURenderer.getParent();
      model.device = model.WebGPURenderWindow.getDevice();
    }
  }; // Renders myself


  publicAPI.translucentPass = function (prepass) {
    if (prepass) {
      publicAPI.render();
    }
  };

  publicAPI.opaquePass = function (prepass) {
    if (prepass) {
      publicAPI.render();
    }
  };

  publicAPI.updateUBO = function () {
    // make sure the data is up to date
    var actor = model.WebGPUActor.getRenderable();
    var ppty = actor.getProperty();
    var utime = model.UBO.getSendTime();

    if (publicAPI.getMTime() > utime || ppty.getMTime() > utime || model.renderable.getMTime() > utime) {
      var keyMats = model.WebGPUActor.getKeyMatrices(model.WebGPURenderer);
      model.UBO.setArray('BCWCMatrix', keyMats.bcwc);
      model.UBO.setArray('BCSCMatrix', keyMats.bcsc);
      model.UBO.setArray('MCWCNormals', keyMats.normalMatrix);
      var aColor = ppty.getAmbientColorByReference();
      model.UBO.setValue('AmbientIntensity', ppty.getAmbient());
      model.UBO.setArray('AmbientColor', [aColor[0], aColor[1], aColor[2], 1.0]);
      model.UBO.setValue('DiffuseIntensity', ppty.getDiffuse());
      aColor = ppty.getDiffuseColorByReference();
      model.UBO.setArray('DiffuseColor', [aColor[0], aColor[1], aColor[2], 1.0]);
      model.UBO.setValue('SpecularIntensity', ppty.getSpecular());
      model.UBO.setValue('SpecularPower', ppty.getSpecularPower());
      aColor = ppty.getSpecularColorByReference();
      model.UBO.setArray('SpecularColor', [aColor[0], aColor[1], aColor[2], 1.0]);
      aColor = ppty.getEdgeColorByReference();
      model.UBO.setArray('EdgeColor', [aColor[0], aColor[1], aColor[2], 1.0]);
      model.UBO.setValue('Opacity', ppty.getOpacity());
      model.UBO.setValue('PropID', model.WebGPUActor.getPropID());
      var device = model.WebGPURenderWindow.getDevice();
      model.UBO.sendIfNeeded(device);
    }
  };

  publicAPI.render = function () {
    publicAPI.invokeEvent(StartEvent);

    if (!model.renderable.getStatic()) {
      model.renderable.update();
    }

    model.currentInput = model.renderable.getInputData();
    publicAPI.invokeEvent(EndEvent);
    model.renderEncoder = model.WebGPURenderer.getRenderEncoder();
    publicAPI.buildPrimitives(); // update descriptor sets

    publicAPI.updateUBO();
  };

  publicAPI.replaceShaderPosition = function (hash, pipeline, vertexInput) {
    var vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinOutput('vec4<f32>', '[[builtin(position)]] Position');
    var code = vDesc.getCode();

    if (isEdges(hash)) {
      vDesc.addBuiltinInput('u32', '[[builtin(instance_index)]] instanceIndex'); // widen the edge

      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', ['    var tmpPos: vec4<f32> = rendererUBO.SCPCMatrix*mapperUBO.BCSCMatrix*vertexBC;', '    var tmpPos2: vec3<f32> = tmpPos.xyz / tmpPos.w;', '    tmpPos2.x = tmpPos2.x + 1.4*(f32(input.instanceIndex % 2u) - 0.5)/rendererUBO.viewportSize.x;', '    tmpPos2.y = tmpPos2.y + 1.4*(f32(input.instanceIndex / 2u) - 0.5)/rendererUBO.viewportSize.y;', '    tmpPos2.z = tmpPos2.z + 0.00001;', // could become a setting
      '    output.Position = vec4<f32>(tmpPos2.xyz * tmpPos.w, tmpPos.w);']).result;
    } else {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', ['    output.Position = rendererUBO.SCPCMatrix*mapperUBO.BCSCMatrix*vertexBC;']).result;
    }

    vDesc.setCode(code);
  };

  publicAPI.replaceShaderNormal = function (hash, pipeline, vertexInput) {
    if (vertexInput.hasAttribute('normalMC')) {
      var vDesc = pipeline.getShaderDescription('vertex');
      vDesc.addOutput('vec3<f32>', 'normalVC');
      var code = vDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Impl', ['  output.normalVC = normalize((rendererUBO.WCVCNormals * mapperUBO.MCWCNormals * normalMC).xyz);']).result;
      vDesc.setCode(code);
      var fDesc = pipeline.getShaderDescription('fragment');
      code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Impl', ['  var normal: vec3<f32> = input.normalVC;', '  if (!input.frontFacing) { normal = -normal; }']).result;
      fDesc.setCode(code);
    }
  }; // we only apply lighting when there is a "var normal" declaration in the
  // fragment shader code. That is the lighting trigger.


  publicAPI.replaceShaderLight = function (hash, pipeline, vertexInput) {
    var fDesc = pipeline.getShaderDescription('fragment');
    var code = fDesc.getCode();

    if (code.includes('var normal')) {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Light::Impl', ['  var df: f32  = max(0.0, normal.z);', '  var sf: f32 = pow(df, mapperUBO.SpecularPower);', '  var diffuse: vec3<f32> = df * diffuseColor.rgb;', '  var specular: vec3<f32> = sf * mapperUBO.SpecularColor.rgb * mapperUBO.SpecularColor.a;']).result;
      fDesc.setCode(code);
    } else {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Light::Impl', ['  var diffuse: vec3<f32> = diffuseColor.rgb;', '  var specular: vec3<f32> = mapperUBO.SpecularColor.rgb * mapperUBO.SpecularColor.a;']).result;
      fDesc.setCode(code);
    }
  };

  publicAPI.replaceShaderColor = function (hash, pipeline, vertexInput) {
    if (isEdges(hash)) {
      var _fDesc = pipeline.getShaderDescription('fragment');

      var _code = _fDesc.getCode();

      _code = vtkWebGPUShaderCache.substitute(_code, '//VTK::Color::Impl', ['ambientColor = mapperUBO.EdgeColor;', 'diffuseColor = mapperUBO.EdgeColor;']).result;

      _fDesc.setCode(_code);

      return;
    }

    if (!vertexInput.hasAttribute('colorVI')) return;
    var vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addOutput('vec4<f32>', 'color');
    var code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', ['  output.color = colorVI;']).result;
    vDesc.setCode(code);
    var fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', ['ambientColor = input.color;', 'diffuseColor = input.color;', 'opacity = mapperUBO.Opacity * input.color.a;']).result;
    fDesc.setCode(code);
  };

  publicAPI.replaceShaderTCoord = function (hash, pipeline, vertexInput) {
    if (!vertexInput.hasAttribute('tcoord')) return;
    var vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addOutput('vec2<f32>', 'tcoordVS');
    var code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::TCoord::Impl', ['  output.tcoordVS = tcoord;']).result;
    vDesc.setCode(code);
    var fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode(); // todo handle multiple textures? Blend multiply ?

    if (model.textures.length) {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::TCoord::Impl', ['var tcolor: vec4<f32> = textureSample(Texture0, Texture0Sampler, input.tcoordVS);', 'computedColor = computedColor*tcolor;']).result;
    }

    fDesc.setCode(code);
  };

  publicAPI.replaceShaderSelect = function (hash, pipeline, vertexInput) {
    if (hash.includes('sel')) {
      var fDesc = pipeline.getShaderDescription('fragment');
      var code = fDesc.getCode(); // by default there are no composites, so just 0

      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Select::Impl', ['  var compositeID: u32 = 0u;']).result;
      fDesc.setCode(code);
    }
  };

  publicAPI.getUsage = function (rep, i) {
    if (rep === Representation.POINTS || i === PrimitiveTypes.Points) {
      return BufferUsage.Verts;
    }

    if (i === PrimitiveTypes.Lines) {
      return BufferUsage.Lines;
    }

    if (rep === Representation.WIREFRAME) {
      if (i === PrimitiveTypes.Triangles) {
        return BufferUsage.LinesFromTriangles;
      }

      return BufferUsage.LinesFromStrips;
    }

    if (i === PrimitiveTypes.Triangles) {
      return BufferUsage.Triangles;
    }

    if (i === PrimitiveTypes.TriangleStrips) {
      return BufferUsage.Strips;
    }

    if (i === PrimitiveTypes.TriangleEdges) {
      return BufferUsage.LinesFromTriangles;
    } // only strip edges left which are lines


    return BufferUsage.LinesFromStrips;
  };

  publicAPI.getHashFromUsage = function (usage) {
    return "pt".concat(usage);
  };

  publicAPI.getTopologyFromUsage = function (usage) {
    switch (usage) {
      case BufferUsage.Triangles:
        return 'triangle-list';

      case BufferUsage.Verts:
        return 'point-list';

      default:
      case BufferUsage.Lines:
        return 'line-list';
    }
  };

  publicAPI.buildVertexInput = function (pd, cells, primType) {
    var actor = model.WebGPUActor.getRenderable();
    var representation = actor.getProperty().getRepresentation();
    var device = model.WebGPURenderWindow.getDevice();
    var edges = false;

    if (primType === PrimitiveTypes.TriangleEdges) {
      edges = true;
      representation = Representation.WIREFRAME;
    }

    var vertexInput = model.primitives[primType].getVertexInput(); // hash = all things that can change the values on the buffer
    // since mtimes are unique we can use
    // - cells mtime - because cells drive how we pack
    // - rep (point/wireframe/surface) - again because of packing
    // - relevant dataArray mtime - the source data
    // - shift - not currently captured
    // - scale - not currently captured
    // - format
    // - usage
    // - packExtra - covered by format
    // - prim type (vert/lines/polys/strips) - covered by cells mtime

    var hash = cells.getMTime() + representation; // points

    var points = pd.getPoints();

    if (points) {
      var shift = model.WebGPUActor.getBufferShift(model.WebGPURenderer);
      var buffRequest = {
        hash: hash + points.getMTime(),
        dataArray: points,
        source: points,
        cells: cells,
        primitiveType: primType,
        representation: representation,
        time: Math.max(points.getMTime(), cells.getMTime(), model.WebGPUActor.getKeyMatricesTime().getMTime()),
        shift: shift,
        usage: BufferUsage.PointArray,
        format: 'float32x4',
        packExtra: true
      };
      var buff = device.getBufferManager().getBuffer(buffRequest);
      vertexInput.addBuffer(buff, ['vertexBC']);
    } else {
      vertexInput.removeBufferIfPresent('vertexBC');
    } // normals, only used for surface rendering


    var usage = publicAPI.getUsage(representation, primType);

    if (usage === BufferUsage.Triangles || usage === BufferUsage.Strips) {
      var normals = pd.getPointData().getNormals();
      var _buffRequest = {
        cells: cells,
        representation: representation,
        primitiveType: primType,
        format: 'snorm8x4',
        packExtra: true,
        shift: 0,
        scale: 127
      };

      if (normals) {
        _buffRequest.hash = hash + normals.getMTime();
        _buffRequest.dataArray = normals;
        _buffRequest.source = normals;
        _buffRequest.time = Math.max(normals.getMTime(), cells.getMTime());
        _buffRequest.usage = BufferUsage.PointArray;

        var _buff = device.getBufferManager().getBuffer(_buffRequest);

        vertexInput.addBuffer(_buff, ['normalMC']);
      } else if (primType === PrimitiveTypes.Triangles) {
        _buffRequest.hash = hash + points.getMTime();
        _buffRequest.dataArray = points;
        _buffRequest.source = points;
        _buffRequest.time = Math.max(points.getMTime(), cells.getMTime());
        _buffRequest.usage = BufferUsage.NormalsFromPoints;

        var _buff2 = device.getBufferManager().getBuffer(_buffRequest);

        vertexInput.addBuffer(_buff2, ['normalMC']);
      } else {
        vertexInput.removeBufferIfPresent('normalMC');
      }
    } else {
      vertexInput.removeBufferIfPresent('normalMC');
    } // deal with colors but only if modified


    var haveColors = false;

    if (model.renderable.getScalarVisibility()) {
      var c = model.renderable.getColorMapColors();

      if (c && !edges) {
        var scalarMode = model.renderable.getScalarMode();
        var haveCellScalars = false; // We must figure out how the scalars should be mapped to the polydata.

        if ((scalarMode === ScalarMode.USE_CELL_DATA || scalarMode === ScalarMode.USE_CELL_FIELD_DATA || scalarMode === ScalarMode.USE_FIELD_DATA || !pd.getPointData().getScalars()) && scalarMode !== ScalarMode.USE_POINT_FIELD_DATA && c) {
          haveCellScalars = true;
        }

        var _buffRequest2 = {
          hash: hash + points.getMTime(),
          dataArray: c,
          source: c,
          cells: cells,
          primitiveType: primType,
          representation: representation,
          time: Math.max(c.getMTime(), cells.getMTime()),
          usage: BufferUsage.PointArray,
          format: 'unorm8x4',
          cellData: haveCellScalars,
          cellOffset: 0
        };

        var _buff3 = device.getBufferManager().getBuffer(_buffRequest2);

        vertexInput.addBuffer(_buff3, ['colorVI']);
        haveColors = true;
      }
    }

    if (!haveColors) {
      vertexInput.removeBufferIfPresent('colorVI');
    }

    var tcoords = null;

    if (model.renderable.getInterpolateScalarsBeforeMapping() && model.renderable.getColorCoordinates()) {
      tcoords = model.renderable.getColorCoordinates();
    } else {
      tcoords = pd.getPointData().getTCoords();
    }

    if (tcoords && !edges) {
      var _buffRequest3 = {
        hash: hash + tcoords.getMTime(),
        dataArray: tcoords,
        source: tcoords,
        cells: cells,
        primitiveType: primType,
        representation: representation,
        time: Math.max(tcoords.getMTime(), cells.getMTime()),
        usage: BufferUsage.PointArray,
        format: 'float32x2'
      };

      var _buff4 = device.getBufferManager().getBuffer(_buffRequest3);

      vertexInput.addBuffer(_buff4, ['tcoord']);
    } else {
      vertexInput.removeBufferIfPresent('tcoord');
    }
  };

  publicAPI.updateTextures = function () {
    // we keep track of new and used textures so
    // that we can clean up any unused textures so we don't hold onto them
    var usedTextures = [];
    var newTextures = []; // do we have a scalar color texture

    var idata = model.renderable.getColorTextureMap(); // returns an imagedata

    if (idata) {
      if (!model.colorTexture) {
        model.colorTexture = vtkTexture.newInstance();
      }

      model.colorTexture.setInputData(idata);
      newTextures.push(model.colorTexture);
    } // actor textures?


    var actor = model.WebGPUActor.getRenderable();
    var textures = actor.getTextures();

    for (var i = 0; i < textures.length; i++) {
      if (textures[i].getInputData()) {
        newTextures.push(textures[i]);
      }

      if (textures[i].getImage() && textures[i].getImageLoaded()) {
        newTextures.push(textures[i]);
      }
    }

    var usedCount = 0;

    for (var _i = 0; _i < newTextures.length; _i++) {
      var srcTexture = newTextures[_i];
      var treq = {};

      if (srcTexture.getInputData()) {
        treq.imageData = srcTexture.getInputData();
        treq.source = treq.imageData;
      } else if (srcTexture.getImage()) {
        treq.image = srcTexture.getImage();
        treq.source = treq.image;
      }

      var newTex = model.device.getTextureManager().getTexture(treq);

      if (newTex.getReady()) {
        // is this a new texture
        var found = false;

        for (var t = 0; t < model.textures.length; t++) {
          if (model.textures[t] === newTex) {
            usedCount++;
            found = true;
            usedTextures[t] = true;
          }
        }

        if (!found) {
          usedTextures[model.textures.length] = true;
          var tview = newTex.createView();
          tview.setName("Texture".concat(usedCount++));
          model.textures.push(newTex);
          model.textureViews.push(tview);
          var interpolate = srcTexture.getInterpolate() ? 'linear' : 'nearest';
          tview.addSampler(model.device, {
            minFilter: interpolate,
            magFilter: interpolate
          });
        }
      }
    } // remove unused textures


    for (var _i2 = model.textures.length - 1; _i2 >= 0; _i2--) {
      if (!usedTextures[_i2]) {
        model.textures.splice(_i2, 1);
        model.textureViews.splice(_i2, 1);
      }
    }
  }; // compute a unique hash for a pipeline, this needs to be unique enough to
  // capture any pipeline code changes (which includes shader changes)
  // or vertex input changes/ bind groups/ etc


  publicAPI.computePipelineHash = function (vertexInput, usage, edges) {
    var pipelineHash = 'pd';

    if (edges) {
      pipelineHash += 'edge';
    } else {
      if (vertexInput.hasAttribute("normalMC")) {
        pipelineHash += "n";
      }

      if (vertexInput.hasAttribute("colorVI")) {
        pipelineHash += "c";
      }

      if (vertexInput.hasAttribute("tcoord")) {
        pipelineHash += "t";
      }

      if (model.textures.length) {
        pipelineHash += "tx".concat(model.textures.length);
      }
    }

    if (model.SSBO) {
      pipelineHash += "ssbo";
    }

    var uhash = publicAPI.getHashFromUsage(usage);
    pipelineHash += uhash;
    pipelineHash += model.renderEncoder.getPipelineHash();
    return pipelineHash;
  }; // was originally buildIBOs() but not using IBOs right now


  publicAPI.buildPrimitives = function () {
    var poly = model.currentInput;
    var prims = [poly.getVerts(), poly.getLines(), poly.getPolys(), poly.getStrips()];
    var device = model.WebGPURenderWindow.getDevice();
    model.renderable.mapScalars(poly, 1.0); // handle textures

    publicAPI.updateTextures();
    var actor = model.WebGPUActor.getRenderable();
    var rep = actor.getProperty().getRepresentation();
    var edgeVisibility = actor.getProperty().getEdgeVisibility(); // handle per primitive type

    for (var i = PrimitiveTypes.Points; i <= PrimitiveTypes.Triangles; i++) {
      if (prims[i].getNumberOfValues() > 0) {
        {
          var usage = publicAPI.getUsage(rep, i);
          var primHelper = model.primitives[i];
          publicAPI.buildVertexInput(model.currentInput, prims[i], i);
          primHelper.setPipelineHash(publicAPI.computePipelineHash(primHelper.getVertexInput(), usage, false));
          primHelper.setTextureViews(model.textureViews);
          primHelper.setWebGPURenderer(model.WebGPURenderer);
          primHelper.setNumberOfInstances(1);
          var vbo = primHelper.getVertexInput().getBuffer('vertexBC');
          primHelper.setNumberOfVertices(vbo.getSizeInBytes() / vbo.getStrideInBytes());
          primHelper.setTopology(publicAPI.getTopologyFromUsage(usage));
          primHelper.build(model.renderEncoder, device);
          primHelper.registerToDraw();
        } // also handle edge visibility if turned on

        if (edgeVisibility && rep === Representation.SURFACE && i === PrimitiveTypes.Triangles) {
          var _primHelper = model.primitives[PrimitiveTypes.TriangleEdges];

          var _usage = publicAPI.getUsage(rep, PrimitiveTypes.TriangleEdges);

          publicAPI.buildVertexInput(model.currentInput, prims[PrimitiveTypes.Triangles], PrimitiveTypes.TriangleEdges);

          _primHelper.setPipelineHash(publicAPI.computePipelineHash(_primHelper.getVertexInput(), _usage, true));

          _primHelper.setWebGPURenderer(model.WebGPURenderer);

          _primHelper.setNumberOfInstances(4);

          var _vbo = _primHelper.getVertexInput().getBuffer('vertexBC');

          _primHelper.setNumberOfVertices(_vbo.getSizeInBytes() / _vbo.getStrideInBytes());

          _primHelper.setTopology(publicAPI.getTopologyFromUsage(_usage));

          _primHelper.build(model.renderEncoder, device);

          _primHelper.registerToDraw();
        }
      }
    }
  };

  publicAPI.setShaderReplacement = function (name, func) {
    for (var i = PrimitiveTypes.Start; i < PrimitiveTypes.End; i++) {
      var sr = model.primitives[i].getShaderReplacements();
      sr.set(name, func);
    }
  };

  publicAPI.setFragmentShaderTemplate = function (val) {
    model.fragmentShaderTemplate = val;

    for (var i = PrimitiveTypes.Start; i < PrimitiveTypes.End; i++) {
      model.primitives[i].setFragmentShaderTemplate(val);
    }
  };

  publicAPI.setVertexShaderTemplate = function (val) {
    model.fragmentShaderTemplate = val;

    for (var i = PrimitiveTypes.Start; i < PrimitiveTypes.End; i++) {
      model.primitives[i].setVertexShaderTemplate(val);
    }
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  colorTexture: null,
  renderEncoder: null,
  textures: null,
  textureViews: null,
  primitives: null,
  tmpMat4: null,
  fragmentShaderTemplate: null,
  vertexShaderTemplate: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkViewNode.extend(publicAPI, model, initialValues);
  model.tmpMat3 = mat3.identity(new Float64Array(9));
  model.tmpMat4 = mat4.identity(new Float64Array(16));
  model.fragmentShaderTemplate = model.fragmentShaderTemplate || vtkWebGPUPolyDataFS;
  model.vertexShaderTemplate = model.vertexShaderTemplate || vtkWebGPUPolyDataVS;
  model.UBO = vtkWebGPUUniformBuffer.newInstance();
  model.UBO.setName('mapperUBO');
  model.UBO.addEntry('BCWCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('BCSCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('MCWCNormals', 'mat4x4<f32>');
  model.UBO.addEntry('AmbientColor', 'vec4<f32>');
  model.UBO.addEntry('DiffuseColor', 'vec4<f32>');
  model.UBO.addEntry('EdgeColor', 'vec4<f32>');
  model.UBO.addEntry('AmbientIntensity', 'f32');
  model.UBO.addEntry('DiffuseIntensity', 'f32');
  model.UBO.addEntry('SpecularColor', 'vec4<f32>');
  model.UBO.addEntry('SpecularIntensity', 'f32');
  model.UBO.addEntry('Opacity', 'f32');
  model.UBO.addEntry('SpecularPower', 'f32');
  model.UBO.addEntry('PropID', 'u32'); // Build VTK API

  get(publicAPI, model, ['fragmentShaderTemplate', 'vertexShaderTemplate', 'UBO']);
  setGet(publicAPI, model, ['renderEncoder']);
  model.textures = [];
  model.textureViews = [];
  model.primitives = []; // Object methods

  vtkWebGPUPolyDataMapper(publicAPI, model);

  for (var i = PrimitiveTypes.Start; i < PrimitiveTypes.End; i++) {
    model.primitives[i] = vtkWebGPUMapperHelper.newInstance();
    model.primitives[i].setUBO(model.UBO);
    model.primitives[i].setVertexShaderTemplate(publicAPI.getVertexShaderTemplate());
    model.primitives[i].setFragmentShaderTemplate(publicAPI.getFragmentShaderTemplate());
  }

  publicAPI.setShaderReplacement('replaceShaderPosition', publicAPI.replaceShaderPosition);
  publicAPI.setShaderReplacement('replaceShaderLight', publicAPI.replaceShaderLight);
  publicAPI.setShaderReplacement('replaceShaderTCoord', publicAPI.replaceShaderTCoord);
  publicAPI.setShaderReplacement('replaceShaderNormal', publicAPI.replaceShaderNormal);
  publicAPI.setShaderReplacement('replaceShaderSelect', publicAPI.replaceShaderSelect);
  publicAPI.setShaderReplacement('replaceShaderColor', publicAPI.replaceShaderColor);
} // ----------------------------------------------------------------------------

var newInstance = newInstance$1(extend, 'vtkWebGPUPolyDataMapper'); // ----------------------------------------------------------------------------

var vtkWebGPUPolyDataMapper$1 = {
  newInstance: newInstance,
  extend: extend
}; // Register ourself to WebGPU backend if imported

registerOverride('vtkMapper', newInstance);

export { vtkWebGPUPolyDataMapper$1 as default, extend, newInstance };
