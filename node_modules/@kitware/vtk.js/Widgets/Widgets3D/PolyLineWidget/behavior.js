import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import macro from '../../../macros.js';

function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkPolyLineWidgetProp');
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
  // Right click: Delete handle
  // --------------------------------------------------------------------------


  publicAPI.handleRightButtonPress = function (e) {
    if (!model.activeState || !model.activeState.getActive() || !model.pickable || ignoreKey(e)) {
      return macro.VOID;
    }

    if (model.activeState !== model.widgetState.getMoveHandle()) {
      model.interactor.requestAnimation(publicAPI);
      model.activeState.deactivate();
      model.widgetState.removeHandle(model.activeState);
      model.activeState = null;
      model.interactor.cancelAnimation(publicAPI);
    }

    publicAPI.invokeStartInteractionEvent();
    publicAPI.invokeInteractionEvent();
    publicAPI.invokeEndInteractionEvent();
    return macro.EVENT_ABORT;
  }; // --------------------------------------------------------------------------
  // Left press: Select handle to drag
  // --------------------------------------------------------------------------


  publicAPI.handleLeftButtonPress = function (e) {
    if (!model.activeState || !model.activeState.getActive() || !model.pickable || ignoreKey(e)) {
      return macro.VOID;
    }

    if (model.activeState === model.widgetState.getMoveHandle()) {
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
    if (model.pickable && model.dragable && model.manipulator && model.activeState && model.activeState.getActive() && !ignoreKey(callData)) {
      model.manipulator.setOrigin(model.activeState.getOrigin());
      model.manipulator.setNormal(model.camera.getDirectionOfProjection());
      var worldCoords = model.manipulator.handleEvent(callData, model.apiSpecificRenderWindow);

      if (worldCoords.length && (model.activeState === model.widgetState.getMoveHandle() || isDragging)) {
        model.activeState.setOrigin(worldCoords);
        publicAPI.invokeInteractionEvent();
        return macro.EVENT_ABORT;
      }
    }

    if (model.hasFocus) {
      model.widgetManager.disablePicking();
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
  // Escape key: Release focus to switch to drag mode
  // --------------------------------------------------------------------------


  publicAPI.handleKeyDown = function (_ref) {
    var key = _ref.key;

    if (key === 'Escape') {
      publicAPI.loseFocus();
    }
  }; // --------------------------------------------------------------------------
  // Focus API - modeHandle follow mouse when widget has focus
  // --------------------------------------------------------------------------


  publicAPI.grabFocus = function () {
    if (!model.hasFocus) {
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
