import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import vtkLabelRepresentation from './LabelRepresentation.js';
import vtkLineRepresentation from './LineRepresentation.js';
import { f as distance2BetweenPoints } from '../../Common/Core/Math/index.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
// vtkDistanceRepresentation methods
// ----------------------------------------------------------------------------

function vtkDistanceRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkDistanceRepresentation');

  var superClass = _objectSpread({}, publicAPI);

  publicAPI.setRenderer = function (renderer) {
    model.labelRepresentation.setRenderer(renderer);
    superClass.setRenderer(renderer);
    publicAPI.modified();
  };

  publicAPI.getContainer = function () {
    return model.labelRepresentation.getContainer();
  };

  publicAPI.setContainer = function (container) {
    model.labelRepresentation.setContainer(container);
    publicAPI.modified();
  };

  publicAPI.getLabelStyle = function () {
    return model.labelRepresentation.getLabelStyle();
  };

  publicAPI.setLabelStyle = function (labelStyle) {
    model.labelRepresentation.setLabelStyle(labelStyle);
    publicAPI.modified();
  };

  publicAPI.getActors = function () {
    var actors = superClass.getActors();
    actors = [].concat(_toConsumableArray(actors), _toConsumableArray(model.labelRepresentation.getActors()));
    return actors;
  };

  publicAPI.getDistance = function () {
    return Math.sqrt(distance2BetweenPoints(publicAPI.getPoint1WorldPosition(), publicAPI.getPoint2WorldPosition())).toFixed(model.numberOfDecimals);
  };

  publicAPI.setPoint1WorldPosition = function (pos) {
    superClass.setPoint1WorldPosition(pos);
    publicAPI.updateLabelRepresentation();
    publicAPI.modified();
  };

  publicAPI.setPoint2WorldPosition = function (pos) {
    superClass.setPoint2WorldPosition(pos);
    publicAPI.updateLabelRepresentation();
    publicAPI.modified();
  };

  publicAPI.updateLabelRepresentation = function () {
    model.labelRepresentation.setLabelText(publicAPI.getDistance());
    var p1Position = model.point1Representation.getWorldPosition();
    var p2Position = model.point2Representation.getWorldPosition();
    var coord = [];

    for (var i = 0; i < 3; i++) {
      coord[i] = p1Position[i] + (p2Position[i] - p1Position[i]) * model.labelPositionInLine;
    }

    model.labelRepresentation.setWorldPosition(coord);
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  labelStyle: {
    fontColor: 'white',
    fontStyle: 'normal',
    fontSize: '15',
    fontFamily: 'Arial',
    strokeColor: 'black',
    strokeSize: '1'
  },
  numberOfDecimals: 2,
  labelPositionInLine: 0.5,
  container: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkLineRepresentation.extend(publicAPI, model, initialValues);
  model.labelRepresentation = vtkLabelRepresentation.newInstance();
  macro.setGet(publicAPI, model, ['numberOfDecimals', 'labelPosition']);
  macro.get(publicAPI, model, ['labelRepresentation']); // Object methods

  vtkDistanceRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkDistanceRepresentation'); // ----------------------------------------------------------------------------

var vtkDistanceRepresentation$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkDistanceRepresentation$1 as default, extend, newInstance };
