import _defineProperty from '@babel/runtime/helpers/defineProperty';
import _slicedToArray from '@babel/runtime/helpers/slicedToArray';
import { newInstance as newInstance$1, obj, event, setGet } from '../../macros.js';
import vtkCompositeMouseManipulator from './CompositeMouseManipulator.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var OUTSIDE_BOUNDS = [-2, -1, -2, -1];
var DEFAULT_STYLE = {
  position: 'absolute',
  zIndex: 1,
  border: '2px solid #F44336',
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  borderRadius: '4px',
  boxSizing: 'border-box'
};

function applyStyle(element, style) {
  Object.keys(style).forEach(function (name) {
    element.style[name] = style[name];
  });
} // ----------------------------------------------------------------------------
// vtkMouseBoxSelectionManipulator methods
// ----------------------------------------------------------------------------


function vtkMouseBoxSelectionManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseBoxSelectionManipulator'); // Private variable

  var view = null;
  var container = null;
  var previousPosition = null;
  var currentPosition = null;
  var div = null;
  var inDOM = false;

  function getBounds() {
    if (!previousPosition || !currentPosition) {
      return OUTSIDE_BOUNDS;
    }

    return [Math.min(previousPosition.x, currentPosition.x), Math.max(previousPosition.x, currentPosition.x), Math.min(previousPosition.y, currentPosition.y), Math.max(previousPosition.y, currentPosition.y)];
  }

  function applyStyleToDiv() {
    if (!view || !container) {
      return;
    }

    var _view$getSize = view.getSize(),
        _view$getSize2 = _slicedToArray(_view$getSize, 2),
        viewWidth = _view$getSize2[0],
        viewHeight = _view$getSize2[1];

    var _container$getBoundin = container.getBoundingClientRect(),
        width = _container$getBoundin.width,
        height = _container$getBoundin.height,
        top = _container$getBoundin.top,
        left = _container$getBoundin.left;

    var _getBounds = getBounds(),
        _getBounds2 = _slicedToArray(_getBounds, 4),
        xMin = _getBounds2[0],
        xMax = _getBounds2[1],
        yMin = _getBounds2[2],
        yMax = _getBounds2[3];

    var xShift = left + window.scrollX;
    var yShift = top + window.scrollY;
    div.style.left = "".concat(xShift + width * xMin / viewWidth, "px");
    div.style.top = "".concat(yShift + height - height * yMax / viewHeight, "px");
    div.style.width = "".concat(width * (xMax - xMin) / viewWidth, "px");
    div.style.height = "".concat(height * (yMax - yMin) / viewHeight, "px");
  } //-------------------------------------------------------------------------


  publicAPI.onButtonDown = function (interactor, renderer, position) {
    previousPosition = position;

    if (model.renderSelection) {
      // Need window size and location to convert to style
      if (!view) {
        view = interactor.getView();
      }

      if (!container && view) {
        container = view.getContainer();
      }

      if (!div) {
        div = document.createElement('div');
        applyStyle(div, model.selectionStyle);
      }

      applyStyleToDiv();

      if (container && !inDOM) {
        inDOM = true;
        container.appendChild(div);
      }
    }
  }; //-------------------------------------------------------------------------


  publicAPI.onMouseMove = function (interactor, renderer, position) {
    if (!previousPosition) {
      return;
    }

    if (!position) {
      return;
    }

    currentPosition = position;
    publicAPI.invokeBoxSelectInput({
      view: view,
      container: container,
      selection: getBounds()
    });

    if (model.renderSelection) {
      applyStyleToDiv();
    }
  }; //-------------------------------------------------------------------------


  publicAPI.onButtonUp = function (interactor, renderer) {
    if (!previousPosition || !currentPosition) {
      return;
    }

    publicAPI.invokeBoxSelectChange({
      view: view,
      container: container,
      selection: getBounds()
    });

    if (inDOM) {
      div.parentElement.removeChild(div);
      inDOM = false;
    } // clear positions


    view = null;
    container = null;
    previousPosition = null;
    currentPosition = null;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


function DEFAULT_VALUES(initialValues) {
  return _objectSpread(_objectSpread({
    renderSelection: true
  }, initialValues), {}, {
    selectionStyle: _objectSpread(_objectSpread({}, DEFAULT_STYLE), initialValues.selectionStyle)
  });
} // ----------------------------------------------------------------------------


function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES(initialValues)); // Inheritance

  obj(publicAPI, model);
  vtkCompositeMouseManipulator.extend(publicAPI, model, initialValues);
  event(publicAPI, model, 'BoxSelectChange'); // Trigger at release

  event(publicAPI, model, 'BoxSelectInput'); // Trigger while dragging

  setGet(publicAPI, model, ['renderSelection', 'selectionStyle']); // Object specific methods

  vtkMouseBoxSelectionManipulator(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = newInstance$1(extend, 'vtkMouseBoxSelectionManipulator'); // ----------------------------------------------------------------------------

var vtkMouseBoxSelectorManipulator = {
  newInstance: newInstance,
  extend: extend
};

export { vtkMouseBoxSelectorManipulator as default, extend, newInstance };
