import _defineProperty from '@babel/runtime/helpers/defineProperty';
import vtkWidgetRepresentation from './WidgetRepresentation.js';
import { Behavior } from './WidgetRepresentation/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
// vtkWidgetRepresentation
// ----------------------------------------------------------------------------

function vtkContextRepresentation(publicAPI, model) {
  model.classHierarchy.push('vtkContextRepresentation');
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  activeScaleFactor: 1.2,
  activeColor: 1,
  useActiveColor: true,
  behavior: Behavior.CONTEXT,
  pickable: false,
  dragable: true
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var newDefault = _objectSpread(_objectSpread({}, DEFAULT_VALUES), initialValues);

  vtkWidgetRepresentation.extend(publicAPI, model, newDefault);
  vtkContextRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var vtkContextRepresentation$1 = {
  extend: extend
};

export { vtkContextRepresentation$1 as default, extend };
