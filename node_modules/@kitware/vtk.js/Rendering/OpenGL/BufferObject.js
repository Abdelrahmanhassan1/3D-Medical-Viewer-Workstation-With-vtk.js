import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import Constants from './BufferObject/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var ObjectType = Constants.ObjectType; // ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

var STATIC = {}; // ----------------------------------------------------------------------------
// vtkOpenGLBufferObject methods
// ----------------------------------------------------------------------------

function vtkOpenGLBufferObject(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLBufferObject'); // Class-specific private functions

  function convertType(type) {
    switch (type) {
      case ObjectType.ELEMENT_ARRAY_BUFFER:
        return model.context.ELEMENT_ARRAY_BUFFER;

      case ObjectType.TEXTURE_BUFFER:
        if ('TEXTURE_BUFFER' in model.context) {
          return model.context.TEXTURE_BUFFER;
        }

      /* eslint-disable no-fallthrough */
      // Intentional fallthrough in case there is no TEXTURE_BUFFER in WebGL

      default:
      /* eslint-enable no-fallthrough */

      case ObjectType.ARRAY_BUFFER:
        return model.context.ARRAY_BUFFER;
    }
  }

  var internalType = null;
  var internalHandle = null;
  var dirty = true;
  var error = ''; // Public API methods

  publicAPI.getType = function () {
    return internalType;
  };

  publicAPI.setType = function (value) {
    internalType = value;
  };

  publicAPI.getHandle = function () {
    return internalHandle;
  };

  publicAPI.isReady = function () {
    return dirty === false;
  };

  publicAPI.generateBuffer = function (type) {
    var objectTypeGL = convertType(type);

    if (internalHandle === null) {
      internalHandle = model.context.createBuffer();
      internalType = type;
    }

    return convertType(internalType) === objectTypeGL;
  };

  publicAPI.upload = function (data, type) {
    // buffer, size, type
    var alreadyGenerated = publicAPI.generateBuffer(type);

    if (!alreadyGenerated) {
      error = 'Trying to upload array buffer to incompatible buffer.';
      return false;
    }

    model.context.bindBuffer(convertType(internalType), internalHandle);
    model.context.bufferData(convertType(internalType), data, model.context.STATIC_DRAW);
    dirty = false;
    return true;
  };

  publicAPI.bind = function () {
    if (!internalHandle) {
      return false;
    }

    model.context.bindBuffer(convertType(internalType), internalHandle);
    return true;
  };

  publicAPI.release = function () {
    if (!internalHandle) {
      return false;
    }

    model.context.bindBuffer(convertType(internalType), null);
    return true;
  };

  publicAPI.releaseGraphicsResources = function () {
    if (internalHandle !== null) {
      model.context.bindBuffer(convertType(internalType), null);
      model.context.deleteBuffer(internalHandle);
      internalHandle = null;
    }
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

  publicAPI.getError = function () {
    return error;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  objectType: ObjectType.ARRAY_BUFFER,
  openGLRenderWindow: null,
  context: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Object methods

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['openGLRenderWindow']);
  vtkOpenGLBufferObject(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend); // ----------------------------------------------------------------------------

var vtkBufferObject = _objectSpread(_objectSpread({
  newInstance: newInstance,
  extend: extend
}, STATIC), Constants);

export { STATIC, vtkBufferObject as default, extend, newInstance };
