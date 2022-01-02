import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import macro from '../../macros.js';
import vtkAbstractWidgetFactory from '../Core/AbstractWidgetFactory.js';
import vtkImplicitPlaneRepresentation from '../Representations/ImplicitPlaneRepresentation.js';
import vtkLineManipulator from '../Manipulators/LineManipulator.js';
import vtkTrackballManipulator from '../Manipulators/TrackballManipulator.js';
import vtkPlanePointManipulator from '../Manipulators/PlaneManipulator.js';
import { ViewTypes } from '../Core/WidgetManager/Constants.js';

// Widget linked to a view
// ----------------------------------------------------------------------------

function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkPlaneWidget');
  var isDragging = null;

  publicAPI.setDisplayCallback = function (callback) {
    return model.representations[0].setDisplayCallback(callback);
  };

  publicAPI.updateCursor = function () {
    switch (model.activeState.getUpdateMethodName()) {
      case 'updateFromOrigin':
        model.apiSpecificRenderWindow.setCursor('crosshair');
        break;

      case 'updateFromPlane':
        model.apiSpecificRenderWindow.setCursor('move');
        break;

      case 'updateFromNormal':
        model.apiSpecificRenderWindow.setCursor('alias');
        break;

      default:
        model.apiSpecificRenderWindow.setCursor('grabbing');
        break;
    }
  };

  publicAPI.handleLeftButtonPress = function (callData) {
    if (!model.activeState || !model.activeState.getActive() || !model.pickable) {
      return macro.VOID;
    }

    isDragging = true;
    model.lineManipulator.setOrigin(model.widgetState.getOrigin());
    model.planeManipulator.setOrigin(model.widgetState.getOrigin());
    model.trackballManipulator.reset(callData); // setup trackball delta

    model.interactor.requestAnimation(publicAPI);
    publicAPI.invokeStartInteractionEvent();
    return macro.EVENT_ABORT;
  };

  publicAPI.handleMouseMove = function (callData) {
    if (isDragging && model.pickable) {
      return publicAPI.handleEvent(callData);
    }

    return macro.VOID;
  };

  publicAPI.handleLeftButtonRelease = function () {
    if (isDragging && model.pickable) {
      publicAPI.invokeEndInteractionEvent();
      model.interactor.cancelAnimation(publicAPI);
    }

    isDragging = false;
    model.widgetState.deactivate();
  };

  publicAPI.handleEvent = function (callData) {
    if (model.pickable && model.activeState && model.activeState.getActive()) {
      publicAPI[model.activeState.getUpdateMethodName()](callData);
      publicAPI.invokeInteractionEvent();
      return macro.EVENT_ABORT;
    }

    return macro.VOID;
  }; // --------------------------------------------------------------------------
  // Event coordinate translation
  // --------------------------------------------------------------------------


  publicAPI.updateFromOrigin = function (callData) {
    model.planeManipulator.setNormal(model.widgetState.getNormal());
    var worldCoords = model.planeManipulator.handleEvent(callData, model.apiSpecificRenderWindow);

    if (model.widgetState.containsPoint(worldCoords)) {
      model.activeState.setOrigin(worldCoords);
    }
  }; // --------------------------------------------------------------------------


  publicAPI.updateFromPlane = function (callData) {
    var _model$widgetState;

    // Move origin along normal axis
    model.lineManipulator.setNormal(model.activeState.getNormal());
    var worldCoords = model.lineManipulator.handleEvent(callData, model.apiSpecificRenderWindow);

    if ((_model$widgetState = model.widgetState).containsPoint.apply(_model$widgetState, _toConsumableArray(worldCoords))) {
      model.activeState.setOrigin(worldCoords);
    }
  }; // --------------------------------------------------------------------------


  publicAPI.updateFromNormal = function (callData) {
    model.trackballManipulator.setNormal(model.activeState.getNormal());
    var newNormal = model.trackballManipulator.handleEvent(callData, model.apiSpecificRenderWindow);
    model.activeState.setNormal(newNormal);
  }; // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------


  model.lineManipulator = vtkLineManipulator.newInstance();
  model.planeManipulator = vtkPlanePointManipulator.newInstance();
  model.trackballManipulator = vtkTrackballManipulator.newInstance();
} // ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------


function vtkImplicitPlaneWidget(publicAPI, model) {
  model.classHierarchy.push('vtkPlaneWidget'); // --- Widget Requirement ---------------------------------------------------

  model.widgetState = vtkImplicitPlaneRepresentation.generateState();
  model.behavior = widgetBehavior;
  model.methodsToLink = ['representationStyle', 'sphereResolution', 'handleSizeRatio', 'axisScale', 'normalVisible', 'originVisible', 'planeVisible', 'outlineVisible'];

  publicAPI.getRepresentationsForViewType = function (viewType) {
    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
      case ViewTypes.VOLUME:
      default:
        return [{
          builder: vtkImplicitPlaneRepresentation
        }];
    }
  };
} // ----------------------------------------------------------------------------


var DEFAULT_VALUES = {}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  vtkImplicitPlaneWidget(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkImplicitPlaneWidget'); // ----------------------------------------------------------------------------

var vtkImplicitPlaneWidget$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkImplicitPlaneWidget$1 as default, extend, newInstance };
