import macro from '../../macros.js';
import vtkInteractorObserver from '../../Rendering/Core/InteractorObserver.js';
import vtkProp from '../../Rendering/Core/Prop.js';

var vtkErrorMacro = macro.vtkErrorMacro; // ----------------------------------------------------------------------------
// vtkWidgetRepresentation methods
// ----------------------------------------------------------------------------

function vtkWidgetRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWidgetRepresentation');

  publicAPI.getPickedActor = function (x, y, z, picker) {
    picker.pick(x, y, z, model.renderer);
    return picker.getActors[0];
  };

  publicAPI.adjustBounds = function (bounds, newBounds, center) {
    if (bounds.length !== 6) {
      vtkErrorMacro("vtkWidgetRepresentation::adjustBounds Can't process bounds, not enough values...");
      return;
    }

    center[0] = (bounds[0] + bounds[1]) / 2.0;
    center[1] = (bounds[2] + bounds[3]) / 2.0;
    center[2] = (bounds[4] + bounds[5]) / 2.0;
    newBounds[0] = center[0] + model.placeFactor * (bounds[0] - center[0]);
    newBounds[1] = center[0] + model.placeFactor * (bounds[1] - center[0]);
    newBounds[2] = center[1] + model.placeFactor * (bounds[2] - center[1]);
    newBounds[3] = center[1] + model.placeFactor * (bounds[3] - center[1]);
    newBounds[4] = center[2] + model.placeFactor * (bounds[4] - center[2]);
    newBounds[5] = center[2] + model.placeFactor * (bounds[5] - center[2]);
  };

  publicAPI.sizeHandlesInPixels = function (factor, pos) {
    var renderer = model.renderer;

    if (!model.validPick || !renderer || !renderer.getActiveCamera()) {
      return model.handleSize * factor * model.initialLength;
    }

    var focalPoint = vtkInteractorObserver.computeWorldToDisplay(renderer, pos[0], pos[1], pos[2]);
    var z = focalPoint[2];
    var x = focalPoint[0] - model.handleSize / 2.0;
    var y = focalPoint[1] - model.handleSize / 2.0;
    var lowerLeft = vtkInteractorObserver.computeDisplayToWorld(renderer, x, y, z);
    x = focalPoint[0] + model.handleSize / 2.0;
    y = focalPoint[1] + model.handleSize / 2.0;
    var upperRight = vtkInteractorObserver.computeDisplayToWorld(renderer, x, y, z);
    var radius = 0.0;

    for (var i = 0; i < 3; i++) {
      radius += (upperRight[i] - lowerLeft[i]) * (upperRight[i] - lowerLeft[i]);
    }

    return factor * (Math.sqrt(radius) / 2.0);
  };

  publicAPI.sizeHandlesRelativeToViewport = function (factor, pos) {
    var renderer = model.renderer;

    if (!model.validPick || !renderer || !renderer.getActiveCamera()) {
      return model.handleSize * factor * model.initialLength;
    }

    var viewport = renderer.getViewport();
    var view = renderer.getRenderWindow().getViews()[0];
    var winSize = view.getViewportSize(renderer);
    var focalPoint = vtkInteractorObserver.computeWorldToDisplay(renderer, pos[0], pos[1], pos[2]);
    var z = focalPoint[2];
    var x = winSize[0] * viewport[0];
    var y = winSize[1] * viewport[1];
    var windowLowerLeft = vtkInteractorObserver.computeDisplayToWorld(renderer, x, y, z);
    x = winSize[0] * viewport[2];
    y = winSize[1] * viewport[3];
    var windowUpperRight = vtkInteractorObserver.computeDisplayToWorld(renderer, x, y, z);
    var radius = 0.0;

    for (var i = 0; i < 3; i++) {
      radius += (windowUpperRight[i] - windowLowerLeft[i]) * (windowUpperRight[i] - windowLowerLeft[i]);
    }

    return factor * (Math.sqrt(radius) / 2.0);
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  renderer: null,
  interactionState: 0,
  startEventPosition: [0.0, 0.0, 0.0],
  lastEventPosition: [0.0, 0.0, 0.0],
  placeFactor: 0.5,
  placed: 0,
  handleSize: 0.05,
  validPick: 0,
  initialBounds: [0.0, 1.0, 0.0, 1.0, 0.0, 1.0],
  initialLength: 0.0,
  needToRender: 0
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkProp.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['renderer', 'handleSize', 'placeFactor', 'needToRender', 'interactionState']); // Object methods

  vtkWidgetRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkWidgetRepresentation'); // ----------------------------------------------------------------------------

var vtkWidgetRepresentation$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkWidgetRepresentation$1 as default, extend, newInstance };
