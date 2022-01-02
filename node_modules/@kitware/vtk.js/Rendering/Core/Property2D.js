import macro from '../../macros.js';

// vtkProperty2D methods
// ----------------------------------------------------------------------------

function vtkProperty2D(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkProperty2D');
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  color: [1, 1, 1],
  opacity: 1,
  pointSize: 1,
  lineWidth: 1,
  displayLocation: 'Foreground'
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['opacity', 'lineWidth', 'pointSize', 'displayLocation']);
  macro.setGetArray(publicAPI, model, ['color'], 3); // Object methods

  vtkProperty2D(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkProperty2D'); // ----------------------------------------------------------------------------

var vtkProperty2D$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkProperty2D$1 as default, extend, newInstance };
