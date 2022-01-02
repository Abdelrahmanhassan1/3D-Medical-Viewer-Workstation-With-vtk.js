import macro from '../../macros.js';
import vtkCoordinate from '../../Rendering/Core/Coordinate.js';

// vtkPointPlacer methods
// ----------------------------------------------------------------------------

function vtkPointPlacer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPointPlacer');

  publicAPI.computeWorldPosition = function (renderer, displayPos, worldPos) {
    if (renderer) {
      var dPos = vtkCoordinate.newInstance();
      dPos.setCoordinateSystemToDisplay();
      dPos.setValue(displayPos[0], displayPos[1]);
      worldPos[0] = dPos.getComputedWorldValue(renderer)[0];
      worldPos[1] = dPos.getComputedWorldValue(renderer)[1];
      worldPos[2] = dPos.getComputedWorldValue(renderer)[2];
      return 1;
    }

    return 0;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  pixelTolerance: 5,
  worldTolerance: 0.001
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['pixelTolerance', 'worldTolerance']); // Object methods

  vtkPointPlacer(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkPointPlacer'); // ----------------------------------------------------------------------------

var vtkPointPlacer$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkPointPlacer$1 as default, extend, newInstance };
