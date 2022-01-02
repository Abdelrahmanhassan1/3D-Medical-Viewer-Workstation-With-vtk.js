import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import { mat4, vec3 } from 'gl-matrix';
import macro from '../../macros.js';
import vtkCompositeCameraManipulator from './CompositeCameraManipulator.js';
import vtkCompositeMouseManipulator from './CompositeMouseManipulator.js';
import { r as radiansFromDegrees, j as cross } from '../../Common/Core/Math/index.js';
import vtkMatrixBuilder from '../../Common/Core/MatrixBuilder.js';

// vtkMouseCameraAxisRotateManipulator methods
// ----------------------------------------------------------------------------

function vtkMouseCameraAxisRotateManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseCameraAxisRotateManipulator');
  var newCamPos = new Float64Array(3);
  var newFp = new Float64Array(3); // const newViewUp = new Float64Array(3);

  var trans = new Float64Array(16);
  var v2 = new Float64Array(3);
  var centerNeg = new Float64Array(3);
  var direction = new Float64Array(3);
  var fpDirection = new Float64Array(3);

  publicAPI.onButtonDown = function (interactor, renderer, position) {
    model.previousPosition = position;
  };

  publicAPI.onMouseMove = function (interactor, renderer, position) {
    if (!position) {
      return;
    }

    var camera = renderer.getActiveCamera();
    var cameraPos = camera.getPosition();
    var cameraFp = camera.getFocalPoint();
    var cameraViewUp = camera.getViewUp();
    var cameraDirection = camera.getDirectionOfProjection();
    mat4.identity(trans);
    var center = model.center,
        rotationFactor = model.rotationFactor,
        rotationAxis = model.rotationAxis; // Translate to center

    mat4.translate(trans, trans, center);
    var dx = model.previousPosition.x - position.x;
    var dy = model.previousPosition.y - position.y;
    var size = interactor.getView().getSize(); // Azimuth

    mat4.rotate(trans, trans, radiansFromDegrees(360.0 * dx / size[0] * rotationFactor), rotationAxis); // Elevation

    cross(cameraDirection, cameraViewUp, v2);
    mat4.rotate(trans, trans, radiansFromDegrees(-360.0 * dy / size[1] * rotationFactor), v2); // Translate back

    centerNeg[0] = -center[0];
    centerNeg[1] = -center[1];
    centerNeg[2] = -center[2];
    mat4.translate(trans, trans, centerNeg); // Apply transformation to camera position, focal point, and view up

    vec3.transformMat4(newCamPos, cameraPos, trans);
    vec3.transformMat4(newFp, cameraFp, trans); // what is the current direction from the fp
    // to the camera

    vec3.subtract(fpDirection, newCamPos, newFp);
    vec3.normalize(fpDirection, fpDirection); // make the top sticky to avoid accidental flips

    if (Math.abs(vec3.dot(fpDirection, rotationAxis)) > 0.95) {
      // this can be smarter where it still allows Azimuth here
      // but prevents the elevation part
      model.previousPosition = position;
      return;
    }

    if (model.useHalfAxis) {
      // what is the current distance from pos to center of rotation
      var distance = vec3.distance(newCamPos, center); // what is the current direction from the center of rotation
      // to the camera

      vec3.subtract(direction, newCamPos, center);
      vec3.normalize(direction, direction); // project the rotation axis onto the direction
      // so we know how much below the half plane we are

      var dotP = vec3.dot(rotationAxis, direction);

      if (dotP < 0) {
        // adjust the new camera position to bring it up to the half plane
        vec3.scaleAndAdd(newCamPos, newCamPos, rotationAxis, -dotP * distance); // the above step will change the distance which might feel odd
        // so the next couple lines restore the distance to the center
        // what is the new direction from the center of rotation
        // to the camera

        vec3.subtract(direction, newCamPos, center);
        vec3.normalize(direction, direction);
        vec3.scaleAndAdd(newCamPos, center, direction, distance); // compute original cam direction to center

        vec3.subtract(v2, cameraPos, center);
        vec3.normalize(v2, v2); // const rAngle = 0.0;

        var acosR = Math.min(1.0, Math.max(-1.0, vec3.dot(direction, v2)));
        var rAngle = Math.acos(acosR); // 0 to pi

        vec3.cross(v2, v2, direction);
        vec3.normalize(v2, v2);
        vec3.subtract(newFp, cameraFp, center);
        var fpDist = vec3.length(newFp); // Note it normalizes the vector to be rotated

        var result = _toConsumableArray(newFp);

        vtkMatrixBuilder.buildFromRadian().rotate(rAngle, v2).apply(result);
        vec3.scaleAndAdd(newFp, center, result, fpDist);
      }
    }

    camera.setPosition(newCamPos[0], newCamPos[1], newCamPos[2]);
    camera.setFocalPoint(newFp[0], newFp[1], newFp[2]);
    camera.setViewUp(rotationAxis);
    renderer.resetCameraClippingRange();

    if (interactor.getLightFollowCamera()) {
      renderer.updateLightsGeometryToFollowCamera();
    }

    model.previousPosition = position;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  rotationAxis: [0, 0, 1],
  useHalfAxis: true
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['rotationAxis', 'useHalfAxis']);
  vtkCompositeMouseManipulator.extend(publicAPI, model, initialValues);
  vtkCompositeCameraManipulator.extend(publicAPI, model, initialValues); // Object specific methods

  vtkMouseCameraAxisRotateManipulator(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkMouseCameraAxisRotateManipulator'); // ----------------------------------------------------------------------------

var vtkMouseCameraAxisRotateManipulator$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkMouseCameraAxisRotateManipulator$1 as default, extend, newInstance };
