import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../../macros.js';
import vtkAbstractWidget from '../AbstractWidget.js';
import vtkInteractorStyleImage from '../../Style/InteractorStyleImage.js';
import vtkResliceCursorLineRepresentation from './ResliceCursorLineRepresentation.js';
import { WidgetState } from './ResliceCursorWidget/Constants.js';
import { InteractionState } from './ResliceCursorRepresentation/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var VOID = macro.VOID,
    EVENT_ABORT = macro.EVENT_ABORT; // ----------------------------------------------------------------------------
// vtkResliceCursorWidget methods
// ----------------------------------------------------------------------------

function vtkResliceCursorWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkResliceCursorWidget');

  var superClass = _objectSpread({}, publicAPI); //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------


  publicAPI.setCursor = function (state) {
    switch (state) {
      case InteractionState.ON_AXIS1:
      case InteractionState.ON_AXIS2:
      case InteractionState.ON_CENTER:
        {
          model.interactor.getView().setCursor('pointer');
          break;
        }

      default:
        {
          model.interactor.getView().setCursor('default');
        }
    }
  };

  publicAPI.createDefaultRepresentation = function () {
    if (!model.widgetRep) {
      publicAPI.setWidgetRep(vtkResliceCursorLineRepresentation.newInstance());
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

  publicAPI.selectAction = function (callData) {
    var position = [callData.position.x, callData.position.y];
    var state = model.widgetRep.computeInteractionState(position);

    if (state === InteractionState.OUTSIDE) {
      model.widgetState = WidgetState.WINDOW_LEVEL;
      model.imageInteractorStyle.handleLeftButtonPress(callData);
    } else {
      model.widgetRep.startComplexWidgetInteraction(position);
      model.widgetState = WidgetState.ACTIVE;
      publicAPI.setCursor(state);
    }

    publicAPI.invokeStartInteractionEvent();
    publicAPI.render();
    return EVENT_ABORT;
  };

  publicAPI.endSelectAction = function (callData) {
    if (model.widgetState === WidgetState.START) {
      return VOID;
    }

    if (model.widgetState === WidgetState.WINDOW_LEVEL) {
      model.imageInteractorStyle.handleLeftButtonRelease(callData);
    }

    model.widgetState = WidgetState.START;
    publicAPI.invokeEndInteractionEvent();
    publicAPI.render();
    return EVENT_ABORT;
  };

  publicAPI.moveAction = function (callData) {
    var position = [callData.position.x, callData.position.y];

    if (model.widgetState === WidgetState.START) {
      var state = model.widgetRep.getInteractionState();
      model.widgetRep.computeInteractionState(position);
      publicAPI.setCursor(model.widgetRep.getInteractionState());

      if (state !== model.widgetRep.getInteractionState()) {
        publicAPI.render();
      }

      return VOID;
    }

    if (model.widgetState === WidgetState.WINDOW_LEVEL) {
      model.imageInteractorStyle.handleMouseMove(callData);
    } else {
      model.widgetRep.complexWidgetInteraction(position);
    }

    publicAPI.invokeInteractionEvent();
    publicAPI.render();
    return EVENT_ABORT;
  };

  publicAPI.setWidgetRep = function (widgetRep) {
    superClass.setWidgetRep(widgetRep);
    model.imageInteractorStyle.setCurrentImageProperty(model.widgetRep.getImageActor().getProperty());
  };

  publicAPI.setInteractor = function (i) {
    superClass.setInteractor(i);
    model.imageInteractorStyle.setInteractor(model.interactor);
    model.imageInteractorStyle.setEnabled(false);
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  widgetState: WidgetState.START
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkAbstractWidget.extend(publicAPI, model, DEFAULT_VALUES, initialValues);
  model.imageInteractorStyle = vtkInteractorStyleImage.newInstance({
    currentImageNumber: null
  }); // Object methods

  vtkResliceCursorWidget(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkResliceCursorWidget'); // ----------------------------------------------------------------------------

var vtkResliceCursorWidget$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkResliceCursorWidget$1 as default, extend, newInstance };
