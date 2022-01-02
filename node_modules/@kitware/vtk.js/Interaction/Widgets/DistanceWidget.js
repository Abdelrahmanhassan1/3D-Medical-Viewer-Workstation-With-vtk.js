import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import vtkDistanceRepresentation from './DistanceRepresentation.js';
import vtkLabelWidget from './LabelWidget.js';
import vtkLineWidget from './LineWidget.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
// vtkDistanceWidget methods
// ----------------------------------------------------------------------------

function vtkDistanceWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkDistanceWidget');

  var superClass = _objectSpread({}, publicAPI);

  publicAPI.setInteractor = function (i) {
    superClass.setInteractor(i);
    model.labelWidget.setInteractor(model.interactor);
    publicAPI.modified();
  };

  publicAPI.setEnabled = function (enabling) {
    superClass.setEnabled(enabling);
    model.labelWidget.setEnabled(publicAPI.computeLabelWidgetVisibility());
  };

  publicAPI.createDefaultRepresentation = function () {
    if (!model.widgetRep) {
      publicAPI.setWidgetRep(vtkDistanceRepresentation.newInstance());
    }
  };

  publicAPI.setWidgetRep = function (rep) {
    superClass.setWidgetRep(rep);

    if (model.widgetRep) {
      model.labelWidget.setWidgetRep(model.widgetRep.getLabelRepresentation());
    }
  };

  publicAPI.computeLabelWidgetVisibility = function () {
    return model.currentHandle !== 0 && model.enabled;
  };

  publicAPI.setCurrentHandle = function (value) {
    superClass.setCurrentHandle(value);
    model.labelWidget.setEnabled(publicAPI.computeLabelWidgetVisibility());
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkLineWidget.extend(publicAPI, model, initialValues);
  model.labelWidget = vtkLabelWidget.newInstance();
  model.labelWidget.setProcessEvents(false); // Object methods

  vtkDistanceWidget(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkDistanceWidget'); // ----------------------------------------------------------------------------

var vtkDistanceWidget$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkDistanceWidget$1 as default, extend, newInstance };
