import macro from '../../macros.js';
import vtkCellArrayBufferObject from './CellArrayBufferObject.js';
import vtkShaderProgram from './ShaderProgram.js';
import vtkVertexArrayObject from './VertexArrayObject.js';

// vtkOpenGLHelper methods
// ----------------------------------------------------------------------------

function vtkOpenGLHelper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLHelper');

  publicAPI.setOpenGLRenderWindow = function (win) {
    model.program.setContext(win.getContext());
    model.VAO.setOpenGLRenderWindow(win);
    model.CABO.setOpenGLRenderWindow(win);
  };

  publicAPI.releaseGraphicsResources = function (oglwin) {
    model.VAO.releaseGraphicsResources();
    model.CABO.releaseGraphicsResources();
    model.CABO.setElementCount(0);
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  program: null,
  shaderSourceTime: null,
  VAO: null,
  attributeUpdateTime: null,
  CABO: null,
  primitiveType: 0
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  macro.obj(publicAPI, model);
  model.shaderSourceTime = {};
  macro.obj(model.shaderSourceTime);
  model.attributeUpdateTime = {};
  macro.obj(model.attributeUpdateTime);
  macro.setGet(publicAPI, model, ['program', 'shaderSourceTime', 'VAO', 'attributeUpdateTime', 'CABO', 'primitiveType']);
  model.program = vtkShaderProgram.newInstance();
  model.VAO = vtkVertexArrayObject.newInstance();
  model.CABO = vtkCellArrayBufferObject.newInstance(); // Object methods

  vtkOpenGLHelper(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend); // ----------------------------------------------------------------------------

var vtkHelper = {
  newInstance: newInstance,
  extend: extend
};

export { vtkHelper as default, extend, newInstance };
