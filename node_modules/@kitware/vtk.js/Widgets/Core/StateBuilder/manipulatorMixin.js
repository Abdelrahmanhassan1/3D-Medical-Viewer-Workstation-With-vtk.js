import macro from '../../../macros.js';

function vtkManipulatorMixin(publicAPI, model) {
  publicAPI.updateManipulator = function () {
    if (model.manipulator) {
      var origin = model.origin,
          normal = model.normal,
          direction = model.direction;
      var _model$manipulator = model.manipulator,
          setOrigin = _model$manipulator.setOrigin,
          setCenter = _model$manipulator.setCenter,
          setNormal = _model$manipulator.setNormal,
          setDirection = _model$manipulator.setDirection;

      if (origin && setOrigin) {
        setOrigin(origin);
      } else if (origin && setCenter) {
        setCenter(origin);
      }

      if (direction && setDirection) {
        setDirection(direction);
      } else if (direction && !normal && setNormal) {
        setNormal(direction);
      } else if (normal && setDirection) {
        setDirection(normal);
      }
    }
  };
} // ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  manipulator: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGet(publicAPI, model, ['manipulator']);
  vtkManipulatorMixin(publicAPI, model);
} // ----------------------------------------------------------------------------

var manipulator = {
  extend: extend
};

export { manipulator as default, extend };
