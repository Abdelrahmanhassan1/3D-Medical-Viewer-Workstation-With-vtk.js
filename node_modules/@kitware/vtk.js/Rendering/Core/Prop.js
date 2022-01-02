import macro from '../../macros.js';

function notImplemented(method) {
  return function () {
    return macro.vtkErrorMacro("vtkProp::".concat(method, " - NOT IMPLEMENTED"));
  };
} // ----------------------------------------------------------------------------
// vtkProp methods
// ----------------------------------------------------------------------------


function vtkProp(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkProp');

  publicAPI.getMTime = function () {
    var m1 = model.mtime;

    for (var index = 0; index < model.textures.length; ++index) {
      var m2 = model.textures[index].getMTime();

      if (m2 > m1) {
        m1 = m2;
      }
    }

    return m1;
  };

  publicAPI.getNestedProps = function () {
    return null;
  };

  publicAPI.getActors = function () {
    return [];
  };

  publicAPI.getActors2D = function () {
    return [];
  };

  publicAPI.getVolumes = function () {
    return [];
  };

  publicAPI.pick = notImplemented('pick');
  publicAPI.hasKey = notImplemented('hasKey');

  publicAPI.getNestedVisibility = function () {
    return model.visibility && (!model.parentProp || model.parentProp.getNestedVisibility());
  };

  publicAPI.getNestedPickable = function () {
    return model.pickable && (!model.parentProp || model.parentProp.getNestedPickable());
  };

  publicAPI.getNestedDragable = function () {
    return model.dragable && (!model.parentProp || model.parentProp.getNestedDragable());
  };

  publicAPI.getRedrawMTime = function () {
    return model.mtime;
  };

  publicAPI.setEstimatedRenderTime = function (t) {
    model.estimatedRenderTime = t;
    model.savedEstimatedRenderTime = t;
  };

  publicAPI.restoreEstimatedRenderTime = function () {
    model.estimatedRenderTime = model.savedEstimatedRenderTime;
  };

  publicAPI.addEstimatedRenderTime = function (t) {
    model.estimatedRenderTime += t;
  };

  publicAPI.setAllocatedRenderTime = function (t) {
    model.allocatedRenderTime = t;
    model.savedEstimatedRenderTime = model.estimatedRenderTime;
    model.estimatedRenderTime = 0;
  };

  publicAPI.getSupportsSelection = function () {
    return false;
  };

  publicAPI.getTextures = function () {
    return model.textures;
  };

  publicAPI.hasTexture = function (texture) {
    return model.textures.indexOf(texture) !== -1;
  };

  publicAPI.addTexture = function (texture) {
    if (texture && !publicAPI.hasTexture(texture)) {
      model.textures = model.textures.concat(texture);
      publicAPI.modified();
    }
  };

  publicAPI.removeTexture = function (texture) {
    var newTextureList = model.textures.filter(function (item) {
      return item !== texture;
    });

    if (model.textures.length !== newTextureList.length) {
      model.textures = newTextureList;
      publicAPI.modified();
    }
  };

  publicAPI.removeAllTextures = function () {
    model.textures = [];
    publicAPI.modified();
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  visibility: true,
  pickable: true,
  dragable: true,
  useBounds: true,
  allocatedRenderTime: 10,
  estimatedRenderTime: 0,
  savedEstimatedRenderTime: 0,
  renderTimeMultiplier: 1,
  paths: null,
  textures: []
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['estimatedRenderTime', 'allocatedRenderTime']);
  macro.setGet(publicAPI, model, ['visibility', 'pickable', 'dragable', 'useBounds', 'renderTimeMultiplier', 'parentProp']); // Object methods

  vtkProp(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkProp'); // ----------------------------------------------------------------------------

var vtkProp$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkProp$1 as default, extend, newInstance };
