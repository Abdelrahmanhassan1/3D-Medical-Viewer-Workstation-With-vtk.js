import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import _slicedToArray from '@babel/runtime/helpers/slicedToArray';
import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import vtkRenderer from '../../Rendering/Core/Renderer.js';
import Constants from './OrientationMarkerWidget/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var vtkErrorMacro = macro.vtkErrorMacro;
var Corners = Constants.Corners; // ----------------------------------------------------------------------------
// vtkOrientationMarkerWidget
// ----------------------------------------------------------------------------

function vtkOrientationMarkerWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOrientationMarkerWidget');

  var superClass = _objectSpread({}, publicAPI); // Private variables


  var previousCameraInput = [];
  var selfRenderer = vtkRenderer.newInstance();
  var resizeObserver = new ResizeObserver(function (entries) {
    if (entries.length === 1) {
      publicAPI.updateViewport();
    }
  });
  var interactorUnsubscribe = null;
  var selfSubscription = null;

  publicAPI.computeViewport = function () {
    var _model$interactor$get = model.interactor.getView().getSize(),
        _model$interactor$get2 = _slicedToArray(_model$interactor$get, 2),
        viewXSize = _model$interactor$get2[0],
        viewYSize = _model$interactor$get2[1];

    var minViewSize = Math.min(viewXSize, viewYSize);
    var pixelSize = model.viewportSize * minViewSize; // clamp pixel size

    pixelSize = Math.max(Math.min(model.minPixelSize, minViewSize), Math.min(model.maxPixelSize, pixelSize));
    var xFrac = pixelSize / viewXSize;
    var yFrac = pixelSize / viewYSize; // [left bottom right top]

    switch (model.viewportCorner) {
      case Corners.TOP_LEFT:
        return [0, 1 - yFrac, xFrac, 1];

      case Corners.TOP_RIGHT:
        return [1 - xFrac, 1 - yFrac, 1, 1];

      case Corners.BOTTOM_LEFT:
        return [0, 0, xFrac, yFrac];

      case Corners.BOTTOM_RIGHT:
        return [1 - xFrac, 0, 1, yFrac];

      default:
        vtkErrorMacro('Invalid widget corner');
        return null;
    }
  };

  publicAPI.updateViewport = function () {
    selfRenderer.setViewport.apply(selfRenderer, _toConsumableArray(publicAPI.computeViewport()));
    model.interactor.render();
  };

  publicAPI.updateMarkerOrientation = function () {
    var currentCamera = model.interactor.findPokedRenderer().getActiveCamera();

    if (!currentCamera) {
      return;
    }

    var position = currentCamera.getReferenceByName('position');
    var focalPoint = currentCamera.getReferenceByName('focalPoint');
    var viewUp = currentCamera.getReferenceByName('viewUp');

    if (previousCameraInput[0] !== position[0] || previousCameraInput[1] !== position[1] || previousCameraInput[2] !== position[2] || previousCameraInput[3] !== focalPoint[0] || previousCameraInput[4] !== focalPoint[1] || previousCameraInput[5] !== focalPoint[2] || previousCameraInput[6] !== viewUp[0] || previousCameraInput[7] !== viewUp[1] || previousCameraInput[8] !== viewUp[2]) {
      previousCameraInput[0] = position[0];
      previousCameraInput[1] = position[1];
      previousCameraInput[2] = position[2];
      previousCameraInput[3] = focalPoint[0];
      previousCameraInput[4] = focalPoint[1];
      previousCameraInput[5] = focalPoint[2];
      previousCameraInput[6] = viewUp[0];
      previousCameraInput[7] = viewUp[1];
      previousCameraInput[8] = viewUp[2];
      var activeCamera = selfRenderer.getActiveCamera();
      activeCamera.setPosition(position[0], position[1], position[2]);
      activeCamera.setFocalPoint(focalPoint[0], focalPoint[1], focalPoint[2]);
      activeCamera.setViewUp(viewUp[0], viewUp[1], viewUp[2]);
      selfRenderer.resetCamera();
    }
  };
  /**
   * Enables/Disables the orientation marker.
   */


  publicAPI.setEnabled = function (enabling) {
    if (enabling) {
      if (model.enabled) {
        return;
      }

      if (!model.actor) {
        vtkErrorMacro('Must set actor before enabling orientation marker.');
        return;
      }

      if (!model.interactor) {
        vtkErrorMacro('Must set interactor before enabling orientation marker.');
        return;
      }

      var renderWindow = model.interactor.findPokedRenderer().getRenderWindow();
      renderWindow.addRenderer(selfRenderer);

      if (renderWindow.getNumberOfLayers() < 2) {
        renderWindow.setNumberOfLayers(2);
      } // Highest number is foreground


      selfRenderer.setLayer(renderWindow.getNumberOfLayers() - 1);
      selfRenderer.setInteractive(false);
      selfRenderer.addViewProp(model.actor);
      model.actor.setVisibility(true);

      var _model$interactor$onA = model.interactor.onAnimation(publicAPI.updateMarkerOrientation);

      interactorUnsubscribe = _model$interactor$onA.unsubscribe;
      resizeObserver.observe(model.interactor.getView().getCanvas());
      publicAPI.updateViewport();
      publicAPI.updateMarkerOrientation();
      model.enabled = true;
    } else {
      if (!model.enabled) {
        return;
      }

      model.enabled = false;
      resizeObserver.disconnect();
      interactorUnsubscribe();
      interactorUnsubscribe = null;
      model.actor.setVisibility(false);
      selfRenderer.removeViewProp(model.actor);

      var _renderWindow = model.interactor.findPokedRenderer().getRenderWindow();

      if (_renderWindow) {
        _renderWindow.removeRenderer(selfRenderer);
      }
    }

    publicAPI.modified();
  };
  /**
   * Sets the viewport corner.
   */


  publicAPI.setViewportCorner = function (corner) {
    if (corner === model.viewportCorner) {
      return;
    }

    model.viewportCorner = corner;

    if (model.enabled) {
      publicAPI.updateViewport();
    }
  };
  /**
   * Sets the viewport size.
   */


  publicAPI.setViewportSize = function (sizeFactor) {
    var viewportSize = Math.min(1, Math.max(0, sizeFactor));

    if (viewportSize === model.viewportSize) {
      return;
    }

    model.viewportSize = viewportSize;

    if (model.enabled) {
      publicAPI.updateViewport();
    }
  };

  publicAPI.setActor = function (actor) {
    var previousState = model.enabled;
    publicAPI.setEnabled(false);
    model.actor = actor;
    publicAPI.setEnabled(previousState);
  };

  publicAPI.getRenderer = function () {
    return selfRenderer;
  };

  publicAPI.delete = function () {
    superClass.delete();

    if (selfSubscription) {
      selfSubscription.unsubscribe();
      selfSubscription = null;
    }

    if (interactorUnsubscribe) {
      interactorUnsubscribe();
      interactorUnsubscribe = null;
    }

    resizeObserver.disconnect();
  }; // --------------------------------------------------------------------------
  // update viewport whenever we are updated


  selfSubscription = publicAPI.onModified(publicAPI.updateViewport);
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  // actor: null,
  // interactor: null,
  viewportCorner: Constants.Corners.BOTTOM_LEFT,
  viewportSize: 0.2,
  minPixelSize: 50,
  maxPixelSize: 200
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['enabled', 'viewportCorner', 'viewportSize']); // NOTE: setting these while the widget is enabled will
  // not update the widget.

  macro.setGet(publicAPI, model, ['interactor', 'minPixelSize', 'maxPixelSize']);
  macro.get(publicAPI, model, ['actor']); // Object methods

  vtkOrientationMarkerWidget(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkOrientationMarkerWidget'); // ----------------------------------------------------------------------------

var vtkOrientationMarkerWidget$1 = _objectSpread({
  newInstance: newInstance,
  extend: extend
}, Constants);

export { DEFAULT_VALUES, vtkOrientationMarkerWidget$1 as default, extend, newInstance };
