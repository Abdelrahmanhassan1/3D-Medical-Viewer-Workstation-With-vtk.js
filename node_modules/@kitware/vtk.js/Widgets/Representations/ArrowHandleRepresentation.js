import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import vtkActor from '../../Rendering/Core/Actor.js';
import vtkArrow2DSource from '../../Filters/Sources/Arrow2DSource.js';
import vtkDataArray from '../../Common/Core/DataArray.js';
import vtkGlyph3DMapper from '../../Rendering/Core/Glyph3DMapper.js';
import vtkHandleRepresentation from './HandleRepresentation.js';
import vtkMatrixBuilder from '../../Common/Core/MatrixBuilder.js';
import vtkPixelSpaceCallbackMapper from '../../Rendering/Core/PixelSpaceCallbackMapper.js';
import vtkPolyData from '../../Common/DataModel/PolyData.js';
import vtkConeSource from '../../Filters/Sources/ConeSource.js';
import vtkSphereSource from '../../Filters/Sources/SphereSource.js';
import vtkCircleSource from '../../Filters/Sources/CircleSource.js';
import vtkCubeSource from '../../Filters/Sources/CubeSource.js';
import vtkViewFinderSource from '../../Filters/Sources/ViewFinderSource.js';
import Constants from '../Widgets3D/LineWidget/Constants.js';
import { ScalarMode } from '../../Rendering/Core/Mapper/Constants.js';
import { mat4, mat3, vec3 } from 'gl-matrix';
import { RenderingTypes } from '../Core/WidgetManager/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var ShapeType = Constants.ShapeType,
    Shapes2D = Constants.Shapes2D,
    ShapesOrientable = Constants.ShapesOrientable; // ----------------------------------------------------------------------------
// vtkArrowHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkArrowHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkArrowHandleRepresentation');

  var superClass = _objectSpread({}, publicAPI); // --------------------------------------------------------------------------
  // Internal polydata dataset
  // --------------------------------------------------------------------------


  model.internalPolyData = vtkPolyData.newInstance({
    mtime: 0
  });
  model.internalArrays = {
    points: model.internalPolyData.getPoints(),
    scale: vtkDataArray.newInstance({
      name: 'scale',
      numberOfComponents: 1,
      empty: true
    }),
    color: vtkDataArray.newInstance({
      name: 'color',
      numberOfComponents: 1,
      empty: true
    }),
    direction: vtkDataArray.newInstance({
      name: 'direction',
      numberOfComponents: 9,
      empty: true
    })
  };
  model.internalPolyData.getPointData().addArray(model.internalArrays.scale);
  model.internalPolyData.getPointData().addArray(model.internalArrays.color);
  model.internalPolyData.getPointData().addArray(model.internalArrays.direction);
  /**
   * Set the shape for the glyph according to lineWidget state inputs
   */

  function createGlyph(shape) {
    var _representationToSour;

    var representationToSource = (_representationToSour = {}, _defineProperty(_representationToSour, ShapeType.STAR, {
      builder: vtkArrow2DSource,
      initialValues: {
        shape: 'star',
        height: 0.6
      }
    }), _defineProperty(_representationToSour, ShapeType.ARROWHEAD3, {
      builder: vtkArrow2DSource,
      initialValues: {
        shape: 'triangle'
      }
    }), _defineProperty(_representationToSour, ShapeType.ARROWHEAD4, {
      builder: vtkArrow2DSource,
      initialValues: {
        shape: 'arrow4points'
      }
    }), _defineProperty(_representationToSour, ShapeType.ARROWHEAD6, {
      builder: vtkArrow2DSource,
      initialValues: {
        shape: 'arrow6points'
      }
    }), _defineProperty(_representationToSour, ShapeType.CONE, {
      builder: vtkConeSource,
      initialValues: {
        direction: [0, 1, 0]
      }
    }), _defineProperty(_representationToSour, ShapeType.SPHERE, {
      builder: vtkSphereSource
    }), _defineProperty(_representationToSour, ShapeType.CUBE, {
      builder: vtkCubeSource,
      initialValues: {
        xLength: 0.8,
        yLength: 0.8,
        zLength: 0.8
      }
    }), _defineProperty(_representationToSour, ShapeType.DISK, {
      builder: vtkCircleSource,
      initialValues: {
        resolution: 30,
        radius: 0.5,
        direction: [0, 0, 1],
        lines: false,
        face: true
      }
    }), _defineProperty(_representationToSour, ShapeType.CIRCLE, {
      builder: vtkCircleSource,
      initialValues: {
        resolution: 30,
        radius: 0.5,
        direction: [0, 0, 1],
        lines: true,
        face: false
      }
    }), _defineProperty(_representationToSour, ShapeType.VIEWFINDER, {
      builder: vtkViewFinderSource,
      initialValues: {
        radius: 0.1,
        spacing: 0.3,
        width: 1.4
      }
    }), _defineProperty(_representationToSour, ShapeType.NONE, {
      builder: vtkSphereSource
    }), _representationToSour);
    var rep = representationToSource[shape];
    return rep.builder.newInstance(rep.initialValues);
  } // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------
  // displayActors and displayMappers are used to render objects in HTML,
  // allowing objects to be 'rendered' internally in a VTK scene without
  // being visible on the final output.


  model.displayMapper = vtkPixelSpaceCallbackMapper.newInstance();
  model.displayActor = vtkActor.newInstance({
    parentProp: publicAPI
  }); // model.displayActor.getProperty().setOpacity(0); // don't show in 3D

  model.displayActor.setMapper(model.displayMapper);
  model.displayMapper.setInputConnection(publicAPI.getOutputPort());
  publicAPI.addActor(model.displayActor);
  model.alwaysVisibleActors = [model.displayActor];
  model.mapper = vtkGlyph3DMapper.newInstance({
    orientationArray: 'direction',
    scaleArray: 'scale',
    colorByArrayName: 'color',
    scalarMode: ScalarMode.USE_POINT_FIELD_DATA
  });
  model.mapper.setOrientationModeToMatrix();
  model.mapper.setInputConnection(publicAPI.getOutputPort());
  model.actor = vtkActor.newInstance({
    parentProp: publicAPI
  });
  model.actor.setMapper(model.mapper);
  publicAPI.addActor(model.actor); // --------------------------------------------------------------------------

  publicAPI.setGlyphResolution = macro.chain(publicAPI.setGlyphResolution, function (r) {
    return model.glyph.setPhiResolution(r) && model.glyph.setThetaResolution(r);
  }); // --------------------------------------------------------------------------

  function callbackProxy(coords) {
    if (model.displayCallback) {
      var filteredList = [];
      var states = publicAPI.getRepresentationStates();

      for (var i = 0; i < states.length; i++) {
        if (states[i].getActive()) {
          filteredList.push(coords[i]);
        }
      }

      if (filteredList.length) {
        model.displayCallback(filteredList);
        return;
      }
    }

    model.displayCallback();
  }

  publicAPI.setDisplayCallback = function (callback) {
    model.displayCallback = callback;
    model.displayMapper.setCallback(callback ? callbackProxy : null);
  }; // --------------------------------------------------------------------------


  publicAPI.is2DShape = function () {
    return Shapes2D.includes(model.shape);
  };

  publicAPI.isOrientableShape = function () {
    return ShapesOrientable.includes(model.shape);
  };
  /**
   * Returns the orientation matrix to align glyph on model.orientation.
   * */


  function getOrientationRotation(viewMatrixInv) {
    var displayOrientation = new Float64Array(3);
    var baseDir = [0, 1, 0];
    vec3.transformMat3(displayOrientation, model.orientation, viewMatrixInv);
    displayOrientation[2] = 0;
    var displayMatrix = vtkMatrixBuilder.buildFromDegree().rotateFromDirections(baseDir, displayOrientation).getMatrix();
    var displayRotation = new Float64Array(9);
    mat3.fromMat4(displayRotation, displayMatrix);
    return displayRotation;
  }

  function getCameraFacingRotation(scale3, displayRotation, viewMatrix) {
    var rotation = new Float64Array(9);
    mat3.multiply(rotation, viewMatrix, displayRotation);
    vec3.transformMat3(scale3, scale3, rotation);
    return rotation;
  }
  /**
   * Computes the rotation matrix of the glyph. There are 2 rotations:
   *  - a first rotation to be oriented along model.rotation
   *  - an optional second rotation to face the camera
   * @param {vec3} scale3 Scale of the glyph, rotated when glyph is rotated.
   */


  function getGlyphRotation(scale3) {
    var shouldFaceCamera = model.faceCamera === true || model.faceCamera == null && publicAPI.is2DShape();
    var viewMatrix = new Float64Array(9);
    mat3.fromMat4(viewMatrix, model.viewMatrix);
    var viewMatrixInv = mat3.identity(new Float64Array(9));

    if (shouldFaceCamera) {
      mat3.invert(viewMatrixInv, viewMatrix);
    }

    var orientationRotation = null;

    if (publicAPI.isOrientableShape()) {
      orientationRotation = getOrientationRotation(viewMatrixInv);
    } else {
      orientationRotation = mat3.identity(new Float64Array(9));
    }

    if (shouldFaceCamera) {
      orientationRotation = getCameraFacingRotation(scale3, orientationRotation, viewMatrix);
    }

    return orientationRotation;
  }

  publicAPI.requestDataInternal = function (inData, outData) {
    var _model$internalArrays = model.internalArrays,
        points = _model$internalArrays.points,
        scale = _model$internalArrays.scale,
        color = _model$internalArrays.color,
        direction = _model$internalArrays.direction;
    var list = publicAPI.getRepresentationStates(inData[0]).filter(function (state) {
      return state.getOrigin && state.getOrigin() && state.isVisible && state.isVisible();
    });
    var totalCount = list.length;

    if (color.getNumberOfValues() !== totalCount) {
      // Need to resize dataset
      points.setData(new Float32Array(3 * totalCount), 3);
      scale.setData(new Float32Array(totalCount));
      color.setData(new Float32Array(totalCount));
      direction.setData(new Float32Array(9 * totalCount));
    }

    var typedArray = {
      points: points.getData(),
      scale: scale.getData(),
      color: color.getData(),
      direction: direction.getData()
    };

    for (var i = 0; i < totalCount; i++) {
      var state = list[i];
      var isActive = state.getActive();
      var scaleFactor = isActive ? model.activeScaleFactor : 1;
      var coord = state.getOrigin();

      if (coord) {
        typedArray.points[i * 3 + 0] = coord[0];
        typedArray.points[i * 3 + 1] = coord[1];
        typedArray.points[i * 3 + 2] = coord[2];
        var scale3 = state.getScale3 ? state.getScale3() : [1, 1, 1];
        scale3 = scale3.map(function (x) {
          return x === 0 ? 2 * model.defaultScale : 2 * x;
        });
        var rotation = getGlyphRotation(scale3);
        typedArray.direction.set(rotation, 9 * i);
        typedArray.scale[i] = scaleFactor * (state.getScale1 ? state.getScale1() : model.defaultScale);

        if (publicAPI.getScaleInPixels()) {
          typedArray.scale[i] *= publicAPI.getPixelWorldHeightAtCoord(coord);
        }

        typedArray.color[i] = model.useActiveColor && isActive ? model.activeColor : state.getColor();
      }
    }

    model.internalPolyData.modified();
    outData[0] = model.internalPolyData;
  };

  publicAPI.requestData = function (inData, outData) {
    var shape = publicAPI.getRepresentationStates(inData[0])[0].getShape();
    var shouldCreateGlyph = model.glyph == null;

    if (model.shape !== shape && Object.values(ShapeType).includes(shape)) {
      model.shape = shape;
      shouldCreateGlyph = true;
    }

    if (shouldCreateGlyph) {
      model.glyph = createGlyph(model.shape);
      model.mapper.setInputConnection(model.glyph.getOutputPort(), 1);
    }

    publicAPI.requestDataInternal(inData, outData);
  };

  publicAPI.updateActorVisibility = function () {
    var renderingType = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : RenderingTypes.FRONT_BUFFER;
    var ctxVisible = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var handleVisible = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    var state = publicAPI.getRepresentationStates()[0];
    superClass.updateActorVisibility(renderingType, ctxVisible, handleVisible && state.isVisible());
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

/**
 *  'shape' default value is used first time 'shape' mixin is invalid.
 *  'faceCamera' controls wether the glyph should face camera or not:
 *    - null or undefined to leave it to shape type (i.e. 2D are facing camera,
 *    3D are not)
 *    - true to face camera
 *    - false to not face camera
 */


function defaultValues(initialValues) {
  return _objectSpread({
    defaultScale: 1,
    faceCamera: null,
    orientation: [1, 0, 0],
    shape: ShapeType.SPHERE,
    viewMatrix: mat4.identity(new Float64Array(16))
  }, initialValues);
} // ----------------------------------------------------------------------------


function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, defaultValues(initialValues));
  vtkHandleRepresentation.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['glyph', 'mapper', 'actor']);
  macro.setGetArray(publicAPI, model, ['visibilityFlagArray'], 2);
  macro.setGetArray(publicAPI, model, ['orientation'], 3);
  macro.setGetArray(publicAPI, model, ['viewMatrix'], 16);
  macro.setGet(publicAPI, model, ['faceCamera']); // Object specific methods

  vtkArrowHandleRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkArrowHandleRepresentation'); // ----------------------------------------------------------------------------

var vtkArrowHandleRepresentation$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkArrowHandleRepresentation$1 as default, extend, newInstance };
