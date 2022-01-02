import macro from '../../macros.js';
import vtkAbstractWidgetFactory from '../Core/AbstractWidgetFactory.js';
import vtkCircleContextRepresentation from '../Representations/CircleContextRepresentation.js';
import vtkPlanePointManipulator from '../Manipulators/PlaneManipulator.js';
import vtkSphereHandleRepresentation from '../Representations/SphereHandleRepresentation.js';
import widgetBehavior from './PaintWidget/behavior.js';
import generateState from './PaintWidget/state.js';
import { ViewTypes } from '../Core/WidgetManager/Constants.js';

// Factory
// ----------------------------------------------------------------------------

function vtkPaintWidget(publicAPI, model) {
  model.classHierarchy.push('vtkPaintWidget'); // --- Widget Requirement ---------------------------------------------------

  model.behavior = widgetBehavior;
  model.widgetState = generateState(model.radius);

  publicAPI.getRepresentationsForViewType = function (viewType) {
    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
        return [{
          builder: vtkCircleContextRepresentation,
          labels: ['handle', 'trail']
        }];

      case ViewTypes.VOLUME:
      default:
        return [{
          builder: vtkSphereHandleRepresentation,
          labels: ['handle']
        }];
    }
  }; // --- Widget Requirement ---------------------------------------------------


  var handle = model.widgetState.getHandle(); // Default manipulator

  model.manipulator = vtkPlanePointManipulator.newInstance();
  handle.setManipulator(model.manipulator); // override

  var superSetRadius = publicAPI.setRadius;

  publicAPI.setRadius = function (r) {
    if (superSetRadius(r)) {
      handle.setScale1(r);
    }
  };
} // ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  manipulator: null,
  radius: 1,
  painting: false,
  color: [1]
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['painting']);
  macro.setGet(publicAPI, model, ['manipulator', 'radius', 'color']);
  vtkPaintWidget(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkPaintWidget'); // ----------------------------------------------------------------------------

var vtkPaintWidget$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkPaintWidget$1 as default, extend, newInstance };
