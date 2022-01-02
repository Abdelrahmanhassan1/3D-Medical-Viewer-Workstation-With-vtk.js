import macro from '../../macros.js';
import vtkAbstractWidgetFactory from '../Core/AbstractWidgetFactory.js';
import vtkPlanePointManipulator from '../Manipulators/PlaneManipulator.js';
import vtkPolyLineRepresentation from '../Representations/PolyLineRepresentation.js';
import vtkSphereHandleRepresentation from '../Representations/SphereHandleRepresentation.js';
import vtkSVGLandmarkRepresentation from '../SVG/SVGLandmarkRepresentation.js';
import widgetBehavior from './PolyLineWidget/behavior.js';
import generateState from './PolyLineWidget/state.js';
import { ViewTypes } from '../Core/WidgetManager/Constants.js';

// Factory
// ----------------------------------------------------------------------------

function vtkPolyLineWidget(publicAPI, model) {
  model.classHierarchy.push('vtkPolyLineWidget'); // --- Widget Requirement ---------------------------------------------------

  model.methodsToLink = ['activeColor', 'activeScaleFactor', 'closePolyLine', 'defaultScale', 'glyphResolution', 'lineThickness', 'useActiveColor', 'scaleInPixels'];
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
          labels: ['handles'],
          initialValues: {
            scaleInPixels: true
          }
        }, {
          builder: vtkSphereHandleRepresentation,
          labels: ['moveHandle'],
          initialValues: {
            scaleInPixels: true
          }
        }, {
          builder: vtkSVGLandmarkRepresentation,
          initialValues: {
            textProps: {
              dx: 12,
              dy: -12
            }
          },
          labels: ['handles']
        }, {
          builder: vtkPolyLineRepresentation,
          labels: ['handles', 'moveHandle']
        }];
    }
  }; // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------


  model.widgetState.onBoundsChange(function (bounds) {
    var center = [(bounds[0] + bounds[1]) * 0.5, (bounds[2] + bounds[3]) * 0.5, (bounds[4] + bounds[5]) * 0.5];
    model.widgetState.getMoveHandle().setOrigin(center);
  }); // Default manipulator

  model.manipulator = vtkPlanePointManipulator.newInstance();
} // ----------------------------------------------------------------------------


var DEFAULT_VALUES = {// manipulator: null,
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['manipulator']);
  vtkPolyLineWidget(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkPolyLineWidget'); // ----------------------------------------------------------------------------

var vtkPolyLineWidget$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkPolyLineWidget$1 as default, extend, newInstance };
