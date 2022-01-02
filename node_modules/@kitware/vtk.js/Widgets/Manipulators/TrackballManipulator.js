import { mat4, vec3 } from 'gl-matrix';
import macro from '../../macros.js';
import { j as cross, r as radiansFromDegrees } from '../../Common/Core/Math/index.js';

function trackballRotate(prevX, prevY, curX, curY, origin, direction, renderer, glRenderWindow) {
  var dx = curX - prevX;
  var dy = curY - prevY;
  var camera = renderer.getActiveCamera();
  var viewUp = camera.getViewUp();
  var dop = camera.getDirectionOfProjection();
  var size = renderer.getRenderWindow().getInteractor().getView().getSize();
  var xdeg = 360.0 * dx / size[0];
  var ydeg = 360.0 * dy / size[1];
  var newDirection = new Float64Array([direction[0], direction[1], direction[2]]);
  var xDisplayAxis = viewUp;
  var yDisplayAxis = [0, 0, 0];
  cross(dop, viewUp, yDisplayAxis);
  var rot = mat4.identity(new Float64Array(16));
  mat4.rotate(rot, rot, radiansFromDegrees(xdeg), xDisplayAxis);
  mat4.rotate(rot, rot, radiansFromDegrees(-ydeg), yDisplayAxis);
  vec3.transformMat4(newDirection, newDirection, rot);
  return newDirection;
} // ----------------------------------------------------------------------------
// vtkTrackballManipulator methods
// ----------------------------------------------------------------------------

function vtkTrackballManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTrackballManipulator');
  var prevX = 0;
  var prevY = 0; // --------------------------------------------------------------------------

  publicAPI.handleEvent = function (callData, glRenderWindow) {
    var newDirection = trackballRotate(prevX, prevY, callData.position.x, callData.position.y, model.origin, model.normal, callData.pokedRenderer);
    prevX = callData.position.x;
    prevY = callData.position.y;
    return newDirection;
  }; // --------------------------------------------------------------------------


  publicAPI.reset = function (callData) {
    prevX = callData.position.x;
    prevY = callData.position.y;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  normal: [0, 0, 1]
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.obj(publicAPI, model);
  macro.setGetArray(publicAPI, model, ['normal'], 3);
  vtkTrackballManipulator(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkTrackballManipulator'); // ----------------------------------------------------------------------------

var vtkTrackballManipulator$1 = {
  trackballRotate: trackballRotate,
  extend: extend,
  newInstance: newInstance
};

export { vtkTrackballManipulator$1 as default, extend, newInstance, trackballRotate };
