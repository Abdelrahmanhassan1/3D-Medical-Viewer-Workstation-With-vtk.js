import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import vtkDataArray from './DataArray.js';
import { VtkDataTypes } from './DataArray/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
// Global methods
// ----------------------------------------------------------------------------

function extractCellSizes(cellArray) {
  var currentIdx = 0;
  return cellArray.filter(function (value, index) {
    if (index === currentIdx) {
      currentIdx += value + 1;
      return true;
    }

    return false;
  });
}

function getNumberOfCells(cellArray) {
  return extractCellSizes(cellArray).length;
} // ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------


var STATIC = {
  extractCellSizes: extractCellSizes,
  getNumberOfCells: getNumberOfCells
}; // ----------------------------------------------------------------------------
// vtkCellArray methods
// ----------------------------------------------------------------------------

function vtkCellArray(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCellArray');

  publicAPI.getNumberOfCells = function (recompute) {
    if (model.numberOfCells !== undefined && !recompute) {
      return model.numberOfCells;
    }

    model.cellSizes = extractCellSizes(model.values);
    model.numberOfCells = model.cellSizes.length;
    return model.numberOfCells;
  };

  publicAPI.getCellSizes = function (recompute) {
    if (model.cellSizes !== undefined && !recompute) {
      return model.cellSizes;
    }

    model.cellSizes = extractCellSizes(model.values);
    return model.cellSizes;
  };

  var superSetData = publicAPI.setData;

  publicAPI.setData = function (typedArray) {
    superSetData(typedArray, 1);
    model.numberOfCells = undefined;
    model.cellSizes = undefined;
  };
  /**
   * Returns the point indexes at the given location as a subarray.
   */


  publicAPI.getCell = function (loc) {
    var cellLoc = loc;
    var numberOfPoints = model.values[cellLoc++];
    return model.values.subarray(cellLoc, cellLoc + numberOfPoints);
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


function defaultValues(initialValues) {
  return _objectSpread({
    empty: true,
    numberOfComponents: 1,
    dataType: VtkDataTypes.UNSIGNED_INT
  }, initialValues);
} // ----------------------------------------------------------------------------


function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  vtkDataArray.extend(publicAPI, model, defaultValues(initialValues));
  vtkCellArray(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkCellArray'); // ----------------------------------------------------------------------------

var vtkCellArray$1 = _objectSpread({
  newInstance: newInstance,
  extend: extend
}, STATIC);

export { STATIC, vtkCellArray$1 as default, extend, newInstance };
