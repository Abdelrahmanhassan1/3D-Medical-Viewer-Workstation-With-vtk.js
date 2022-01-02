import _defineProperty from '@babel/runtime/helpers/defineProperty';
import HandleRepConstants from './HandleRepresentation/Constants.js';
import macro from '../../macros.js';
import vtkAbstractWidget from './AbstractWidget.js';
import vtkHandleWidget from './HandleWidget.js';
import vtkLineRepresentation from './LineRepresentation.js';
import { State } from './LineRepresentation/Constants.js';
import Constants from './LineWidget/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var WidgetState = Constants.WidgetState;
var InteractionState = HandleRepConstants.InteractionState; // ----------------------------------------------------------------------------
// vtkHandleWidget methods
// ----------------------------------------------------------------------------

function vtkLineWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLineWidget');

  var superClass = _objectSpread({}, publicAPI);

  publicAPI.setCursor = function (state) {
    switch (state) {
      case State.OUTSIDE:
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

  publicAPI.setCurrentHandle = function (value) {
    model.currentHandle = value;
  };

  publicAPI.setInteractor = function (i) {
    superClass.setInteractor(i);
    model.point1Widget.setInteractor(model.interactor);
    model.point2Widget.setInteractor(model.interactor);
    publicAPI.modified();
  };

  publicAPI.setEnabled = function (enabling) {
    superClass.setEnabled(enabling);

    if (!model.widgetRep) {
      return;
    } // Use the representations from the line widget
    // for the point widgets to avoid creating
    // default representations when setting the
    // interactor below


    model.point1Widget.setWidgetRep(model.widgetRep.getPoint1Representation());
    model.point2Widget.setWidgetRep(model.widgetRep.getPoint2Representation());

    if (model.widgetState === WidgetState.START) {
      model.point1Widget.setEnabled(0);
      model.point2Widget.setEnabled(0);
      model.widgetRep.setLineVisibility(0);
      model.widgetRep.setPoint1Visibility(1);
      model.widgetRep.setPoint2Visibility(0);
    } else {
      model.point1Widget.setEnabled(enabling);
      model.point2Widget.setEnabled(enabling);
      model.widgetRep.setLineVisibility(1);
      model.widgetRep.setPoint1Visibility(1);
      model.widgetRep.setPoint2Visibility(1);
    }
  };

  publicAPI.setProcessEvents = function (processEvents) {
    superClass.setProcessEvents(processEvents);
    model.point1Widget.setProcessEvents(processEvents);
    model.point2Widget.setProcessEvents(processEvents);
  };

  publicAPI.setWidgetStateToStart = function () {
    model.widgetState = WidgetState.START;
    publicAPI.setCurrentHandle(0);
    publicAPI.setEnabled(model.enabled);
  };

  publicAPI.setWidgetStateToManipulate = function () {
    model.widgetState = WidgetState.MANIPULATE;
    publicAPI.setCurrentHandle(-1);
    publicAPI.setEnabled(model.enabled);
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

  publicAPI.selectAction = function (callData) {
    var position = [callData.position.x, callData.position.y];

    if (model.widgetState === WidgetState.START) {
      var pos3D = model.point1Widget.getWidgetRep().displayToWorld(position, 0); // The first time we click, the method is called twice

      if (model.currentHandle < 1) {
        model.widgetRep.setLineVisibility(1);
        model.widgetRep.setPoint1WorldPosition(pos3D); // Trick to avoid a line with a zero length
        // If the line has a zero length, it appears with bad extremities

        pos3D[0] += 0.000000001;
        model.widgetRep.setPoint2WorldPosition(pos3D);
        publicAPI.setCurrentHandle(model.currentHandle + 1);
      } else {
        model.widgetRep.setPoint2Visibility(1);
        model.widgetRep.setPoint2WorldPosition(pos3D); // When two points are placed, we go back to the native

        model.widgetState = WidgetState.MANIPULATE;
        publicAPI.setCurrentHandle(-1);
      }
    } else {
      var state = model.widgetRep.computeInteractionState(position);

      if (state === InteractionState.OUTSIDE) {
        return;
      }

      model.widgetState = WidgetState.ACTIVE;
      publicAPI.updateHandleWidgets(state);
      publicAPI.invokeStartInteractionEvent();
    }

    model.widgetRep.startComplexWidgetInteraction(position);
    publicAPI.render();
  };

  publicAPI.translateAction = function (callData) {
    var position = [callData.position.x, callData.position.y];
    var state = model.widgetRep.computeInteractionState(position);

    if (state === InteractionState.OUTSIDE) {
      return;
    }

    model.widgetState = WidgetState.ACTIVE;
    model.widgetRep.startComplexWidgetInteraction(position);
    publicAPI.invokeStartInteractionEvent();
  };

  publicAPI.scaleAction = function (callData) {
    var position = [callData.position.x, callData.position.y];
    var state = model.widgetRep.computeInteractionState(position);

    if (state === InteractionState.OUTSIDE) {
      return;
    }

    model.widgetState = WidgetState.ACTIVE;
    model.widgetRep.startComplexWidgetInteraction(position);
    publicAPI.invokeStartInteractionEvent();
  };

  publicAPI.moveAction = function (callData) {
    var position = [callData.position.x, callData.position.y];
    var modified = false;

    if (model.widgetState === WidgetState.MANIPULATE) {
      // In MANIPULATE, we are hovering above the widget
      // Check if above a sphere and enable/disable if needed
      var state = model.widgetRep.computeInteractionState(position);
      modified = publicAPI.updateHandleWidgets(state);
    } else if (model.widgetState === WidgetState.START) {
      // In START, we are placing the sphere widgets.
      // Move current handle along the mouse position.
      model.widgetRep.complexWidgetInteraction(position);
      var pos3D = model.point1Widget.getWidgetRep().displayToWorld(position, 0);

      if (model.currentHandle === 0) {
        model.widgetRep.setPoint1WorldPosition(pos3D);
      } else {
        model.widgetRep.setPoint2WorldPosition(pos3D);
      }

      modified = true;
    } else if (model.widgetState === WidgetState.ACTIVE) {
      // In ACTIVE, we are moving a sphere widget.
      // Update the line extremities to follow the spheres.
      model.widgetRep.setPoint1WorldPosition(model.point1Widget.getWidgetRep().getWorldPosition());
      model.widgetRep.setPoint2WorldPosition(model.point2Widget.getWidgetRep().getWorldPosition());
      modified = true;
    }

    if (modified) {
      publicAPI.invokeInteractionEvent();
      publicAPI.render();
    }
  };

  publicAPI.endSelectAction = function (callData) {
    if (model.widgetState === WidgetState.START) {
      return;
    }

    var position = [callData.position.x, callData.position.y];
    model.widgetRep.complexWidgetInteraction(position);
    model.widgetRep.setPoint1WorldPosition(model.point1Widget.getWidgetRep().getWorldPosition());
    model.widgetRep.setPoint2WorldPosition(model.point2Widget.getWidgetRep().getWorldPosition());
    model.widgetState = WidgetState.MANIPULATE;
    publicAPI.invokeEndInteractionEvent();
    publicAPI.render();
  };

  publicAPI.createDefaultRepresentation = function () {
    if (!model.widgetRep) {
      model.widgetRep = vtkLineRepresentation.newInstance();
    }
  };

  publicAPI.updateHandleWidgets = function (state) {
    var modified = false;
    publicAPI.setCursor(state);
    var enablePoint1Widget = state === State.ONP1;
    var enablePoint2Widget = state === State.ONP2;

    if (enablePoint1Widget !== model.point1Widget.getEnabled()) {
      model.point1Widget.setEnabled(enablePoint1Widget);
      modified = true;
    }

    if (enablePoint2Widget !== model.point2Widget.getEnabled()) {
      model.point2Widget.setEnabled(enablePoint2Widget);
      modified = true;
    }

    return modified;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  widgetState: WidgetState.START,
  currentHandle: 0,
  point1Widget: null,
  point2Widget: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkAbstractWidget.extend(publicAPI, model, initialValues);
  model.point1Widget = vtkHandleWidget.newInstance();
  model.point1Widget.setParent(publicAPI);
  model.point1Widget.createDefaultRepresentation();
  model.point2Widget = vtkHandleWidget.newInstance();
  model.point2Widget.setParent(publicAPI);
  model.point2Widget.createDefaultRepresentation(); // Object methods

  vtkLineWidget(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkLineWidget'); // ----------------------------------------------------------------------------

var vtkLineWidget$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkLineWidget$1 as default, extend, newInstance };
