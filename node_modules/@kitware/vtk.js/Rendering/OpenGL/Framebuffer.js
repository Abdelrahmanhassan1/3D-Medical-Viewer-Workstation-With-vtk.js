import { newInstance as newInstance$1, obj, setGet, vtkErrorMacro } from '../../macros.js';
import vtkOpenGLTexture from './Texture.js';
import { VtkDataTypes } from '../../Common/Core/DataArray/Constants.js';
import { Filter } from './Texture/Constants.js';

// vtkFramebuffer methods
// ----------------------------------------------------------------------------

function vtkFramebuffer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkFramebuffer');

  publicAPI.getBothMode = function () {
    return model.context.FRAMEBUFFER;
  }; // publicAPI.getDrawMode = () => model.context.DRAW_FRAMEBUFFER;
  // publicAPI.getReadMode = () => model.context.READ_FRAMEBUFFER;


  publicAPI.saveCurrentBindingsAndBuffers = function (modeIn) {
    var mode = typeof modeIn !== 'undefined' ? modeIn : publicAPI.getBothMode();
    publicAPI.saveCurrentBindings(mode);
    publicAPI.saveCurrentBuffers(mode);
  };

  publicAPI.saveCurrentBindings = function (modeIn) {
    var gl = model.context;
    model.previousDrawBinding = gl.getParameter(model.context.FRAMEBUFFER_BINDING);
    model.previousActiveFramebuffer = model.openGLRenderWindow.getActiveFramebuffer();
  };

  publicAPI.saveCurrentBuffers = function (modeIn) {// noop on webgl 1
  };

  publicAPI.restorePreviousBindingsAndBuffers = function (modeIn) {
    var mode = typeof modeIn !== 'undefined' ? modeIn : publicAPI.getBothMode();
    publicAPI.restorePreviousBindings(mode);
    publicAPI.restorePreviousBuffers(mode);
  };

  publicAPI.restorePreviousBindings = function (modeIn) {
    var gl = model.context;
    gl.bindFramebuffer(gl.FRAMEBUFFER, model.previousDrawBinding);
    model.openGLRenderWindow.setActiveFramebuffer(model.previousActiveFramebuffer);
  };

  publicAPI.restorePreviousBuffers = function (modeIn) {// currently a noop on webgl1
  };

  publicAPI.bind = function () {
    model.context.bindFramebuffer(model.context.FRAMEBUFFER, model.glFramebuffer);

    if (model.colorTexture) {
      model.colorTexture.bind();
    }

    model.openGLRenderWindow.setActiveFramebuffer(publicAPI);
  };

  publicAPI.create = function (width, height) {
    model.glFramebuffer = model.context.createFramebuffer();
    model.glFramebuffer.width = width;
    model.glFramebuffer.height = height;
  };

  publicAPI.setColorBuffer = function (texture) {
    var attachment = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var gl = model.context;
    var glAttachment = gl.COLOR_ATTACHMENT0;

    if (attachment > 0) {
      if (model.openGLRenderWindow.getWebgl2()) {
        glAttachment += attachment;
      } else {
        vtkErrorMacro('Using multiple framebuffer attachments requires WebGL 2');
        return;
      }
    }

    model.colorTexture = texture;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, glAttachment, gl.TEXTURE_2D, texture.getHandle(), 0);
  };

  publicAPI.removeColorBuffer = function () {
    var attachment = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var gl = model.context;
    var glAttachment = gl.COLOR_ATTACHMENT0;

    if (attachment > 0) {
      if (model.openGLRenderWindow.getWebgl2()) {
        glAttachment += attachment;
      } else {
        vtkErrorMacro('Using multiple framebuffer attachments requires WebGL 2');
        return;
      }
    }

    gl.framebufferTexture2D(gl.FRAMEBUFFER, glAttachment, gl.TEXTURE_2D, null, 0);
  };

  publicAPI.setDepthBuffer = function (texture) {
    if (model.openGLRenderWindow.getWebgl2()) {
      var gl = model.context;
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture.getHandle(), 0);
    } else {
      vtkErrorMacro('Attaching depth buffer textures to fbo requires WebGL 2');
    }
  };

  publicAPI.removeDepthBuffer = function () {
    if (model.openGLRenderWindow.getWebgl2()) {
      var gl = model.context;
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, null, 0);
    } else {
      vtkErrorMacro('Attaching depth buffer textures to framebuffers requires WebGL 2');
    }
  };

  publicAPI.getGLFramebuffer = function () {
    return model.glFramebuffer;
  };

  publicAPI.setOpenGLRenderWindow = function (rw) {
    if (model.openGLRenderWindow === rw) {
      return;
    }

    publicAPI.releaseGraphicsResources();
    model.openGLRenderWindow = rw;
    model.context = null;

    if (rw) {
      model.context = model.openGLRenderWindow.getContext();
    }
  };

  publicAPI.releaseGraphicsResources = function () {
    if (model.glFramebuffer) {
      model.context.deleteFramebuffer(model.glFramebuffer);
    }

    if (model.colorTexture) {
      model.colorTexture.releaseGraphicsResources();
    }
  };

  publicAPI.getSize = function () {
    var size = [0, 0];

    if (model.glFramebuffer !== null) {
      size[0] = model.glFramebuffer.width;
      size[1] = model.glFramebuffer.height;
    }

    return size;
  };

  publicAPI.populateFramebuffer = function () {
    publicAPI.bind();
    var gl = model.context;
    var texture = vtkOpenGLTexture.newInstance();
    texture.setOpenGLRenderWindow(model.openGLRenderWindow);
    texture.setMinificationFilter(Filter.LINEAR);
    texture.setMagnificationFilter(Filter.LINEAR);
    texture.create2DFromRaw(model.glFramebuffer.width, model.glFramebuffer.height, 4, VtkDataTypes.UNSIGNED_CHAR, null);
    publicAPI.setColorBuffer(texture); // for now do not count on having a depth buffer texture
    // as they are not standard webgl 1

    model.depthTexture = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, model.depthTexture);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, model.glFramebuffer.width, model.glFramebuffer.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, model.depthTexture);
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  openGLRenderWindow: null,
  glFramebuffer: null,
  colorTexture: null,
  depthTexture: null,
  previousDrawBinding: 0,
  previousReadBinding: 0,
  previousDrawBuffer: 0,
  previousReadBuffer: 0,
  previousActiveFramebuffer: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  obj(publicAPI, model);
  setGet(publicAPI, model, ['colorTexture']); // For more macro methods, see "Sources/macros.js"
  // Object specific methods

  vtkFramebuffer(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = newInstance$1(extend, 'vtkFramebuffer'); // ----------------------------------------------------------------------------

var vtkOpenGLFramebuffer = {
  newInstance: newInstance,
  extend: extend
};

export { vtkOpenGLFramebuffer as default, extend, newInstance };
