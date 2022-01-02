import macro from '../../macros.js';
import vtkCompositeMouseManipulator from './CompositeMouseManipulator.js';

// vtkMouseRangeManipulator methods
// ----------------------------------------------------------------------------

function vtkMouseRangeManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseRangeManipulator'); // Keep track of delta that is below the value
  // of one step to progressively increment it

  var incrementalDelta = new Map(); // Internal methods
  //-------------------------------------------------------------------------

  function scaleDeltaToRange(listener, normalizedDelta) {
    return normalizedDelta * ((listener.max - listener.min) / (listener.step + 1));
  } //-------------------------------------------------------------------------


  function processDelta(listener, delta) {
    var oldValue = listener.getValue(); // Apply scale and cached delta to current delta

    var newDelta = delta * listener.scale + incrementalDelta.get(listener);
    var value = oldValue + newDelta; // Compute new value based on step

    var difference = value - listener.min;
    var stepsToDifference = Math.round(difference / listener.step);
    value = listener.min + listener.step * stepsToDifference;
    value = Math.max(value, listener.min);
    value = Math.min(value, listener.max);

    if (value !== oldValue) {
      // Update value
      listener.setValue(value);
      incrementalDelta.set(listener, 0);
    } else if (value === listener.min && newDelta < 0 || value === listener.max && newDelta > 0) {
      // Do not allow incremental delta to go past range
      incrementalDelta.set(listener, 0);
    } else {
      // Store delta for the next iteration
      incrementalDelta.set(listener, newDelta);
    }
  } // Public API methods
  // min:number = minimum allowable value
  // max:number = maximum allowable value
  // step:number = value per step -- smaller = more steps over a given distance, larger = fewer steps over a given distance
  // getValue:fn = function that returns current value
  // setValue:fn = function to set value
  // scale:number = scale value is applied to mouse event to allow users accelerate or decelerate delta without emitting more events
  //-------------------------------------------------------------------------


  publicAPI.setHorizontalListener = function (min, max, step, getValue, setValue) {
    var scale = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
    var getFn = Number.isFinite(getValue) ? function () {
      return getValue;
    } : getValue;
    model.horizontalListener = {
      min: min,
      max: max,
      step: step,
      getValue: getFn,
      setValue: setValue,
      scale: scale
    };
    incrementalDelta.set(model.horizontalListener, 0);
    publicAPI.modified();
  }; //-------------------------------------------------------------------------


  publicAPI.setVerticalListener = function (min, max, step, getValue, setValue) {
    var scale = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
    var getFn = Number.isFinite(getValue) ? function () {
      return getValue;
    } : getValue;
    model.verticalListener = {
      min: min,
      max: max,
      step: step,
      getValue: getFn,
      setValue: setValue,
      scale: scale
    };
    incrementalDelta.set(model.verticalListener, 0);
    publicAPI.modified();
  }; //-------------------------------------------------------------------------


  publicAPI.setScrollListener = function (min, max, step, getValue, setValue) {
    var scale = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
    var getFn = Number.isFinite(getValue) ? function () {
      return getValue;
    } : getValue;
    model.scrollListener = {
      min: min,
      max: max,
      step: step,
      getValue: getFn,
      setValue: setValue,
      scale: scale
    };
    incrementalDelta.set(model.scrollListener, 0);
    publicAPI.modified();
  }; //-------------------------------------------------------------------------


  publicAPI.removeHorizontalListener = function () {
    if (model.verticalListener) {
      incrementalDelta.delete(model.verticalListener);
      delete model.verticalListener;
      publicAPI.modified();
    }
  }; //-------------------------------------------------------------------------


  publicAPI.removeVerticalListener = function () {
    if (model.horizontalListener) {
      incrementalDelta.delete(model.horizontalListener);
      delete model.horizontalListener;
      publicAPI.modified();
    }
  }; //-------------------------------------------------------------------------


  publicAPI.removeScrollListener = function () {
    if (model.scrollListener) {
      incrementalDelta.delete(model.scrollListener);
      delete model.scrollListener;
      publicAPI.modified();
    }
  }; //-------------------------------------------------------------------------


  publicAPI.removeAllListeners = function () {
    publicAPI.removeHorizontalListener();
    publicAPI.removeVerticalListener();
    publicAPI.removeScrollListener();
  }; //-------------------------------------------------------------------------


  publicAPI.onButtonDown = function (interactor, renderer, position) {
    model.previousPosition = position;
    var glRenderWindow = interactor.getView(); // Ratio is the dom size vs renderwindow size

    var ratio = glRenderWindow.getContainerSize()[0] / glRenderWindow.getSize()[0]; // Get proper pixel range used by viewport in rw size space

    var size = glRenderWindow.getViewportSize(renderer); // rescale size to match mouse event position

    model.containerSize = size.map(function (v) {
      return v * ratio;
    });
  }; //-------------------------------------------------------------------------


  publicAPI.onMouseMove = function (interactor, renderer, position) {
    if (!model.verticalListener && !model.horizontalListener) {
      return;
    }

    if (!position) {
      return;
    }

    if (model.horizontalListener) {
      var dxNorm = (position.x - model.previousPosition.x) / model.containerSize[0];
      var dx = scaleDeltaToRange(model.horizontalListener, dxNorm);
      processDelta(model.horizontalListener, dx);
    }

    if (model.verticalListener) {
      var dyNorm = (position.y - model.previousPosition.y) / model.containerSize[1];
      var dy = scaleDeltaToRange(model.verticalListener, dyNorm);
      processDelta(model.verticalListener, dy);
    }

    model.previousPosition = position;
  }; //-------------------------------------------------------------------------


  publicAPI.onScroll = function (interactor, renderer, delta) {
    if (!model.scrollListener || !delta) {
      return;
    }

    processDelta(model.scrollListener, delta * model.scrollListener.step);
  };

  publicAPI.onStartScroll = publicAPI.onScroll;
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  horizontalListener: null,
  verticalListener: null,
  scrollListener: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  macro.obj(publicAPI, model);
  vtkCompositeMouseManipulator.extend(publicAPI, model, initialValues); // Object specific methods

  vtkMouseRangeManipulator(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkMouseRangeManipulator'); // ----------------------------------------------------------------------------

var vtkMouseRangeManipulator$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkMouseRangeManipulator$1 as default, extend, newInstance };
