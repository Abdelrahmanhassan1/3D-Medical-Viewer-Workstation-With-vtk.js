import macro from '../../macros.js';
import vtkAbstractWidgetFactory from '../Core/AbstractWidgetFactory.js';
import vtkPlanePointManipulator from '../Manipulators/PlaneManipulator.js';
import vtkPolyLineRepresentation from '../Representations/PolyLineRepresentation.js';
import vtkSphereHandleRepresentation from '../Representations/SphereHandleRepresentation.js';
import { f as distance2BetweenPoints } from '../../Common/Core/Math/index.js';
import widgetBehavior from './DistanceWidget/behavior.js';
import generateState from './DistanceWidget/state.js';
import { ViewTypes } from '../Core/WidgetManager/Constants.js';

// Factory
// ----------------------------------------------------------------------------

function vtkDistanceWidget(publicAPI, model) {
  model.classHierarchy.push('vtkDistanceWidget'); // --- Widget Requirement ---------------------------------------------------

  model.methodsToLink = ['activeScaleFactor', 'activeColor', 'useActiveColor', 'glyphResolution', 'defaultScale'];
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
          labels: ['handles']
        }, {
          builder: vtkSphereHandleRepresentation,
          labels: ['moveHandle']
        }, {
          builder: vtkPolyLineRepresentation,
          labels: ['handles', 'moveHandle']
        }];
    }
  }; // --- Public methods -------------------------------------------------------


  publicAPI.getDistance = function () {
    var handles = model.widgetState.getHandleList();

    if (handles.length !== 2) {
      return 0;
    }

    if (!handles[0].getOrigin() || !handles[1].getOrigin()) {
      return 0;
    }

    return Math.sqrt(distance2BetweenPoints(handles[0].getOrigin(), handles[1].getOrigin()));
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
  vtkDistanceWidget(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkDistanceWidget'); // ----------------------------------------------------------------------------

var vtkDistanceWidget$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkDistanceWidget$1 as default, extend, newInstance };
