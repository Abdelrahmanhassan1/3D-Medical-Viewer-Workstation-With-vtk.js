import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import macro from '../../../macros.js';

var MAX_POINTS = 2;
function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkDistanceWidgetProp');
  var isDragging = null; // --------------------------------------------------------------------------
  // Display 2D
  // --------------------------------------------------------------------------

  publicAPI.setDisplayCallback = function (callback) {
    return model.representations[0].setDisplayCallback(callback);
  }; // --------------------------------------------------------------------------
  // Interactor events
  // --------------------------------------------------------------------------


  function ignoreKey(e) {
    return e.altKey || e.controlKey || e.shiftKey;
  } // --------------------------------------------------------------------------
  // Left press: Select handle to drag
  // --------------------------------------------------------------------------


  publicAPI.handleLeftButtonPress = function (e) {
    if (!model.activeState || !model.activeState.getActive() || !model.pickable || ignoreKey(e)) {
      return macro.VOID;
    }

    if (model.activeState === model.widgetState.getMoveHandle() && model.widgetState.getHandleList().length < MAX_POINTS) {
      // Commit handle to location
      var moveHandle = model.widgetState.getMoveHandle();
      var newHandle = model.widgetState.addHandle();
      newHandle.setOrigin.apply(newHandle, _toConsumableArray(moveHandle.getOrigin()));
      newHandle.setColor(moveHandle.getColor());
      newHandle.setScale1(moveHandle.getScale1());
    } else {
      isDragging = true;
      model.apiSpecificRenderWindow.setCursor('grabbing');
      model.interactor.requestAnimation(publicAPI);
    }

    publicAPI.invokeStartInteractionEvent();
    return macro.EVENT_ABORT;
  }; // --------------------------------------------------------------------------
  // Mouse move: Drag selected handle / Handle follow the mouse
  // --------------------------------------------------------------------------


  publicAPI.handleMouseMove = function (callData) {
    if (model.hasFocus && model.widgetState.getHandleList().length === MAX_POINTS) {
      publicAPI.loseFocus();
      return macro.VOID;
    }

    if (model.pickable && model.dragable && model.manipulator && model.activeState && model.activeState.getActive() && !ignoreKey(callData)) {
      var worldCoords = model.manipulator.handleEvent(callData, model.apiSpecificRenderWindow);

      if (worldCoords.length && (model.activeState === model.widgetState.getMoveHandle() || isDragging)) {
        model.activeState.setOrigin(worldCoords);
        publicAPI.invokeInteractionEvent();
        return macro.EVENT_ABORT;
      }
    }

    return macro.VOID;
  }; // --------------------------------------------------------------------------
  // Left release: Finish drag / Create new handle
  // --------------------------------------------------------------------------


  publicAPI.handleLeftButtonRelease = function () {
    if (isDragging && model.pickable) {
      model.apiSpecificRenderWindow.setCursor('pointer');
      model.widgetState.deactivate();
      model.interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent();
    } else if (model.activeState !== model.widgetState.getMoveHandle()) {
      model.widgetState.deactivate();
    }

    if (model.hasFocus && !model.activeState || model.activeState && !model.activeState.getActive()) {
      publicAPI.invokeEndInteractionEvent();
      model.widgetManager.enablePicking();
      model.interactor.render();
    }

    isDragging = false;
  }; // --------------------------------------------------------------------------
  // Focus API - modeHandle follow mouse when widget has focus
  // --------------------------------------------------------------------------


  publicAPI.grabFocus = function () {
    if (!model.hasFocus && model.widgetState.getHandleList().length < MAX_POINTS) {
      model.activeState = model.widgetState.getMoveHandle();
      model.activeState.activate();
      model.activeState.setVisible(true);
      model.interactor.requestAnimation(publicAPI);
      publicAPI.invokeStartInteractionEvent();
    }

    model.hasFocus = true;
  }; // --------------------------------------------------------------------------


  publicAPI.loseFocus = function () {
    if (model.hasFocus) {
      model.interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent();
    }

    model.widgetState.deactivate();
    model.widgetState.getMoveHandle().deactivate();
    model.widgetState.getMoveHandle().setVisible(false);
    model.activeState = null;
    model.hasFocus = false;
    model.widgetManager.enablePicking();
    model.interactor.render();
  };
}

export { widgetBehavior as default };
