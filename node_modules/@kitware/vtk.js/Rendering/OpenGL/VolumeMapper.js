import _defineProperty from '@babel/runtime/helpers/defineProperty';
import { newInstance as newInstance$1, obj, setGet, vtkWarningMacro as vtkWarningMacro$1, vtkErrorMacro as vtkErrorMacro$1 } from '../../macros.js';
import { mat4, mat3, vec3 } from 'gl-matrix';
import vtkDataArray from '../../Common/Core/DataArray.js';
import { VtkDataTypes } from '../../Common/Core/DataArray/Constants.js';
import vtkHelper from './Helper.js';
import { u as uninitializeBounds } from '../../Common/Core/Math/index.js';
import vtkOpenGLFramebuffer from './Framebuffer.js';
import vtkOpenGLTexture from './Texture.js';
import vtkShaderProgram from './ShaderProgram.js';
import vtkVertexArrayObject from './VertexArrayObject.js';
import vtkViewNode from '../SceneGraph/ViewNode.js';
import { Representation } from '../Core/Property/Constants.js';
import { Wrap, Filter } from './Texture/Constants.js';
import { InterpolationType, OpacityMode } from '../Core/VolumeProperty/Constants.js';
import { BlendMode } from '../Core/VolumeMapper/Constants.js';
import { v as vtkVolumeVS } from './glsl/vtkVolumeVS.glsl.js';
import { v as vtkVolumeFS } from './glsl/vtkVolumeFS.glsl.js';
import { registerOverride } from './ViewNodeFactory.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var vtkWarningMacro = vtkWarningMacro$1,
    vtkErrorMacro = vtkErrorMacro$1; // TODO: Do we want this in some shared utility? Shouldwe just use lodash.isEqual

function arrayEquals(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
} // ----------------------------------------------------------------------------
// vtkOpenGLVolumeMapper methods
// ----------------------------------------------------------------------------


function vtkOpenGLVolumeMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLVolumeMapper');

  publicAPI.buildPass = function () {
    model.zBufferTexture = null;
  }; // ohh someone is doing a zbuffer pass, use that for
  // intermixed volume rendering


  publicAPI.opaqueZBufferPass = function (prepass, renderPass) {
    if (prepass) {
      var zbt = renderPass.getZBufferTexture();

      if (zbt !== model.zBufferTexture) {
        model.zBufferTexture = zbt;
      }
    }
  }; // Renders myself


  publicAPI.volumePass = function (prepass, renderPass) {
    if (prepass) {
      model.openGLRenderWindow = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderWindow');
      model.context = model.openGLRenderWindow.getContext();
      model.tris.setOpenGLRenderWindow(model.openGLRenderWindow);
      model.jitterTexture.setOpenGLRenderWindow(model.openGLRenderWindow);
      model.framebuffer.setOpenGLRenderWindow(model.openGLRenderWindow); // Per Component?

      model.scalarTexture.setOpenGLRenderWindow(model.openGLRenderWindow);
      model.colorTexture.setOpenGLRenderWindow(model.openGLRenderWindow);
      model.opacityTexture.setOpenGLRenderWindow(model.openGLRenderWindow);
      model.openGLVolume = publicAPI.getFirstAncestorOfType('vtkOpenGLVolume');
      var actor = model.openGLVolume.getRenderable();
      model.openGLRenderer = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      var ren = model.openGLRenderer.getRenderable();
      model.openGLCamera = model.openGLRenderer.getViewNodeFor(ren.getActiveCamera());
      publicAPI.renderPiece(ren, actor);
    }
  };

  publicAPI.buildShaders = function (shaders, ren, actor) {
    publicAPI.getShaderTemplate(shaders, ren, actor);
    publicAPI.replaceShaderValues(shaders, ren, actor);
  };

  publicAPI.getShaderTemplate = function (shaders, ren, actor) {
    shaders.Vertex = vtkVolumeVS;
    shaders.Fragment = vtkVolumeFS;
    shaders.Geometry = '';
  };

  publicAPI.replaceShaderValues = function (shaders, ren, actor) {
    var FSSource = shaders.Fragment; // define some values in the shader

    var iType = actor.getProperty().getInterpolationType();

    if (iType === InterpolationType.LINEAR) {
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::TrilinearOn', '#define vtkTrilinearOn').result;
    }

    var vtkImageLabelOutline = actor.getProperty().getUseLabelOutline();

    if (vtkImageLabelOutline === true) {
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::ImageLabelOutlineOn', '#define vtkImageLabelOutlineOn').result;
    }

    var numComp = model.scalarTexture.getComponents();
    FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::NumComponents', "#define vtkNumComponents ".concat(numComp)).result;
    var iComps = actor.getProperty().getIndependentComponents();

    if (iComps) {
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::IndependentComponentsOn', '#define vtkIndependentComponentsOn').result; // Define any proportional components

      var proportionalComponents = [];

      for (var nc = 0; nc < numComp; nc++) {
        if (actor.getProperty().getOpacityMode(nc) === OpacityMode.PROPORTIONAL) {
          proportionalComponents.push("#define vtkComponent".concat(nc, "Proportional"));
        }
      }

      if (proportionalComponents.length > 0) {
        FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::vtkProportionalComponents', proportionalComponents.join('\n')).result;
      }
    } // WebGL only supports loops over constants
    // and does not support while loops so we
    // have to hard code how many steps/samples to take
    // We do a break so most systems will gracefully
    // early terminate, but it is always possible
    // a system will execute every step regardless


    var ext = model.currentInput.getExtent();
    var spc = model.currentInput.getSpacing();
    var vsize = new Float64Array(3);
    vec3.set(vsize, (ext[1] - ext[0]) * spc[0], (ext[3] - ext[2]) * spc[1], (ext[5] - ext[4]) * spc[2]);
    var maxSamples = vec3.length(vsize) / model.renderable.getSampleDistance();
    FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::MaximumSamplesValue', "".concat(Math.ceil(maxSamples))).result; // set light complexity

    FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::LightComplexity', "#define vtkLightComplexity ".concat(model.lastLightComplexity)).result; // if using gradient opacity define that

    model.gopacity = actor.getProperty().getUseGradientOpacity(0);

    for (var _nc = 1; iComps && !model.gopacity && _nc < numComp; ++_nc) {
      if (actor.getProperty().getUseGradientOpacity(_nc)) {
        model.gopacity = true;
      }
    }

    if (model.gopacity) {
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::GradientOpacityOn', '#define vtkGradientOpacityOn').result;
    } // if we have a ztexture then declare it and use it


    if (model.zBufferTexture !== null) {
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::ZBuffer::Dec', ['uniform sampler2D zBufferTexture;', 'uniform float vpWidth;', 'uniform float vpHeight;']).result;
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::ZBuffer::Impl', ['vec4 depthVec = texture2D(zBufferTexture, vec2(gl_FragCoord.x / vpWidth, gl_FragCoord.y/vpHeight));', 'float zdepth = (depthVec.r*256.0 + depthVec.g)/257.0;', 'zdepth = zdepth * 2.0 - 1.0;', 'zdepth = -2.0 * camFar * camNear / (zdepth*(camFar-camNear)-(camFar+camNear)) - camNear;', 'zdepth = -zdepth/rayDir.z;', 'dists.y = min(zdepth,dists.y);']).result;
    } // Set the BlendMode approach


    FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::BlendMode', "".concat(model.renderable.getBlendMode())).result;
    shaders.Fragment = FSSource;
    publicAPI.replaceShaderLight(shaders, ren, actor);
    publicAPI.replaceShaderClippingPlane(shaders, ren, actor);
  };

  publicAPI.replaceShaderLight = function (shaders, ren, actor) {
    var FSSource = shaders.Fragment; // check for shadow maps

    var shadowFactor = '';

    switch (model.lastLightComplexity) {
      default:
      case 0:
        // no lighting, tcolor is fine as is
        break;

      case 1: // headlight

      case 2: // light kit

      case 3:
        {
          // positional not implemented fallback to directional
          var lightNum = 0;
          ren.getLights().forEach(function (light) {
            var status = light.getSwitch();

            if (status > 0) {
              FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Light::Dec', [// intensity weighted color
              "uniform vec3 lightColor".concat(lightNum, ";"), "uniform vec3 lightDirectionVC".concat(lightNum, "; // normalized"), "uniform vec3 lightHalfAngleVC".concat(lightNum, "; // normalized"), '//VTK::Light::Dec'], false).result;
              FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Light::Impl', [//              `  float df = max(0.0, dot(normal.rgb, -lightDirectionVC${lightNum}));`,
              "  float df = abs(dot(normal.rgb, -lightDirectionVC".concat(lightNum, "));"), "  diffuse += ((df".concat(shadowFactor, ") * lightColor").concat(lightNum, ");"), // '  if (df > 0.0)',
              // '    {',
              //              `    float sf = pow( max(0.0, dot(lightHalfAngleWC${lightNum},normal.rgb)), specularPower);`,
              "    float sf = pow( abs(dot(lightHalfAngleVC".concat(lightNum, ",normal.rgb)), vSpecularPower);"), "    specular += ((sf".concat(shadowFactor, ") * lightColor").concat(lightNum, ");"), //              '    }',
              '  //VTK::Light::Impl'], false).result;
              lightNum++;
            }
          });
        }
    }

    shaders.Fragment = FSSource;
  };

  publicAPI.replaceShaderClippingPlane = function (shaders, ren, actor) {
    var FSSource = shaders.Fragment;

    if (model.renderable.getClippingPlanes().length > 0) {
      var clipPlaneSize = model.renderable.getClippingPlanes().length;
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::ClipPlane::Dec', ["uniform vec3 vClipPlaneNormals[6];", "uniform float vClipPlaneDistances[6];", '//VTK::ClipPlane::Dec'], false).result;
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::ClipPlane::Impl', ["for(int i = 0; i < ".concat(clipPlaneSize, "; i++) {"), '  float rayDirRatio = dot(rayDir, vClipPlaneNormals[i]);', '  float equationResult = dot(vertexVCVSOutput, vClipPlaneNormals[i]) + vClipPlaneDistances[i];', '  if (rayDirRatio == 0.0)', '  {', '    if (equationResult < 0.0) dists.x = dists.y;', '    continue;', '  }', '  float result = -1.0 * equationResult / rayDirRatio;', '  if (rayDirRatio < 0.0) dists.y = min(dists.y, result);', '  else dists.x = max(dists.x, result);', '}', '//VTK::ClipPlane::Impl'], false).result;
    }

    shaders.Fragment = FSSource;
  };

  publicAPI.getNeedToRebuildShaders = function (cellBO, ren, actor) {
    // do we need lighting?
    var lightComplexity = 0;

    if (actor.getProperty().getShade() && model.renderable.getBlendMode() === BlendMode.COMPOSITE_BLEND) {
      // consider the lighting complexity to determine which case applies
      // simple headlight, Light Kit, the whole feature set of VTK
      lightComplexity = 0;
      model.numberOfLights = 0;
      ren.getLights().forEach(function (light) {
        var status = light.getSwitch();

        if (status > 0) {
          model.numberOfLights++;

          if (lightComplexity === 0) {
            lightComplexity = 1;
          }
        }

        if (lightComplexity === 1 && (model.numberOfLights > 1 || light.getIntensity() !== 1.0 || !light.lightTypeIsHeadLight())) {
          lightComplexity = 2;
        }

        if (lightComplexity < 3 && light.getPositional()) {
          lightComplexity = 3;
        }
      });
    }

    var needRebuild = false;

    if (model.lastLightComplexity !== lightComplexity) {
      model.lastLightComplexity = lightComplexity;
      needRebuild = true;
    }

    var numComp = model.scalarTexture.getComponents();
    var iComps = actor.getProperty().getIndependentComponents();
    var usesProportionalComponents = false;
    var proportionalComponents = [];

    if (iComps) {
      // Define any proportional components
      for (var nc = 0; nc < numComp; nc++) {
        proportionalComponents.push(actor.getProperty().getOpacityMode(nc));
      }

      if (proportionalComponents.length > 0) {
        usesProportionalComponents = true;
      }
    }

    var ext = model.currentInput.getExtent();
    var spc = model.currentInput.getSpacing();
    var vsize = new Float64Array(3);
    vec3.set(vsize, (ext[1] - ext[0]) * spc[0], (ext[3] - ext[2]) * spc[1], (ext[5] - ext[4]) * spc[2]);
    var maxSamples = vec3.length(vsize) / model.renderable.getSampleDistance();
    var state = {
      interpolationType: actor.getProperty().getInterpolationType(),
      useLabelOutline: actor.getProperty().getUseLabelOutline(),
      numComp: numComp,
      usesProportionalComponents: usesProportionalComponents,
      iComps: iComps,
      maxSamples: maxSamples,
      useGradientOpacity: actor.getProperty().getUseGradientOpacity(0),
      blendMode: model.renderable.getBlendMode(),
      proportionalComponents: proportionalComponents
    }; // We only need to rebuild the shader if one of these variables has changed,
    // since they are used in the shader template replacement step.

    if (!model.previousState || model.previousState.interpolationType !== state.interpolationType || model.previousState.useLabelOutline !== state.useLabelOutline || model.previousState.numComp !== state.numComp || model.previousState.usesProportionalComponents !== state.usesProportionalComponents || model.previousState.iComps !== state.iComps || model.previousState.maxSamples !== state.maxSamples || model.previousState.useGradientOpacity !== state.useGradientOpacity || model.previousState.blendMode !== state.blendMode || !arrayEquals(model.previousState.proportionalComponents, state.proportionalComponents)) {
      model.previousState = _objectSpread({}, state);
      return true;
    } // has something changed that would require us to recreate the shader?


    if (cellBO.getProgram() === 0 || needRebuild || model.lastHaveSeenDepthRequest !== model.haveSeenDepthRequest || !!model.lastZBufferTexture !== !!model.zBufferTexture || cellBO.getShaderSourceTime().getMTime() < publicAPI.getMTime() || cellBO.getShaderSourceTime().getMTime() < model.renderable.getMTime()) {
      model.lastZBufferTexture = model.zBufferTexture;
      return true;
    }

    return false;
  };

  publicAPI.updateShaders = function (cellBO, ren, actor) {
    model.lastBoundBO = cellBO; // has something changed that would require us to recreate the shader?

    if (publicAPI.getNeedToRebuildShaders(cellBO, ren, actor)) {
      var shaders = {
        Vertex: null,
        Fragment: null,
        Geometry: null
      };
      publicAPI.buildShaders(shaders, ren, actor); // compile and bind the program if needed

      var newShader = model.openGLRenderWindow.getShaderCache().readyShaderProgramArray(shaders.Vertex, shaders.Fragment, shaders.Geometry); // if the shader changed reinitialize the VAO

      if (newShader !== cellBO.getProgram()) {
        cellBO.setProgram(newShader); // reset the VAO as the shader has changed

        cellBO.getVAO().releaseGraphicsResources();
      }

      cellBO.getShaderSourceTime().modified();
    } else {
      model.openGLRenderWindow.getShaderCache().readyShaderProgram(cellBO.getProgram());
    }

    cellBO.getVAO().bind();
    publicAPI.setMapperShaderParameters(cellBO, ren, actor);
    publicAPI.setCameraShaderParameters(cellBO, ren, actor);
    publicAPI.setPropertyShaderParameters(cellBO, ren, actor);
    publicAPI.getClippingPlaneShaderParameters(cellBO, ren, actor);
  };

  publicAPI.setMapperShaderParameters = function (cellBO, ren, actor) {
    // Now to update the VAO too, if necessary.
    var program = cellBO.getProgram();

    if (cellBO.getCABO().getElementCount() && (model.VBOBuildTime.getMTime() > cellBO.getAttributeUpdateTime().getMTime() || cellBO.getShaderSourceTime().getMTime() > cellBO.getAttributeUpdateTime().getMTime())) {
      if (program.isAttributeUsed('vertexDC')) {
        if (!cellBO.getVAO().addAttributeArray(program, cellBO.getCABO(), 'vertexDC', cellBO.getCABO().getVertexOffset(), cellBO.getCABO().getStride(), model.context.FLOAT, 3, model.context.FALSE)) {
          vtkErrorMacro('Error setting vertexDC in shader VAO.');
        }
      }

      cellBO.getAttributeUpdateTime().modified();
    }

    program.setUniformi('texture1', model.scalarTexture.getTextureUnit());
    program.setUniformf('sampleDistance', model.renderable.getSampleDistance());
    var volInfo = model.scalarTexture.getVolumeInfo();
    var ipScalarRange = model.renderable.getIpScalarRange();
    var minVals = [];
    var maxVals = [];

    for (var i = 0; i < 4; i++) {
      // convert iprange from 0-1 into data range values
      minVals[i] = ipScalarRange[0] * volInfo.dataComputedScale[i] + volInfo.dataComputedOffset[i];
      maxVals[i] = ipScalarRange[1] * volInfo.dataComputedScale[i] + volInfo.dataComputedOffset[i]; // convert data ranges into texture values

      minVals[i] = (minVals[i] - volInfo.offset[i]) / volInfo.scale[i];
      maxVals[i] = (maxVals[i] - volInfo.offset[i]) / volInfo.scale[i];
    }

    program.setUniform4f('ipScalarRangeMin', minVals[0], minVals[1], minVals[2], minVals[3]);
    program.setUniform4f('ipScalarRangeMax', maxVals[0], maxVals[1], maxVals[2], maxVals[3]); // if we have a zbuffer texture then set it

    if (model.zBufferTexture !== null) {
      program.setUniformi('zBufferTexture', model.zBufferTexture.getTextureUnit());
      var size = publicAPI.getRenderTargetSize();
      program.setUniformf('vpWidth', size[0]);
      program.setUniformf('vpHeight', size[1]);
    }
  };

  publicAPI.setCameraShaderParameters = function (cellBO, ren, actor) {
    // // [WMVP]C == {world, model, view, projection} coordinates
    // // E.g., WCPC == world to projection coordinate transformation
    var keyMats = model.openGLCamera.getKeyMatrices(ren);
    var actMats = model.openGLVolume.getKeyMatrices();
    mat4.multiply(model.modelToView, keyMats.wcvc, actMats.mcwc);
    var program = cellBO.getProgram();
    var cam = model.openGLCamera.getRenderable();
    var crange = cam.getClippingRange();
    program.setUniformf('camThick', crange[1] - crange[0]);
    program.setUniformf('camNear', crange[0]);
    program.setUniformf('camFar', crange[1]);
    var bounds = model.currentInput.getBounds();
    var dims = model.currentInput.getDimensions(); // compute the viewport bounds of the volume
    // we will only render those fragments.

    var pos = new Float64Array(3);
    var dir = new Float64Array(3);
    var dcxmin = 1.0;
    var dcxmax = -1.0;
    var dcymin = 1.0;
    var dcymax = -1.0;

    for (var i = 0; i < 8; ++i) {
      vec3.set(pos, bounds[i % 2], bounds[2 + Math.floor(i / 2) % 2], bounds[4 + Math.floor(i / 4)]);
      vec3.transformMat4(pos, pos, model.modelToView);

      if (!cam.getParallelProjection()) {
        vec3.normalize(dir, pos); // now find the projection of this point onto a
        // nearZ distance plane. Since the camera is at 0,0,0
        // in VC the ray is just t*pos and
        // t is -nearZ/dir.z
        // intersection becomes pos.x/pos.z

        var t = -crange[0] / pos[2];
        vec3.scale(pos, dir, t);
      } // now convert to DC


      vec3.transformMat4(pos, pos, keyMats.vcpc);
      dcxmin = Math.min(pos[0], dcxmin);
      dcxmax = Math.max(pos[0], dcxmax);
      dcymin = Math.min(pos[1], dcymin);
      dcymax = Math.max(pos[1], dcymax);
    }

    program.setUniformf('dcxmin', dcxmin);
    program.setUniformf('dcxmax', dcxmax);
    program.setUniformf('dcymin', dcymin);
    program.setUniformf('dcymax', dcymax);

    if (program.isUniformUsed('cameraParallel')) {
      program.setUniformi('cameraParallel', cam.getParallelProjection());
    }

    var ext = model.currentInput.getExtent();
    var spc = model.currentInput.getSpacing();
    var vsize = new Float64Array(3);
    vec3.set(vsize, (ext[1] - ext[0] + 1) * spc[0], (ext[3] - ext[2] + 1) * spc[1], (ext[5] - ext[4] + 1) * spc[2]);
    program.setUniform3f('vSpacing', spc[0], spc[1], spc[2]);
    vec3.set(pos, ext[0], ext[2], ext[4]);
    model.currentInput.indexToWorldVec3(pos, pos);
    vec3.transformMat4(pos, pos, model.modelToView);
    program.setUniform3f('vOriginVC', pos[0], pos[1], pos[2]); // apply the image directions

    var i2wmat4 = model.currentInput.getIndexToWorld();
    mat4.multiply(model.idxToView, model.modelToView, i2wmat4);
    mat3.multiply(model.idxNormalMatrix, keyMats.normalMatrix, actMats.normalMatrix);
    mat3.multiply(model.idxNormalMatrix, model.idxNormalMatrix, model.currentInput.getDirection());
    var maxSamples = vec3.length(vsize) / model.renderable.getSampleDistance();

    if (maxSamples > model.renderable.getMaximumSamplesPerRay()) {
      vtkWarningMacro("The number of steps required ".concat(Math.ceil(maxSamples), " is larger than the\n        specified maximum number of steps ").concat(model.renderable.getMaximumSamplesPerRay(), ".\n        Please either change the\n        volumeMapper sampleDistance or its maximum number of samples."));
    }

    var vctoijk = new Float64Array(3);
    vec3.set(vctoijk, 1.0, 1.0, 1.0);
    vec3.divide(vctoijk, vctoijk, vsize);
    program.setUniform3f('vVCToIJK', vctoijk[0], vctoijk[1], vctoijk[2]);
    program.setUniform3i('volumeDimensions', dims[0], dims[1], dims[2]);

    if (!model.openGLRenderWindow.getWebgl2()) {
      var volInfo = model.scalarTexture.getVolumeInfo();
      program.setUniformf('texWidth', model.scalarTexture.getWidth());
      program.setUniformf('texHeight', model.scalarTexture.getHeight());
      program.setUniformi('xreps', volInfo.xreps);
      program.setUniformi('xstride', volInfo.xstride);
      program.setUniformi('ystride', volInfo.ystride);
    } // map normals through normal matrix
    // then use a point on the plane to compute the distance


    var normal = new Float64Array(3);
    var pos2 = new Float64Array(3);

    for (var _i = 0; _i < 6; ++_i) {
      switch (_i) {
        default:
        case 0:
          vec3.set(normal, 1.0, 0.0, 0.0);
          vec3.set(pos2, ext[1], ext[3], ext[5]);
          break;

        case 1:
          vec3.set(normal, -1.0, 0.0, 0.0);
          vec3.set(pos2, ext[0], ext[2], ext[4]);
          break;

        case 2:
          vec3.set(normal, 0.0, 1.0, 0.0);
          vec3.set(pos2, ext[1], ext[3], ext[5]);
          break;

        case 3:
          vec3.set(normal, 0.0, -1.0, 0.0);
          vec3.set(pos2, ext[0], ext[2], ext[4]);
          break;

        case 4:
          vec3.set(normal, 0.0, 0.0, 1.0);
          vec3.set(pos2, ext[1], ext[3], ext[5]);
          break;

        case 5:
          vec3.set(normal, 0.0, 0.0, -1.0);
          vec3.set(pos2, ext[0], ext[2], ext[4]);
          break;
      }

      vec3.transformMat3(normal, normal, model.idxNormalMatrix);
      vec3.transformMat4(pos2, pos2, model.idxToView);
      var dist = -1.0 * vec3.dot(pos2, normal); // we have the plane in view coordinates
      // specify the planes in view coordinates

      program.setUniform3f("vPlaneNormal".concat(_i), normal[0], normal[1], normal[2]);
      program.setUniformf("vPlaneDistance".concat(_i), dist);

      if (actor.getProperty().getUseLabelOutline()) {
        var image = model.currentInput;
        var worldToIndex = image.getWorldToIndex();
        program.setUniformMatrix('vWCtoIDX', worldToIndex); // Get the projection coordinate to world coordinate transformation matrix.

        mat4.invert(model.projectionToWorld, keyMats.wcpc);
        program.setUniformMatrix('PCWCMatrix', model.projectionToWorld);
        var size = publicAPI.getRenderTargetSize();
        program.setUniformf('vpWidth', size[0]);
        program.setUniformf('vpHeight', size[1]);
      }
    }

    mat4.invert(model.projectionToView, keyMats.vcpc);
    program.setUniformMatrix('PCVCMatrix', model.projectionToView); // handle lighting values

    switch (model.lastLightComplexity) {
      default:
      case 0:
        // no lighting, tcolor is fine as is
        break;

      case 1: // headlight

      case 2: // light kit

      case 3:
        {
          // positional not implemented fallback to directional
          // mat3.transpose(keyMats.normalMatrix, keyMats.normalMatrix);
          var lightNum = 0;
          var lightColor = [];
          ren.getLights().forEach(function (light) {
            var status = light.getSwitch();

            if (status > 0) {
              var dColor = light.getColor();
              var intensity = light.getIntensity();
              lightColor[0] = dColor[0] * intensity;
              lightColor[1] = dColor[1] * intensity;
              lightColor[2] = dColor[2] * intensity;
              program.setUniform3fArray("lightColor".concat(lightNum), lightColor);
              var ldir = light.getDirection();
              vec3.set(normal, ldir[0], ldir[1], ldir[2]);
              vec3.transformMat3(normal, normal, keyMats.normalMatrix);
              program.setUniform3f("lightDirectionVC".concat(lightNum), normal[0], normal[1], normal[2]); // camera DOP is 0,0,-1.0 in VC

              var halfAngle = [-0.5 * normal[0], -0.5 * normal[1], -0.5 * (normal[2] - 1.0)];
              program.setUniform3fArray("lightHalfAngleVC".concat(lightNum), halfAngle);
              lightNum++;
            }
          }); // mat3.transpose(keyMats.normalMatrix, keyMats.normalMatrix);
        }
    }
  };

  publicAPI.setPropertyShaderParameters = function (cellBO, ren, actor) {
    var program = cellBO.getProgram();
    program.setUniformi('ctexture', model.colorTexture.getTextureUnit());
    program.setUniformi('otexture', model.opacityTexture.getTextureUnit());
    program.setUniformi('jtexture', model.jitterTexture.getTextureUnit());
    var volInfo = model.scalarTexture.getVolumeInfo();
    var vprop = actor.getProperty(); // set the component mix when independent

    var numComp = model.scalarTexture.getComponents();
    var iComps = actor.getProperty().getIndependentComponents();

    if (iComps && numComp >= 2) {
      for (var i = 0; i < numComp; i++) {
        program.setUniformf("mix".concat(i), actor.getProperty().getComponentWeight(i));
      }
    } // three levels of shift scale combined into one
    // for performance in the fragment shader


    for (var _i2 = 0; _i2 < numComp; _i2++) {
      var target = iComps ? _i2 : 0;
      var sscale = volInfo.scale[_i2];
      var ofun = vprop.getScalarOpacity(target);
      var oRange = ofun.getRange();
      var oscale = sscale / (oRange[1] - oRange[0]);
      var oshift = (volInfo.offset[_i2] - oRange[0]) / (oRange[1] - oRange[0]);
      program.setUniformf("oshift".concat(_i2), oshift);
      program.setUniformf("oscale".concat(_i2), oscale);
      var cfun = vprop.getRGBTransferFunction(target);
      var cRange = cfun.getRange();
      program.setUniformf("cshift".concat(_i2), (volInfo.offset[_i2] - cRange[0]) / (cRange[1] - cRange[0]));
      program.setUniformf("cscale".concat(_i2), sscale / (cRange[1] - cRange[0]));
    }

    if (model.gopacity) {
      if (iComps) {
        for (var nc = 0; nc < numComp; ++nc) {
          var _sscale = volInfo.scale[nc];
          var useGO = vprop.getUseGradientOpacity(nc);

          if (useGO) {
            var gomin = vprop.getGradientOpacityMinimumOpacity(nc);
            var gomax = vprop.getGradientOpacityMaximumOpacity(nc);
            program.setUniformf("gomin".concat(nc), gomin);
            program.setUniformf("gomax".concat(nc), gomax);
            var goRange = [vprop.getGradientOpacityMinimumValue(nc), vprop.getGradientOpacityMaximumValue(nc)];
            program.setUniformf("goscale".concat(nc), _sscale * (gomax - gomin) / (goRange[1] - goRange[0]));
            program.setUniformf("goshift".concat(nc), -goRange[0] * (gomax - gomin) / (goRange[1] - goRange[0]) + gomin);
          } else {
            program.setUniformf("gomin".concat(nc), 1.0);
            program.setUniformf("gomax".concat(nc), 1.0);
            program.setUniformf("goscale".concat(nc), 0.0);
            program.setUniformf("goshift".concat(nc), 1.0);
          }
        }
      } else {
        var _sscale2 = volInfo.scale[numComp - 1];

        var _gomin = vprop.getGradientOpacityMinimumOpacity(0);

        var _gomax = vprop.getGradientOpacityMaximumOpacity(0);

        program.setUniformf('gomin0', _gomin);
        program.setUniformf('gomax0', _gomax);
        var _goRange = [vprop.getGradientOpacityMinimumValue(0), vprop.getGradientOpacityMaximumValue(0)];
        program.setUniformf('goscale0', _sscale2 * (_gomax - _gomin) / (_goRange[1] - _goRange[0]));
        program.setUniformf('goshift0', -_goRange[0] * (_gomax - _gomin) / (_goRange[1] - _goRange[0]) + _gomin);
      }
    }

    var vtkImageLabelOutline = actor.getProperty().getUseLabelOutline();

    if (vtkImageLabelOutline === true) {
      var labelOutlineThickness = actor.getProperty().getLabelOutlineThickness();
      program.setUniformi('outlineThickness', labelOutlineThickness);
    }

    if (model.lastLightComplexity > 0) {
      program.setUniformf('vAmbient', vprop.getAmbient());
      program.setUniformf('vDiffuse', vprop.getDiffuse());
      program.setUniformf('vSpecular', vprop.getSpecular());
      program.setUniformf('vSpecularPower', vprop.getSpecularPower());
    }
  };

  publicAPI.getClippingPlaneShaderParameters = function (cellBO, ren, actor) {
    if (model.renderable.getClippingPlanes().length > 0) {
      var keyMats = model.openGLCamera.getKeyMatrices(ren);
      var clipPlaneNormals = [];
      var clipPlaneDistances = [];
      var clipPlanes = model.renderable.getClippingPlanes();
      var clipPlaneSize = clipPlanes.length;

      for (var i = 0; i < clipPlaneSize; ++i) {
        var clipPlaneNormal = clipPlanes[i].getNormal();
        var clipPlanePos = clipPlanes[i].getOrigin();
        vec3.transformMat3(clipPlaneNormal, clipPlaneNormal, keyMats.normalMatrix);
        vec3.transformMat4(clipPlanePos, clipPlanePos, keyMats.wcvc);
        var clipPlaneDist = -1.0 * vec3.dot(clipPlanePos, clipPlaneNormal);
        clipPlaneNormals.push(clipPlaneNormal[0]);
        clipPlaneNormals.push(clipPlaneNormal[1]);
        clipPlaneNormals.push(clipPlaneNormal[2]);
        clipPlaneDistances.push(clipPlaneDist);
      }

      var program = cellBO.getProgram();
      program.setUniform3fv("vClipPlaneNormals", clipPlaneNormals);
      program.setUniformfv("vClipPlaneDistances", clipPlaneDistances);
    }
  };

  publicAPI.getRenderTargetSize = function () {
    if (model.lastXYF > 1.43) {
      var sz = model.framebuffer.getSize();
      return [model.fvp[0] * sz[0], model.fvp[1] * sz[1]];
    }

    return model.openGLRenderWindow.getFramebufferSize();
  };

  publicAPI.renderPieceStart = function (ren, actor) {
    if (model.renderable.getAutoAdjustSampleDistances()) {
      var rwi = ren.getVTKWindow().getInteractor();
      var rft = rwi.getLastFrameTime(); // console.log(`last frame time ${Math.floor(1.0 / rft)}`);
      // frame time is typically for a couple frames prior
      // which makes it messy, so keep long running averages
      // of frame times and pixels rendered

      model.avgFrameTime = 0.97 * model.avgFrameTime + 0.03 * rft;
      model.avgWindowArea = 0.97 * model.avgWindowArea + 0.03 / (model.lastXYF * model.lastXYF);

      if (ren.getVTKWindow().getInteractor().isAnimating()) {
        // compute target xy factor
        var txyf = Math.sqrt(model.avgFrameTime * rwi.getDesiredUpdateRate() / model.avgWindowArea); // limit subsampling to a factor of 10

        if (txyf > 10.0) {
          txyf = 10.0;
        }

        model.targetXYF = txyf;
      } else {
        model.targetXYF = Math.sqrt(model.avgFrameTime * rwi.getStillUpdateRate() / model.avgWindowArea);
      } // have some inertia to change states around 1.43


      if (model.targetXYF < 1.53 && model.targetXYF > 1.33) {
        model.targetXYF = model.lastXYF;
      } // and add some inertia to change at all


      if (Math.abs(1.0 - model.targetXYF / model.lastXYF) < 0.1) {
        model.targetXYF = model.lastXYF;
      }

      model.lastXYF = model.targetXYF;
    } else {
      model.lastXYF = model.renderable.getImageSampleDistance();
    } // only use FBO beyond this value


    if (model.lastXYF <= 1.43) {
      model.lastXYF = 1.0;
    } // console.log(`last target  ${model.lastXYF} ${model.targetXYF}`);
    // console.log(`awin aft  ${model.avgWindowArea} ${model.avgFrameTime}`);


    var xyf = model.lastXYF;
    var size = model.openGLRenderWindow.getFramebufferSize(); // const newSize = [
    //   Math.floor((size[0] / xyf) + 0.5),
    //   Math.floor((size[1] / xyf) + 0.5)];
    // const diag = vtkBoundingBox.getDiagonalLength(model.currentInput.getBounds());
    // // so what is the resulting sample size roughly
    // console.log(`sam size ${diag / newSize[0]} ${diag / newSize[1]} ${model.renderable.getImageSampleDistance()}`);
    // // if the sample distance is getting far from the image sample dist
    // if (2.0 * diag / (newSize[0] + newSize[1]) > 4 * model.renderable.getSampleDistance()) {
    //   model.renderable.setSampleDistance(4.0 * model.renderable.getSampleDistance());
    // }
    // if (2.0 * diag / (newSize[0] + newSize[1]) < 0.25 * model.renderable.getSampleDistance()) {
    //   model.renderable.setSampleDistance(0.25 * model.renderable.getSampleDistance());
    // }
    // create/resize framebuffer if needed

    if (xyf > 1.43) {
      model.framebuffer.saveCurrentBindingsAndBuffers();

      if (model.framebuffer.getGLFramebuffer() === null) {
        model.framebuffer.create(Math.floor(size[0] * 0.7), Math.floor(size[1] * 0.7));
        model.framebuffer.populateFramebuffer();
      } else {
        var fbSize = model.framebuffer.getSize();

        if (fbSize[0] !== Math.floor(size[0] * 0.7) || fbSize[1] !== Math.floor(size[1] * 0.7)) {
          model.framebuffer.create(Math.floor(size[0] * 0.7), Math.floor(size[1] * 0.7));
          model.framebuffer.populateFramebuffer();
        }
      }

      model.framebuffer.bind();
      var gl = model.context;
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.colorMask(true, true, true, true);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.viewport(0, 0, size[0] / xyf, size[1] / xyf);
      model.fvp = [Math.floor(size[0] / xyf) / Math.floor(size[0] * 0.7), Math.floor(size[1] / xyf) / Math.floor(size[1] * 0.7)];
    }

    model.context.disable(model.context.DEPTH_TEST); // make sure the BOs are up to date

    publicAPI.updateBufferObjects(ren, actor); // set interpolation on the texture based on property setting

    var iType = actor.getProperty().getInterpolationType();

    if (iType === InterpolationType.NEAREST) {
      model.scalarTexture.setMinificationFilter(Filter.NEAREST);
      model.scalarTexture.setMagnificationFilter(Filter.NEAREST);
    } else {
      model.scalarTexture.setMinificationFilter(Filter.LINEAR);
      model.scalarTexture.setMagnificationFilter(Filter.LINEAR);
    } // Bind the OpenGL, this is shared between the different primitive/cell types.


    model.lastBoundBO = null; // if we have a zbuffer texture then activate it

    if (model.zBufferTexture !== null) {
      model.zBufferTexture.activate();
    }
  };

  publicAPI.renderPieceDraw = function (ren, actor) {
    var gl = model.context; // render the texture

    model.scalarTexture.activate();
    model.opacityTexture.activate();
    model.colorTexture.activate();
    model.jitterTexture.activate();
    publicAPI.updateShaders(model.tris, ren, actor); // First we do the triangles, update the shader, set uniforms, etc.
    // for (let i = 0; i < 11; ++i) {
    //   gl.drawArrays(gl.TRIANGLES, 66 * i, 66);
    // }

    gl.drawArrays(gl.TRIANGLES, 0, model.tris.getCABO().getElementCount());
    model.tris.getVAO().release();
    model.scalarTexture.deactivate();
    model.colorTexture.deactivate();
    model.opacityTexture.deactivate();
    model.jitterTexture.deactivate();
  };

  publicAPI.renderPieceFinish = function (ren, actor) {
    // if we have a zbuffer texture then deactivate it
    if (model.zBufferTexture !== null) {
      model.zBufferTexture.deactivate();
    }

    if (model.lastXYF > 1.43) {
      // now copy the framebuffer with the volume into the
      // regular buffer
      model.framebuffer.restorePreviousBindingsAndBuffers();

      if (model.copyShader === null) {
        model.copyShader = model.openGLRenderWindow.getShaderCache().readyShaderProgramArray(['//VTK::System::Dec', 'attribute vec4 vertexDC;', 'uniform vec2 tfactor;', 'varying vec2 tcoord;', 'void main() { tcoord = vec2(vertexDC.x*0.5 + 0.5, vertexDC.y*0.5 + 0.5) * tfactor; gl_Position = vertexDC; }'].join('\n'), ['//VTK::System::Dec', '//VTK::Output::Dec', 'uniform sampler2D texture1;', 'varying vec2 tcoord;', 'void main() { gl_FragData[0] = texture2D(texture1,tcoord); }'].join('\n'), '');
        var program = model.copyShader;
        model.copyVAO = vtkVertexArrayObject.newInstance();
        model.copyVAO.setOpenGLRenderWindow(model.openGLRenderWindow);
        model.tris.getCABO().bind();

        if (!model.copyVAO.addAttributeArray(program, model.tris.getCABO(), 'vertexDC', model.tris.getCABO().getVertexOffset(), model.tris.getCABO().getStride(), model.context.FLOAT, 3, model.context.FALSE)) {
          vtkErrorMacro('Error setting vertexDC in copy shader VAO.');
        }
      } else {
        model.openGLRenderWindow.getShaderCache().readyShaderProgram(model.copyShader);
      }

      var size = model.openGLRenderWindow.getFramebufferSize();
      model.context.viewport(0, 0, size[0], size[1]); // activate texture

      var tex = model.framebuffer.getColorTexture();
      tex.activate();
      model.copyShader.setUniformi('texture', tex.getTextureUnit());
      model.copyShader.setUniform2f('tfactor', model.fvp[0], model.fvp[1]);
      var gl = model.context;
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // render quad

      model.context.drawArrays(model.context.TRIANGLES, 0, model.tris.getCABO().getElementCount());
      tex.deactivate();
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
  };

  publicAPI.renderPiece = function (ren, actor) {
    publicAPI.invokeEvent({
      type: 'StartEvent'
    });
    model.renderable.update();
    model.currentInput = model.renderable.getInputData();
    publicAPI.invokeEvent({
      type: 'EndEvent'
    });

    if (!model.currentInput) {
      vtkErrorMacro('No input!');
      return;
    }

    publicAPI.renderPieceStart(ren, actor);
    publicAPI.renderPieceDraw(ren, actor);
    publicAPI.renderPieceFinish(ren, actor);
  };

  publicAPI.computeBounds = function (ren, actor) {
    if (!publicAPI.getInput()) {
      uninitializeBounds(model.Bounds);
      return;
    }

    model.bounds = publicAPI.getInput().getBounds();
  };

  publicAPI.updateBufferObjects = function (ren, actor) {
    // Rebuild buffers if needed
    if (publicAPI.getNeedToRebuildBufferObjects(ren, actor)) {
      publicAPI.buildBufferObjects(ren, actor);
    }
  };

  publicAPI.getNeedToRebuildBufferObjects = function (ren, actor) {
    // first do a coarse check
    if (model.VBOBuildTime.getMTime() < publicAPI.getMTime() || model.VBOBuildTime.getMTime() < actor.getMTime() || model.VBOBuildTime.getMTime() < model.renderable.getMTime() || model.VBOBuildTime.getMTime() < actor.getProperty().getMTime() || model.VBOBuildTime.getMTime() < model.currentInput.getMTime()) {
      return true;
    }

    return false;
  };

  publicAPI.buildBufferObjects = function (ren, actor) {
    var image = model.currentInput;

    if (!image) {
      return;
    }

    var scalars = image.getPointData() && image.getPointData().getScalars();

    if (!scalars) {
      return;
    }

    var vprop = actor.getProperty();

    if (!model.jitterTexture.getHandle()) {
      var oTable = new Uint8Array(32 * 32);

      for (var i = 0; i < 32 * 32; ++i) {
        oTable[i] = 255.0 * Math.random();
      }

      model.jitterTexture.setMinificationFilter(Filter.LINEAR);
      model.jitterTexture.setMagnificationFilter(Filter.LINEAR);
      model.jitterTexture.create2DFromRaw(32, 32, 1, VtkDataTypes.UNSIGNED_CHAR, oTable);
    }

    var numComp = scalars.getNumberOfComponents();
    var iComps = vprop.getIndependentComponents();
    var numIComps = iComps ? numComp : 1; // rebuild opacity tfun?

    var toString = "".concat(vprop.getMTime());

    if (model.opacityTextureString !== toString) {
      var oWidth = 1024;
      var oSize = oWidth * 2 * numIComps;
      var ofTable = new Float32Array(oSize);
      var tmpTable = new Float32Array(oWidth);

      for (var c = 0; c < numIComps; ++c) {
        var ofun = vprop.getScalarOpacity(c);
        var opacityFactor = model.renderable.getSampleDistance() / vprop.getScalarOpacityUnitDistance(c);
        var oRange = ofun.getRange();
        ofun.getTable(oRange[0], oRange[1], oWidth, tmpTable, 1); // adjust for sample distance etc

        for (var _i3 = 0; _i3 < oWidth; ++_i3) {
          ofTable[c * oWidth * 2 + _i3] = 1.0 - Math.pow(1.0 - tmpTable[_i3], opacityFactor);
          ofTable[c * oWidth * 2 + _i3 + oWidth] = ofTable[c * oWidth * 2 + _i3];
        }
      }

      model.opacityTexture.releaseGraphicsResources(model.openGLRenderWindow);
      model.opacityTexture.setMinificationFilter(Filter.LINEAR);
      model.opacityTexture.setMagnificationFilter(Filter.LINEAR); // use float texture where possible because we really need the resolution
      // for this table. Errors in low values of opacity accumulate to
      // visible artifacts. High values of opacity quickly terminate without
      // artifacts.

      if (model.openGLRenderWindow.getWebgl2() || model.context.getExtension('OES_texture_float') && model.context.getExtension('OES_texture_float_linear')) {
        model.opacityTexture.create2DFromRaw(oWidth, 2 * numIComps, 1, VtkDataTypes.FLOAT, ofTable);
      } else {
        var _oTable = new Uint8Array(oSize);

        for (var _i4 = 0; _i4 < oSize; ++_i4) {
          _oTable[_i4] = 255.0 * ofTable[_i4];
        }

        model.opacityTexture.create2DFromRaw(oWidth, 2 * numIComps, 1, VtkDataTypes.UNSIGNED_CHAR, _oTable);
      }

      model.opacityTextureString = toString;
    } // rebuild color tfun?


    toString = "".concat(vprop.getMTime());

    if (model.colorTextureString !== toString) {
      var cWidth = 1024;
      var cSize = cWidth * 2 * numIComps * 3;
      var cTable = new Uint8Array(cSize);

      var _tmpTable = new Float32Array(cWidth * 3);

      for (var _c = 0; _c < numIComps; ++_c) {
        var cfun = vprop.getRGBTransferFunction(_c);
        var cRange = cfun.getRange();
        cfun.getTable(cRange[0], cRange[1], cWidth, _tmpTable, 1);

        for (var _i5 = 0; _i5 < cWidth * 3; ++_i5) {
          cTable[_c * cWidth * 6 + _i5] = 255.0 * _tmpTable[_i5];
          cTable[_c * cWidth * 6 + _i5 + cWidth * 3] = 255.0 * _tmpTable[_i5];
        }
      }

      model.colorTexture.releaseGraphicsResources(model.openGLRenderWindow);
      model.colorTexture.setMinificationFilter(Filter.LINEAR);
      model.colorTexture.setMagnificationFilter(Filter.LINEAR);
      model.colorTexture.create2DFromRaw(cWidth, 2 * numIComps, 3, VtkDataTypes.UNSIGNED_CHAR, cTable);
      model.colorTextureString = toString;
    } // rebuild the scalarTexture if the data has changed


    toString = "".concat(image.getMTime());

    if (model.scalarTextureString !== toString) {
      // Build the textures
      var dims = image.getDimensions();
      model.scalarTexture.releaseGraphicsResources(model.openGLRenderWindow);
      model.scalarTexture.resetFormatAndType();
      model.scalarTexture.create3DFilterableFromRaw(dims[0], dims[1], dims[2], numComp, scalars.getDataType(), scalars.getData(), model.renderable.getPreferSizeOverAccuracy()); // console.log(model.scalarTexture.get());

      model.scalarTextureString = toString;
    }

    if (!model.tris.getCABO().getElementCount()) {
      // build the CABO
      var ptsArray = new Float32Array(12);

      for (var _i6 = 0; _i6 < 4; _i6++) {
        ptsArray[_i6 * 3] = _i6 % 2 * 2 - 1.0;
        ptsArray[_i6 * 3 + 1] = _i6 > 1 ? 1.0 : -1.0;
        ptsArray[_i6 * 3 + 2] = -1.0;
      }

      var cellArray = new Uint16Array(8);
      cellArray[0] = 3;
      cellArray[1] = 0;
      cellArray[2] = 1;
      cellArray[3] = 3;
      cellArray[4] = 3;
      cellArray[5] = 0;
      cellArray[6] = 3;
      cellArray[7] = 2; // const dim = 12.0;
      // const ptsArray = new Float32Array(3 * dim * dim);
      // for (let i = 0; i < dim; i++) {
      //   for (let j = 0; j < dim; j++) {
      //     const offset = ((i * dim) + j) * 3;
      //     ptsArray[offset] = (2.0 * (i / (dim - 1.0))) - 1.0;
      //     ptsArray[offset + 1] = (2.0 * (j / (dim - 1.0))) - 1.0;
      //     ptsArray[offset + 2] = -1.0;
      //   }
      // }
      // const cellArray = new Uint16Array(8 * (dim - 1) * (dim - 1));
      // for (let i = 0; i < dim - 1; i++) {
      //   for (let j = 0; j < dim - 1; j++) {
      //     const offset = 8 * ((i * (dim - 1)) + j);
      //     cellArray[offset] = 3;
      //     cellArray[offset + 1] = (i * dim) + j;
      //     cellArray[offset + 2] = (i * dim) + 1 + j;
      //     cellArray[offset + 3] = ((i + 1) * dim) + 1 + j;
      //     cellArray[offset + 4] = 3;
      //     cellArray[offset + 5] = (i * dim) + j;
      //     cellArray[offset + 6] = ((i + 1) * dim) + 1 + j;
      //     cellArray[offset + 7] = ((i + 1) * dim) + j;
      //   }
      // }

      var points = vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: ptsArray
      });
      points.setName('points');
      var cells = vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: cellArray
      });
      model.tris.getCABO().createVBO(cells, 'polys', Representation.SURFACE, {
        points: points,
        cellOffset: 0
      });
    }

    model.VBOBuildTime.modified();
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  context: null,
  VBOBuildTime: null,
  scalarTexture: null,
  scalarTextureString: null,
  opacityTexture: null,
  opacityTextureString: null,
  colorTexture: null,
  colorTextureString: null,
  jitterTexture: null,
  tris: null,
  framebuffer: null,
  copyShader: null,
  copyVAO: null,
  lastXYF: 1.0,
  targetXYF: 1.0,
  zBufferTexture: null,
  lastZBufferTexture: null,
  lastLightComplexity: 0,
  fullViewportTime: 1.0,
  idxToView: null,
  idxNormalMatrix: null,
  modelToView: null,
  projectionToView: null,
  avgWindowArea: 0.0,
  avgFrameTime: 0.0
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkViewNode.extend(publicAPI, model, initialValues);
  model.VBOBuildTime = {};
  obj(model.VBOBuildTime, {
    mtime: 0
  });
  model.tris = vtkHelper.newInstance();
  model.scalarTexture = vtkOpenGLTexture.newInstance();
  model.opacityTexture = vtkOpenGLTexture.newInstance();
  model.colorTexture = vtkOpenGLTexture.newInstance();
  model.jitterTexture = vtkOpenGLTexture.newInstance();
  model.jitterTexture.setWrapS(Wrap.REPEAT);
  model.jitterTexture.setWrapT(Wrap.REPEAT);
  model.framebuffer = vtkOpenGLFramebuffer.newInstance();
  model.idxToView = mat4.identity(new Float64Array(16));
  model.idxNormalMatrix = mat3.identity(new Float64Array(9));
  model.modelToView = mat4.identity(new Float64Array(16));
  model.projectionToView = mat4.identity(new Float64Array(16));
  model.projectionToWorld = mat4.identity(new Float64Array(16)); // Build VTK API

  setGet(publicAPI, model, ['context']); // Object methods

  vtkOpenGLVolumeMapper(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = newInstance$1(extend, 'vtkOpenGLVolumeMapper'); // ----------------------------------------------------------------------------

var vtkVolumeMapper = {
  newInstance: newInstance,
  extend: extend
}; // Register ourself to OpenGL backend if imported

registerOverride('vtkVolumeMapper', newInstance);

export { vtkVolumeMapper as default, extend, newInstance };
