import macro from '../../macros.js';
import vtkAbstractWidgetFactory from '../Core/AbstractWidgetFactory.js';
import vtkPlanePointManipulator from '../Manipulators/PlaneManipulator.js';
import vtkSplineContextRepresentation from '../Representations/SplineContextRepresentation.js';
import vtkSphereHandleRepresentation from '../Representations/SphereHandleRepresentation.js';
import widgetBehavior from './SplineWidget/behavior.js';
import generateState from './SplineWidget/state.js';
import { ViewTypes } from '../Core/WidgetManager/Constants.js';

// Factory
// ----------------------------------------------------------------------------

function vtkSplineWidget(publicAPI, model) {
  model.classHierarchy.push('vtkSplineWidget'); // --- Widget Requirement ---------------------------------------------------

  model.methodsToLink = ['outputBorder', 'fill', 'borderColor', 'errorBorderColor'];
  model.behavior = widgetBehavior;
  model.widgetState = generateState();

  publicAPI.getRepresentationsForViewType = function (viewType) {
    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
      case ViewTypes.VOLUME:
      default:
        return [{
          builder: vtkSphereHandleRepresentation,
          labels: ['handles', 'moveHandle'],
          initialValues: {
            scaleInPixels: true
          }
        }, {
          builder: vtkSplineContextRepresentation,
          labels: ['handles', 'moveHandle']
        }];
    }
  }; // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------
  // Default manipulator


  model.manipulator = vtkPlanePointManipulator.newInstance();
} // ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  freehandMinDistance: 0.1,
  allowFreehand: true,
  resolution: 32,
  // propagates to SplineContextRepresentation
  defaultCursor: 'pointer',
  handleSizeInPixels: 10,
  // propagates to SplineContextRepresentation
  resetAfterPointPlacement: false
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['manipulator', 'freehandMinDistance', 'allowFreehand', 'resolution', 'defaultCursor', 'handleSizeInPixels', 'resetAfterPointPlacement']);
  vtkSplineWidget(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkSplineWidget'); // ----------------------------------------------------------------------------

var vtkSplineWidget$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkSplineWidget$1 as default, extend, newInstance };
