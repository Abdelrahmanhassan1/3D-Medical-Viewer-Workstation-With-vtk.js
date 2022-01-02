import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import vtkMatrixBuilder from '../../Common/Core/MatrixBuilder.js';
import vtkDataArray from '../../Common/Core/DataArray.js';
import vtkActor from './Actor.js';
import vtkMapper from './Mapper.js';
import vtkArrowSource from '../../Filters/Sources/ArrowSource.js';
import vtkAppendPolyData from '../../Filters/General/AppendPolyData.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function centerDataSet(ds) {
  var _vtkMatrixBuilder$bui;

  var bounds = ds.getPoints().getBounds();
  var center = [-(bounds[0] + bounds[1]) * 0.5, -(bounds[2] + bounds[3]) * 0.5, -(bounds[4] + bounds[5]) * 0.5];

  (_vtkMatrixBuilder$bui = vtkMatrixBuilder.buildFromDegree()).translate.apply(_vtkMatrixBuilder$bui, center).apply(ds.getPoints().getData());
} // ----------------------------------------------------------------------------


function addColor(ds, r, g, b) {
  var size = ds.getPoints().getData().length;
  var rgbArray = new Uint8Array(size);
  var offset = 0;

  while (offset < size) {
    rgbArray[offset++] = r;
    rgbArray[offset++] = g;
    rgbArray[offset++] = b;
  }

  ds.getPointData().setScalars(vtkDataArray.newInstance({
    name: 'color',
    numberOfComponents: 3,
    values: rgbArray
  }));
} // ----------------------------------------------------------------------------
// vtkAxesActor
// ----------------------------------------------------------------------------


function vtkAxesActor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAxesActor');

  publicAPI.update = function () {
    var xAxis = vtkArrowSource.newInstance(_objectSpread({
      direction: [1, 0, 0]
    }, model.config)).getOutputData();
    centerDataSet(xAxis);
    addColor.apply(void 0, [xAxis].concat(_toConsumableArray(model.xAxisColor)));
    var yAxis = vtkArrowSource.newInstance(_objectSpread({
      direction: [0, 1, 0]
    }, model.config)).getOutputData();
    centerDataSet(yAxis);
    addColor.apply(void 0, [yAxis].concat(_toConsumableArray(model.yAxisColor)));
    var zAxis = vtkArrowSource.newInstance(_objectSpread({
      direction: [0, 0, 1]
    }, model.config)).getOutputData();
    centerDataSet(zAxis);
    addColor.apply(void 0, [zAxis].concat(_toConsumableArray(model.zAxisColor)));
    var source = vtkAppendPolyData.newInstance();
    source.setInputData(xAxis);
    source.addInputData(yAxis);
    source.addInputData(zAxis); // set mapper

    var mapper = vtkMapper.newInstance();
    mapper.setInputConnection(source.getOutputPort());
    publicAPI.setMapper(mapper);
  };

  publicAPI.update();
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  config: {
    tipResolution: 60,
    tipRadius: 0.1,
    tipLength: 0.2,
    shaftResolution: 60,
    shaftRadius: 0.03,
    invert: false
  },
  xAxisColor: [255, 0, 0],
  yAxisColor: [255, 255, 0],
  zAxisColor: [0, 128, 0]
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkActor.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['config']);
  macro.setGetArray(publicAPI, model, ['xAxisColor', 'yAxisColor', 'zAxisColor'], 3, 255); // Object methods

  vtkAxesActor(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkAxesActor'); // ----------------------------------------------------------------------------

var vtkAxesActor$1 = {
  newInstance: newInstance,
  extend: extend
};

export { DEFAULT_VALUES, vtkAxesActor$1 as default, extend, newInstance };
