import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import macro from '../../../macros.js';
import { vec3 } from 'gl-matrix';

function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkSplineWidgetProp');
  model.keysDown = {};
  model.moveHandle = model.widgetState.getMoveHandle(); // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------

  var updateHandlesSize = function updateHandlesSize() {
    if (publicAPI.getHandleSizeInPixels() != null) {
      var scale = publicAPI.getHandleSizeInPixels();
      model.moveHandle.setScale1(scale);
      model.widgetState.getHandleList().forEach(function (handle) {
        handle.setScale1(scale);
      });
    }
  }; // --------------------------------------------------------------------------


  var addPoint = function addPoint() {
    // Commit handle to location
    if (!model.lastHandle || model.keysDown.Control || !model.freeHand || vec3.squaredDistance(model.moveHandle.getOrigin(), model.lastHandle.getOrigin()) > publicAPI.getFreehandMinDistance() * publicAPI.getFreehandMinDistance()) {
      var _model$lastHandle;

      model.lastHandle = model.widgetState.addHandle();
      model.lastHandle.setVisible(false);

      (_model$lastHandle = model.lastHandle).setOrigin.apply(_model$lastHandle, _toConsumableArray(model.moveHandle.getOrigin()));

      model.lastHandle.setColor(model.moveHandle.getColor());
      model.lastHandle.setScale1(model.moveHandle.getScale1());

      if (!model.firstHandle) {
        model.firstHandle = model.lastHandle;
      }

      model.apiSpecificRenderWindow.setCursor('grabbing');
    }
  }; // --------------------------------------------------------------------------


  var getHoveredHandle = function getHoveredHandle() {
    var handles = model.widgetState.getHandleList();
    var scale = model.moveHandle.getScale1() * vec3.distance(model.apiSpecificRenderWindow.displayToWorld(0, 0, 0, model.renderer), model.apiSpecificRenderWindow.displayToWorld(1, 0, 0, model.renderer));
    return handles.reduce(function (_ref, handle) {
      var closestHandle = _ref.closestHandle,
          closestDistance = _ref.closestDistance;
      var distance = vec3.squaredDistance(model.moveHandle.getOrigin(), handle.getOrigin());

      if (handle !== model.moveHandle) {
        return {
          closestHandle: distance < closestDistance ? handle : closestHandle,
          closestDistance: distance < closestDistance ? distance : closestDistance
        };
      }

      return {
        closestHandle: closestHandle,
        closestDistance: closestDistance
      };
    }, {
      closestHandle: null,
      closestDistance: scale * scale
    }).closestHandle;
  }; // --------------------------------------------------------------------------
  // Display 2D
  // --------------------------------------------------------------------------


  publicAPI.setDisplayCallback = function (callback) {
    return model.representations[0].setDisplayCallback(callback);
  }; // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------


  publicAPI.setResetAfterPointPlacement = model.factory.setResetAfterPointPlacement;
  publicAPI.getResetAfterPointPlacement = model.factory.getResetAfterPointPlacement;
  publicAPI.setResetAfterPointPlacement(publicAPI.getResetAfterPointPlacement());
  publicAPI.setFreehandMinDistance = model.factory.setFreehandMinDistance;
  publicAPI.getFreehandMinDistance = model.factory.getFreehandMinDistance;
  publicAPI.setFreehandMinDistance(publicAPI.getFreehandMinDistance());
  publicAPI.setAllowFreehand = model.factory.setAllowFreehand;
  publicAPI.getAllowFreehand = model.factory.getAllowFreehand;
  publicAPI.setAllowFreehand(publicAPI.getAllowFreehand());
  publicAPI.setDefaultCursor = model.factory.setDefaultCursor;
  publicAPI.getDefaultCursor = model.factory.getDefaultCursor;
  publicAPI.setDefaultCursor(publicAPI.getDefaultCursor()); // --------------------------------------------------------------------------

  publicAPI.setHandleSizeInPixels = function (size) {
    model.factory.setHandleSizeInPixels(size);
    updateHandlesSize();
  };

  publicAPI.getHandleSizeInPixels = model.factory.getHandleSizeInPixels;
  publicAPI.setHandleSizeInPixels(model.factory.getHandleSizeInPixels()); // set initial value
  // --------------------------------------------------------------------------

  publicAPI.setResolution = function (resolution) {
    model.factory.setResolution(resolution);
    model.representations[1].setResolution(resolution);
  };

  publicAPI.setResolution(model.factory.getResolution()); // set initial value
  // --------------------------------------------------------------------------

  publicAPI.getPoints = function () {
    return model.representations[1].getOutputData().getPoints().getData();
  }; // --------------------------------------------------------------------------


  publicAPI.reset = function () {
    model.widgetState.clearHandleList();
    model.lastHandle = null;
    model.firstHandle = null;
  }; // --------------------------------------------------------------------------
  // Right click: Delete handle
  // --------------------------------------------------------------------------


  publicAPI.handleRightButtonPress = function (e) {
    if (!model.activeState || !model.activeState.getActive() || !model.pickable) {
      return macro.VOID;
    }

    if (model.activeState !== model.moveHandle) {
      model.interactor.requestAnimation(publicAPI);
      model.activeState.deactivate();
      model.widgetState.removeHandle(model.activeState);
      model.activeState = null;
      model.interactor.cancelAnimation(publicAPI);
    } else {
      var handle = getHoveredHandle();

      if (handle) {
        model.widgetState.removeHandle(handle);
      } else if (model.lastHandle) {
        model.widgetState.removeHandle(model.lastHandle);
        var handles = model.widgetState.getHandleList();
        model.lastHandle = handles[handles.length - 1];
      }
    }

    publicAPI.invokeInteractionEvent();
    return macro.EVENT_ABORT;
  }; // --------------------------------------------------------------------------
  // Left press: Add new point
  // --------------------------------------------------------------------------


  publicAPI.handleLeftButtonPress = function (e) {
    if (!model.activeState || !model.activeState.getActive() || !model.pickable) {
      return macro.VOID;
    }

    if (model.activeState === model.moveHandle) {
      if (model.widgetState.getHandleList().length === 0) {
        publicAPI.invokeStartInteractionEvent();
        addPoint();
      } else {
        var hoveredHandle = getHoveredHandle();

        if (hoveredHandle && !model.keysDown.Control) {
          model.moveHandle.deactivate();
          model.moveHandle.setVisible(false);
          model.activeState = hoveredHandle;
          hoveredHandle.activate();
          model.isDragging = true;
          model.lastHandle.setVisible(true);
        } else {
          addPoint();
        }
      }

      model.freeHand = publicAPI.getAllowFreehand() && !model.isDragging;
    } else {
      model.isDragging = true;
      model.apiSpecificRenderWindow.setCursor('grabbing');
      model.interactor.requestAnimation(publicAPI);
      publicAPI.invokeStartInteractionEvent();
    }

    return macro.EVENT_ABORT;
  }; // --------------------------------------------------------------------------
  // Left release
  // --------------------------------------------------------------------------


  publicAPI.handleLeftButtonRelease = function (e) {
    if (model.isDragging) {
      if (!model.hasFocus) {
        model.apiSpecificRenderWindow.setCursor(model.defaultCursor);
        model.widgetState.deactivate();
        model.interactor.cancelAnimation(publicAPI);
        publicAPI.invokeEndInteractionEvent();
      } else {
        var _model$moveHandle;

        (_model$moveHandle = model.moveHandle).setOrigin.apply(_model$moveHandle, _toConsumableArray(model.activeState.getOrigin()));

        model.activeState.deactivate();
        model.moveHandle.activate();
        model.activeState = model.moveHandle;

        if (!model.draggedPoint) {
          if (vec3.squaredDistance(model.moveHandle.getOrigin(), model.lastHandle.getOrigin()) < model.moveHandle.getScale1() * model.moveHandle.getScale1() || vec3.squaredDistance(model.moveHandle.getOrigin(), model.firstHandle.getOrigin()) < model.moveHandle.getScale1() * model.moveHandle.getScale1()) {
            model.lastHandle.setVisible(true);
            publicAPI.invokeEndInteractionEvent();

            if (publicAPI.getResetAfterPointPlacement()) {
              publicAPI.reset();
            } else {
              publicAPI.loseFocus();
            }
          }
        }

        model.interactor.render();
      }
    } else if (model.activeState !== model.moveHandle) {
      model.widgetState.deactivate();
    }

    model.freeHand = false;
    model.isDragging = false;
    model.draggedPoint = false;
    return model.hasFocus ? macro.EVENT_ABORT : macro.VOID;
  }; // --------------------------------------------------------------------------
  // Mouse move: Drag selected handle / Handle follow the mouse
  // --------------------------------------------------------------------------


  publicAPI.handleMouseMove = function (callData) {
    if (!model.activeState || !model.activeState.getActive() || !model.pickable || !model.manipulator) {
      return macro.VOID;
    }

    model.manipulator.setNormal(model.camera.getDirectionOfProjection());
    var worldCoords = model.manipulator.handleEvent(callData, model.apiSpecificRenderWindow);
    var hoveredHandle = getHoveredHandle();

    if (hoveredHandle) {
      model.moveHandle.setVisible(false);

      if (hoveredHandle !== model.firstHandle) {
        model.apiSpecificRenderWindow.setCursor('grabbing');
      }
    } else if (!model.isDragging && model.hasFocus) {
      model.moveHandle.setVisible(true);
      model.apiSpecificRenderWindow.setCursor(model.defaultCursor);
    }

    if (model.lastHandle) {
      model.lastHandle.setVisible(true);
    }

    if (worldCoords.length && (model.isDragging || model.activeState === model.moveHandle)) {
      model.activeState.setOrigin(worldCoords);

      if (model.isDragging) {
        model.draggedPoint = true;
      }

      if (model.freeHand && model.activeState === model.moveHandle) {
        addPoint();
      }
    }

    return model.hasFocus ? macro.EVENT_ABORT : macro.VOID;
  }; // --------------------------------------------------------------------------
  // Mofifier keys
  // --------------------------------------------------------------------------


  publicAPI.handleKeyDown = function (_ref2) {
    var key = _ref2.key;
    model.keysDown[key] = true;

    if (!model.hasFocus) {
      return;
    }

    if (key === 'Enter') {
      if (model.widgetState.getHandleList().length > 0) {
        publicAPI.invokeEndInteractionEvent();

        if (publicAPI.getResetAfterPointPlacement()) {
          publicAPI.reset();
        } else {
          publicAPI.loseFocus();
        }
      }
    } else if (key === 'Escape') {
      publicAPI.reset();
      publicAPI.loseFocus();
      publicAPI.invokeEndInteractionEvent();
    } else if (key === 'Delete' || key === 'Backspace') {
      if (model.lastHandle) {
        model.widgetState.removeHandle(model.lastHandle);
        var handleList = model.widgetState.getHandleList();
        model.lastHandle = handleList[handleList.length - 1];
      }
    }
  }; // --------------------------------------------------------------------------


  publicAPI.handleKeyUp = function (_ref3) {
    var key = _ref3.key;
    model.keysDown[key] = false;
  }; // --------------------------------------------------------------------------
  // Focus API - modeHandle follow mouse when widget has focus
  // --------------------------------------------------------------------------


  publicAPI.grabFocus = function () {
    if (!model.hasFocus) {
      model.activeState = model.moveHandle;
      model.activeState.activate();
      model.activeState.setVisible(true);
      model.interactor.requestAnimation(publicAPI);
      updateHandlesSize();
    }

    model.hasFocus = true;
  }; // --------------------------------------------------------------------------


  publicAPI.loseFocus = function () {
    if (model.hasFocus) {
      model.interactor.cancelAnimation(publicAPI);
    }

    model.widgetState.deactivate();
    model.moveHandle.deactivate();
    model.moveHandle.setVisible(false);
    model.activeState = null;
    model.interactor.render();
    model.hasFocus = false;
  };
}

export { widgetBehavior as default };
