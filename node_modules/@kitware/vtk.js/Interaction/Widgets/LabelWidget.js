import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import vtkHandleWidget from './HandleWidget.js';
import vtkLabelRepresentation from './LabelRepresentation.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var VOID = macro.VOID; // ----------------------------------------------------------------------------
// vtkLabelWidget methods
// ----------------------------------------------------------------------------

function vtkLabelWidget(publicAPI, model) {
  // // Set our className
  model.classHierarchy.push('vtkLabelWidget');

  var superClass = _objectSpread({}, publicAPI);

  publicAPI.createDefaultRepresentation = function () {
    if (!model.widgetRep) {
      model.widgetRep = vtkLabelRepresentation.newInstance();
    }
  };

  publicAPI.setEnabled = function (enabling) {
    if (!enabling && model.widgetRep) {
      // Remove label
      model.widgetRep.setContainer(null);
    }

    superClass.setEnabled(enabling);

    if (enabling) {
      var container = model.interactor ? model.interactor.getContainer() : null;
      model.widgetRep.setContainer(container);
    }
  };

  publicAPI.scaleAction = function (callData) {
    return VOID;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkHandleWidget.extend(publicAPI, model, initialValues); // Object methods

  vtkLabelWidget(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkLabelWidget'); // ----------------------------------------------------------------------------

var vtkLabelWidget$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkLabelWidget$1 as default, extend, newInstance };
