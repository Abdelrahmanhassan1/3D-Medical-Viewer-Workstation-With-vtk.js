import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import HandleRepConstants from './HandleRepresentation/Constants.js';
import vtkCoordinate from '../../Rendering/Core/Coordinate.js';
import vtkPointPlacer from './PointPlacer.js';
import vtkWidgetRepresentation from './WidgetRepresentation.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var InteractionState = HandleRepConstants.InteractionState; // ----------------------------------------------------------------------------
// vtkHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkHandleRepresentation');

  publicAPI.setDisplayPosition = function (displayPos) {
    if (model.renderer && model.pointPlacer) {
      var worldPos = [];

      if (model.pointPlacer.computeWorldPosition(model.renderer, displayPos, worldPos)) {
        model.displayPosition.setValue(displayPos);
        model.worldPosition.setValue(worldPos);
      }
    } else {
      model.displayPosition.setValue(displayPos);
    }
  };

  publicAPI.getDisplayPosition = function (pos) {
    if (model.renderer) {
      var p = model.worldPosition.getComputedDisplayValue(model.renderer);
      model.displayPosition.setValue(p[0], p[1], 0.0);
    }

    pos[0] = model.displayPosition.getValue()[0];
    pos[1] = model.displayPosition.getValue()[1];
    pos[2] = model.displayPosition.getValue()[2];
  };

  publicAPI.getDisplayPosition = function () {
    if (model.renderer) {
      var p = model.worldPosition.getComputedDisplayValue(model.renderer);
      model.displayPosition.setValue(p[0], p[1], 0.0);
    }

    return model.displayPosition.getValue();
  };

  publicAPI.setWorldPosition = function (pos) {
    model.worldPosition.setValue(pos);
  };

  publicAPI.getWorldPosition = function (pos) {
    model.worldPosition.getValue(pos);
  };

  publicAPI.getWorldPosition = function () {
    return model.worldPosition.getValue();
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  displayPosition: null,
  worldPosition: null,
  tolerance: 15,
  activeRepresentation: 0,
  constrained: 0,
  pointPlacer: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkWidgetRepresentation.extend(publicAPI, model, initialValues);
  model.displayPosition = vtkCoordinate.newInstance();
  model.displayPosition.setCoordinateSystemToDisplay();
  model.worldPosition = vtkCoordinate.newInstance();
  model.worldPosition.setCoordinateSystemToWorld();
  model.pointPlacer = vtkPointPlacer.newInstance();
  model.interactionState = InteractionState.OUTSIDE;
  macro.setGet(publicAPI, model, ['activeRepresentation', 'tolerance']); // Object methods

  vtkHandleRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkHandleRepresentation'); // ----------------------------------------------------------------------------

var vtkHandleRepresentation$1 = _objectSpread({
  newInstance: newInstance,
  extend: extend
}, HandleRepConstants);

export { vtkHandleRepresentation$1 as default, extend, newInstance };
