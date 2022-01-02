import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import vtkAbstractWidget from './AbstractWidget.js';
import vtkSphereHandleRepresentation from './SphereHandleRepresentation.js';
import vtkHandleRepresentation from './HandleRepresentation.js';
import Constants from './HandleWidget/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var VOID = macro.VOID,
    EVENT_ABORT = macro.EVENT_ABORT;
var InteractionState = vtkHandleRepresentation.InteractionState;
var WidgetState = Constants.WidgetState; // ----------------------------------------------------------------------------
// vtkHandleWidget methods
// ----------------------------------------------------------------------------

function vtkHandleWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkHandleWidget');

  function genericAction() {
    publicAPI.setCursor(model.widgetRep.getInteractionState());
    model.widgetRep.highlight(1); // publicAPI.startInteraction();

    publicAPI.invokeStartInteractionEvent();
    publicAPI.render();
  } // Overridden method


  publicAPI.createDefaultRepresentation = function () {
    if (!model.widgetRep) {
      model.widgetRep = vtkSphereHandleRepresentation.newInstance();
    }
  };

  publicAPI.handleMouseMove = function (callData) {
    return publicAPI.moveAction(callData);
  };

  publicAPI.handleLeftButtonPress = function (callData) {
    return publicAPI.selectAction(callData);
  };

  publicAPI.handleLeftButtonRelease = function (callData) {
    return publicAPI.endSelectAction(callData);
  };

  publicAPI.handleMiddleButtonPress = function (callData) {
    return publicAPI.translateAction(callData);
  };

  publicAPI.handleMiddleButtonRelease = function (callData) {
    return publicAPI.endSelectAction(callData);
  };

  publicAPI.handleRightButtonPress = function (callData) {
    return publicAPI.scaleAction(callData);
  };

  publicAPI.handleRightButtonRelease = function (callData) {
    return publicAPI.endSelectAction(callData);
  };

  publicAPI.setCursor = function (state) {
    switch (state) {
      case InteractionState.OUTSIDE:
        {
          model.interactor.getView().setCursor('default');
          break;
        }

      default:
        {
          model.interactor.getView().setCursor('pointer');
        }
    }
  };

  publicAPI.selectAction = function (callData) {
    var position = [callData.position.x, callData.position.y];
    model.widgetRep.computeInteractionState(position);

    if (model.widgetRep.getInteractionState() === InteractionState.OUTSIDE) {
      return VOID;
    }

    model.widgetRep.startComplexWidgetInteraction(position);
    model.widgetState = WidgetState.ACTIVE;
    model.widgetRep.setInteractionState(InteractionState.SELECTING);
    genericAction();
    return EVENT_ABORT;
  };

  publicAPI.translateAction = function (callData) {
    var position = [callData.position.x, callData.position.y];
    model.widgetRep.computeInteractionState(position);

    if (model.widgetRep.getInteractionState() === InteractionState.OUTSIDE) {
      return VOID;
    }

    model.widgetRep.startComplexWidgetInteraction(position);
    model.widgetState = WidgetState.ACTIVE;
    model.widgetRep.setInteractionState(InteractionState.TRANSLATING);
    genericAction();
    return EVENT_ABORT;
  };

  publicAPI.scaleAction = function (callData) {
    if (!model.allowHandleResize) {
      return VOID;
    }

    var position = [callData.position.x, callData.position.y];
    model.widgetRep.computeInteractionState(position);

    if (model.widgetRep.getInteractionState() === InteractionState.OUTSIDE) {
      return VOID;
    }

    model.widgetRep.startComplexWidgetInteraction(position);
    model.widgetState = WidgetState.ACTIVE;
    model.widgetRep.setInteractionState(InteractionState.SCALING);
    genericAction();
    return EVENT_ABORT;
  };

  publicAPI.endSelectAction = function () {
    if (model.widgetState !== WidgetState.ACTIVE) {
      return VOID;
    }

    model.widgetState = WidgetState.START;
    model.widgetRep.highlight(0);
    publicAPI.invokeEndInteractionEvent();
    publicAPI.render();
    return EVENT_ABORT;
  };

  publicAPI.moveAction = function (callData) {
    var position = [callData.position.x, callData.position.y];
    var state = model.widgetRep.getInteractionState();

    if (model.widgetState === WidgetState.START) {
      model.widgetRep.computeInteractionState(position);
      state = model.widgetRep.getInteractionState();
      publicAPI.setCursor(state);

      if (model.widgetRep.getActiveRepresentation() && state !== model.widgetRep.getInteractionState()) {
        publicAPI.render();
      }

      return state === InteractionState.OUTSIDE ? VOID : EVENT_ABORT;
    }

    if (!publicAPI.isDragable()) {
      return VOID;
    }

    publicAPI.setCursor(state);
    model.widgetRep.complexWidgetInteraction(position);
    publicAPI.invokeInteractionEvent();
    publicAPI.render();
    return EVENT_ABORT;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  allowHandleResize: 1,
  widgetState: WidgetState.START
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkAbstractWidget.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['allowHandleResize']); // Object methods

  vtkHandleWidget(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkHandleWidget'); // ----------------------------------------------------------------------------

var vtkHandleWidget$1 = _objectSpread({
  newInstance: newInstance,
  extend: extend
}, Constants);

export { vtkHandleWidget$1 as default, extend, newInstance };
