import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../../macros.js';
import vtkActor from '../../../Rendering/Core/Actor.js';
import vtkBoundingBox from '../../../Common/DataModel/BoundingBox.js';
import vtkMapper from '../../../Rendering/Core/Mapper.js';
import { u as uninitializeBounds } from '../../../Common/Core/Math/index.js';
import vtkProp3D from '../../../Rendering/Core/Prop3D.js';
import vtkProperty from '../../../Rendering/Core/Property.js';
import vtkResliceCursorPolyDataAlgorithm from './ResliceCursorPolyDataAlgorithm.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
// vtkResliceCursorActor methods
// ----------------------------------------------------------------------------

function vtkResliceCursorActor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkResliceCursorActor');

  var superClass = _objectSpread({}, publicAPI);

  publicAPI.getActors = function () {
    if (model.cursorAlgorithm.getResliceCursor()) {
      publicAPI.updateViewProps();
    }

    return _toConsumableArray(model.cursorCenterlineActor);
  };

  publicAPI.getNestedProps = function () {
    return publicAPI.getActors();
  };

  publicAPI.updateViewProps = function () {
    if (!model.cursorAlgorithm.getResliceCursor()) {
      return;
    }

    model.cursorAlgorithm.update();
    var axisNormal = model.cursorAlgorithm.getReslicePlaneNormal();
    var axis1 = model.cursorAlgorithm.getPlaneAxis1();
    var axis2 = model.cursorAlgorithm.getPlaneAxis2();
    model.cursorCenterlineMapper[axis1].setInputData(model.cursorAlgorithm.getOutputData(0));
    model.cursorCenterlineMapper[axis2].setInputData(model.cursorAlgorithm.getOutputData(1));
    model.cursorCenterlineActor[axis1].setVisibility(model.visibility);
    model.cursorCenterlineActor[axis2].setVisibility(model.visibility);
    model.cursorCenterlineActor[axisNormal].setVisibility(0);
  };

  publicAPI.getBounds = function () {
    uninitializeBounds(model.bounds);
    publicAPI.updateViewProps();

    var boundingBox = _toConsumableArray(vtkBoundingBox.INIT_BOUNDS);

    var bounds = [];

    for (var i = 0; i < 3; i++) {
      if (model.cursorCenterlineActor[i].getVisibility() && model.cursorCenterlineActor[i].getUseBounds()) {
        bounds = model.cursorCenterlineActor[i].getBounds();
        vtkBoundingBox.addBounds(boundingBox, bounds[0], bounds[1], bounds[2], bounds[3], bounds[4], bounds[5]);
      }
    }

    model.bounds = boundingBox;
    return model.bounds;
  };

  publicAPI.getMTime = function () {
    var mTime = superClass.getMTime();

    if (model.cursorAlgorithm) {
      var time = model.cursorAlgorithm.getMTime();

      if (time > mTime) {
        mTime = time;
      }
    }

    return mTime;
  };

  publicAPI.getCenterlineProperty = function (i) {
    return model.centerlineProperty[i];
  };

  publicAPI.getCenterlineActor = function (i) {
    return model.cursorCenterlineActor[i];
  };

  publicAPI.setUserMatrix = function (matrix) {
    model.cursorCenterlineActor[0].setUserMatrix(matrix);
    model.cursorCenterlineActor[1].setUserMatrix(matrix);
    model.cursorCenterlineActor[2].setUserMatrix(matrix);
    superClass.setUserMatrix(matrix);
  }; //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------

} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkProp3D.extend(publicAPI, model, initialValues);
  model.cursorAlgorithm = vtkResliceCursorPolyDataAlgorithm.newInstance();
  model.cursorCenterlineMapper = [];
  model.cursorCenterlineActor = [];
  model.centerlineProperty = [];

  for (var i = 0; i < 3; i++) {
    model.cursorCenterlineMapper[i] = vtkMapper.newInstance();
    model.cursorCenterlineMapper[i].setScalarVisibility(false);
    model.cursorCenterlineMapper[i].setResolveCoincidentTopologyToPolygonOffset();
    model.cursorCenterlineMapper[i].setResolveCoincidentTopologyLineOffsetParameters(-1.0, -1.0);
    model.cursorCenterlineActor[i] = vtkActor.newInstance({
      parentProp: publicAPI
    });
    model.cursorCenterlineActor[i].setMapper(model.cursorCenterlineMapper[i]);
    model.centerlineProperty[i] = vtkProperty.newInstance();
    model.cursorCenterlineActor[i].setProperty(model.centerlineProperty[i]);
  }

  model.centerlineProperty[0].setColor(1, 0, 0);
  model.centerlineProperty[1].setColor(0, 1, 0);
  model.centerlineProperty[2].setColor(0, 0, 1);
  macro.get(publicAPI, model, ['cursorAlgorithm']); // Object methods

  vtkResliceCursorActor(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkResliceCursorActor'); // ----------------------------------------------------------------------------

var vtkResliceCursorActor$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkResliceCursorActor$1 as default, extend, newInstance };
