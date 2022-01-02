import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import macro from '../../macros.js';
import vtkRenderWindow$1 from '../OpenGL/RenderWindow.js';
import vtkRenderer from '../Core/Renderer.js';
import vtkRenderWindow from '../Core/RenderWindow.js';
import vtkRenderWindowInteractor from '../Core/RenderWindowInteractor.js';
import vtkInteractorStyleTrackballCamera from '../../Interaction/Style/InteractorStyleTrackballCamera.js';
import '../../Common/Core/Points.js';
import '../../Common/Core/DataArray.js';
import '../../Common/DataModel/PolyData.js';
import '../Core/Actor.js';
import '../Core/Mapper.js';

function vtkGenericRenderWindow(publicAPI, model) {
  // Capture resize trigger method to remove from publicAPI
  var invokeResize = publicAPI.invokeResize;
  delete publicAPI.invokeResize; // VTK renderWindow/renderer

  model.renderWindow = vtkRenderWindow.newInstance();
  model.renderer = vtkRenderer.newInstance();
  model.renderWindow.addRenderer(model.renderer); // OpenGLRenderWindow

  model.openGLRenderWindow = vtkRenderWindow$1.newInstance();
  model.renderWindow.addView(model.openGLRenderWindow); // Interactor

  model.interactor = vtkRenderWindowInteractor.newInstance();
  model.interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());
  model.interactor.setView(model.openGLRenderWindow);
  model.interactor.initialize(); // Expose background

  publicAPI.setBackground = model.renderer.setBackground; // Update BG color

  publicAPI.setBackground.apply(publicAPI, _toConsumableArray(model.background)); // Handle window resize

  publicAPI.resize = function () {
    if (model.container) {
      var dims = model.container.getBoundingClientRect();
      var devicePixelRatio = window.devicePixelRatio || 1;
      model.openGLRenderWindow.setSize(Math.floor(dims.width * devicePixelRatio), Math.floor(dims.height * devicePixelRatio));
      invokeResize();
      model.renderWindow.render();
    }
  }; // Handle DOM container relocation


  publicAPI.setContainer = function (el) {
    if (model.container) {
      model.interactor.unbindEvents(model.container);
    } // Switch container


    model.container = el;
    model.openGLRenderWindow.setContainer(model.container); // Bind to new container

    if (model.container) {
      model.interactor.bindEvents(model.container);
    }
  }; // Properly release GL context


  publicAPI.delete = macro.chain(publicAPI.setContainer, model.openGLRenderWindow.delete, publicAPI.delete); // Handle size

  if (model.listenWindowResize) {
    window.addEventListener('resize', publicAPI.resize);
  }

  publicAPI.resize();
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  background: [0.32, 0.34, 0.43],
  listenWindowResize: true,
  container: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Object methods

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['renderWindow', 'renderer', 'openGLRenderWindow', 'interactor', 'container']);
  macro.event(publicAPI, model, 'resize'); // Object specific methods

  vtkGenericRenderWindow(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend); // ----------------------------------------------------------------------------

var vtkGenericRenderWindow$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkGenericRenderWindow$1 as default, extend, newInstance };
