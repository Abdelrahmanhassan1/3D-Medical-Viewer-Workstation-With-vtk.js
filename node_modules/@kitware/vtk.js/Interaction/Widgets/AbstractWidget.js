import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import vtkInteractorObserver from '../../Rendering/Core/InteractorObserver.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
// vtkAbstractWidget methods
// ----------------------------------------------------------------------------

function vtkAbstractWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAbstractWidget');

  var superClass = _objectSpread({}, publicAPI); //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------
  // Virtual method


  publicAPI.createDefaultRepresentation = function () {}; //----------------------------------------------------------------------------


  publicAPI.setEnabled = function (enable) {
    if (enable === model.enabled) {
      return;
    }

    if (model.interactor) {
      var renderer = model.interactor.getCurrentRenderer();

      if (renderer && model.widgetRep) {
        renderer.removeViewProp(model.widgetRep);
      }
    } // Enable/disable in superclass


    superClass.setEnabled(enable);

    if (enable) {
      // Add representation to new interactor's renderer
      if (!model.interactor) {
        return;
      }

      var _renderer = model.interactor.getCurrentRenderer();

      if (!_renderer) {
        return;
      }

      publicAPI.createDefaultRepresentation();
      model.widgetRep.setRenderer(_renderer);
      model.widgetRep.buildRepresentation();

      _renderer.addViewProp(model.widgetRep);
    }
  }; //----------------------------------------------------------------------------


  publicAPI.render = function () {
    if (!model.parent && model.interactor) {
      model.interactor.render();
    }
  };

  publicAPI.isDragable = function () {
    return model.dragable && (model.parent ? model.parent.isDragable() : true);
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  enabled: false,
  // Make widgets disabled by default
  priority: 0.5,
  // Use a priority of 0.5, since default priority from vtkInteractorObserver is 0.0.
  widgetRep: null,
  parent: null,
  dragable: true
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var newDefault = _objectSpread(_objectSpread({}, DEFAULT_VALUES), initialValues); // Inheritance


  vtkInteractorObserver.extend(publicAPI, model, newDefault);
  macro.setGet(publicAPI, model, ['widgetRep', 'parent', 'dragable']); // Object methods

  vtkAbstractWidget(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkAbstractWidget'); // ----------------------------------------------------------------------------

var vtkAbstractWidget$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkAbstractWidget$1 as default, extend, newInstance };
