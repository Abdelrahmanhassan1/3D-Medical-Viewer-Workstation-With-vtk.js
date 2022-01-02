import macro from '../../../macros.js';

var DEFAULT_VALUES = {
  color: 0.5
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGet(publicAPI, model, ['color']);
} // ----------------------------------------------------------------------------

var color = {
  extend: extend
};

export { color as default, extend };
