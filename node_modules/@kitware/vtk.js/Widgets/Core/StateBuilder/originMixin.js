import _slicedToArray from '@babel/runtime/helpers/slicedToArray';
import macro from '../../../macros.js';

function vtkOriginMixin(publicAPI, model) {
  publicAPI.translate = function (dx, dy, dz) {
    var _publicAPI$getOriginB = publicAPI.getOriginByReference(),
        _publicAPI$getOriginB2 = _slicedToArray(_publicAPI$getOriginB, 3),
        x = _publicAPI$getOriginB2[0],
        y = _publicAPI$getOriginB2[1],
        z = _publicAPI$getOriginB2[2];

    publicAPI.setOrigin(x + dx, y + dy, z + dz);
  };
} // ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  origin: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGetArray(publicAPI, model, ['origin'], 3);
  vtkOriginMixin(publicAPI);
} // ----------------------------------------------------------------------------

var origin = {
  extend: extend
};

export { origin as default, extend };
