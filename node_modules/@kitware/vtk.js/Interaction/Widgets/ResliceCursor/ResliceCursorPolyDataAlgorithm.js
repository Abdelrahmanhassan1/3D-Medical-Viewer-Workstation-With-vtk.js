import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../../macros.js';
import { PlaneNormal } from './ResliceCursorActor/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
// vtkResliceCursorPolyDataAlgorithm methods
// ----------------------------------------------------------------------------

function vtkResliceCursorPolyDataAlgorithm(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkResliceCursorPolyDataAlgorithm');

  var superClass = _objectSpread({}, publicAPI);

  publicAPI.setReslicePlaneNormalToXAxis = function () {
    publicAPI.setReslicePlaneNormal(PlaneNormal.XAxis);
  };

  publicAPI.setReslicePlaneNormalToYAxis = function () {
    publicAPI.setReslicePlaneNormal(PlaneNormal.YAxis);
  };

  publicAPI.setReslicePlaneNormalToZAxis = function () {
    publicAPI.setReslicePlaneNormal(PlaneNormal.ZAxis);
  };

  publicAPI.getCenterlineAxis1 = function () {
    return publicAPI.getOutputData(0);
  };

  publicAPI.getCenterlineAxis2 = function () {
    return publicAPI.getOutputData(1);
  };

  publicAPI.getAxis1 = function () {
    if (model.reslicePlaneNormal === PlaneNormal.ZAxis) {
      return 1;
    }

    return 2;
  };

  publicAPI.getAxis2 = function () {
    if (model.reslicePlaneNormal === PlaneNormal.XAxis) {
      return 1;
    }

    return 0;
  };

  publicAPI.getPlaneAxis1 = function () {
    if (model.reslicePlaneNormal === PlaneNormal.XAxis) {
      return 1;
    }

    return 0;
  };

  publicAPI.getPlaneAxis2 = function () {
    if (model.reslicePlaneNormal === PlaneNormal.ZAxis) {
      return 1;
    }

    return 2;
  };

  publicAPI.getOtherPlaneForAxis = function (p) {
    for (var i = 0; i < 3; i++) {
      if (i !== p && i !== model.reslicePlaneNormal) {
        return i;
      }
    }

    return -1;
  };

  publicAPI.getMTime = function () {
    var mTime = superClass.getMTime();

    if (model.resliceCursor) {
      var time = model.resliceCursor.getMTime();

      if (time > mTime) {
        mTime = time;
      }
    }

    return mTime;
  };

  publicAPI.requestData = function (inData, outData) {
    if (!model.resliceCursor) {
      return;
    } // Cut the reslice cursor with the plane on which we are viewing.


    var axis1 = publicAPI.getAxis1();
    outData[0] = model.resliceCursor.getCenterlineAxisPolyData(axis1);
    var axis2 = publicAPI.getAxis2();
    outData[1] = model.resliceCursor.getCenterlineAxisPolyData(axis2);
  }; //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------

} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  reslicePlaneNormal: PlaneNormal.XAxis
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  model.resliceCursor = null;
  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 0, 2);
  macro.setGet(publicAPI, model, ['reslicePlaneNormal', 'resliceCursor']); // Object methods

  vtkResliceCursorPolyDataAlgorithm(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkResliceCursorPolyDataAlgorithm'); // ----------------------------------------------------------------------------

var vtkResliceCursorPolyDataAlgorithm$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkResliceCursorPolyDataAlgorithm$1 as default, extend, newInstance };
