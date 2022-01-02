import macro from '../../macros.js';
import { M as createUninitializedBounds } from '../../Common/Core/Math/index.js';
import Constants from './VolumeMapper/Constants.js';
import vtkAbstractMapper from './AbstractMapper.js';

var BlendMode = Constants.BlendMode,
    FilterMode = Constants.FilterMode; // ----------------------------------------------------------------------------
// vtkVolumeMapper methods
// ----------------------------------------------------------------------------

function vtkVolumeMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkVolumeMapper');

  publicAPI.getBounds = function () {
    var input = publicAPI.getInputData();

    if (!input) {
      model.bounds = createUninitializedBounds();
    } else {
      if (!model.static) {
        publicAPI.update();
      }

      model.bounds = input.getBounds();
    }

    return model.bounds;
  };

  publicAPI.update = function () {
    publicAPI.getInputData();
  };

  publicAPI.setBlendModeToComposite = function () {
    publicAPI.setBlendMode(BlendMode.COMPOSITE_BLEND);
  };

  publicAPI.setBlendModeToMaximumIntensity = function () {
    publicAPI.setBlendMode(BlendMode.MAXIMUM_INTENSITY_BLEND);
  };

  publicAPI.setBlendModeToMinimumIntensity = function () {
    publicAPI.setBlendMode(BlendMode.MINIMUM_INTENSITY_BLEND);
  };

  publicAPI.setBlendModeToAverageIntensity = function () {
    publicAPI.setBlendMode(BlendMode.AVERAGE_INTENSITY_BLEND);
  };

  publicAPI.setBlendModeToAdditiveIntensity = function () {
    publicAPI.setBlendMode(BlendMode.ADDITIVE_INTENSITY_BLEND);
  };

  publicAPI.getBlendModeAsString = function () {
    return macro.enumToString(BlendMode, model.blendMode);
  };

  publicAPI.setAverageIPScalarRange = function (min, max) {
    console.warn('setAverageIPScalarRange is deprecated use setIpScalarRange');
    publicAPI.setIpScalarRange(min, max);
  };

  publicAPI.getFilterModeAsString = function () {
    return macro.enumToString(FilterMode, model.filterMode);
  };

  publicAPI.setFilterModeToOff = function () {
    publicAPI.setFilterMode(FilterMode.OFF);
  };

  publicAPI.setFilterModeToNormalized = function () {
    publicAPI.setFilterMode(FilterMode.NORMALIZED);
  };

  publicAPI.setFilterModeToRaw = function () {
    publicAPI.setFilterMode(FilterMode.RAW);
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
// TODO: what values to use for averageIPScalarRange to get GLSL to use max / min values like [-Math.inf, Math.inf]?


var DEFAULT_VALUES = {
  bounds: [1, -1, 1, -1, 1, -1],
  sampleDistance: 1.0,
  imageSampleDistance: 1.0,
  maximumSamplesPerRay: 1000,
  autoAdjustSampleDistances: true,
  blendMode: BlendMode.COMPOSITE_BLEND,
  ipScalarRange: [-1000000.0, 1000000.0],
  filterMode: FilterMode.OFF,
  // ignored by WebGL so no behavior change
  preferSizeOverAccuracy: false // Whether to use halfFloat representation of float, when it is inaccurate

}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkAbstractMapper.extend(publicAPI, model, initialValues); // Build VTK API

  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 1, 0);
  macro.setGet(publicAPI, model, ['sampleDistance', 'imageSampleDistance', 'maximumSamplesPerRay', 'autoAdjustSampleDistances', 'blendMode', 'filterMode', 'preferSizeOverAccuracy']);
  macro.setGetArray(publicAPI, model, ['ipScalarRange'], 2);
  macro.event(publicAPI, model, 'lightingActivated'); // Object methods

  vtkVolumeMapper(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkVolumeMapper'); // ----------------------------------------------------------------------------

var vtkVolumeMapper$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkVolumeMapper$1 as default, extend, newInstance };
