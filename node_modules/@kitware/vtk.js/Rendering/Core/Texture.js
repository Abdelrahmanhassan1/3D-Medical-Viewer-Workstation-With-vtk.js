import macro from '../../macros.js';

// vtkTexture methods
// ----------------------------------------------------------------------------

function vtkTexture(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTexture');

  publicAPI.imageLoaded = function () {
    model.image.removeEventListener('load', publicAPI.imageLoaded);
    model.imageLoaded = true;
    publicAPI.modified();
  };

  publicAPI.setImage = function (image) {
    if (model.image === image) {
      return;
    }

    if (image !== null) {
      publicAPI.setInputData(null);
      publicAPI.setInputConnection(null);
    }

    model.image = image;
    model.imageLoaded = false;

    if (image.complete) {
      publicAPI.imageLoaded();
    } else {
      image.addEventListener('load', publicAPI.imageLoaded);
    }

    publicAPI.modified();
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  repeat: false,
  interpolate: false,
  edgeClamp: false,
  image: null,
  imageLoaded: false
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 6, 0);
  macro.get(publicAPI, model, ['imageLoaded']);
  macro.setGet(publicAPI, model, ['repeat', 'edgeClamp', 'interpolate', 'image']);
  vtkTexture(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkTexture'); // ----------------------------------------------------------------------------

var vtkTexture$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkTexture$1 as default, extend, newInstance };
