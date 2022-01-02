import macro from '../../macros.js';
import vtkPlane from '../../Common/DataModel/Plane.js';

function intersectDisplayWithPlane(x, y, planeOrigin, planeNormal, renderer, glRenderWindow) {
  var near = glRenderWindow.displayToWorld(x, y, 0, renderer);
  var far = glRenderWindow.displayToWorld(x, y, 1, renderer);
  return vtkPlane.intersectWithLine(near, far, planeOrigin, planeNormal).x;
} // ----------------------------------------------------------------------------
// vtkPlaneManipulator methods
// ----------------------------------------------------------------------------

function vtkPlaneManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPlaneManipulator'); // --------------------------------------------------------------------------

  publicAPI.handleEvent = function (callData, glRenderWindow) {
    return intersectDisplayWithPlane(callData.position.x, callData.position.y, model.origin, model.normal, callData.pokedRenderer, glRenderWindow);
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  normal: [0, 0, 1],
  origin: [0, 0, 0]
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.obj(publicAPI, model);
  macro.setGetArray(publicAPI, model, ['normal', 'origin'], 3);
  vtkPlaneManipulator(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkPlaneManipulator'); // ----------------------------------------------------------------------------

var vtkPlanePointManipulator = {
  intersectDisplayWithPlane: intersectDisplayWithPlane,
  extend: extend,
  newInstance: newInstance
};

export { vtkPlanePointManipulator as default, extend, intersectDisplayWithPlane, newInstance };
