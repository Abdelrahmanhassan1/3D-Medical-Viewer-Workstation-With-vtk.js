import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import macro from '../../../macros.js';
import { vec3 } from 'gl-matrix';

function widgetBehavior(publicAPI, model) {
  model.painting = model.factory.getPainting();

  publicAPI.handleLeftButtonPress = function (callData) {
    if (!model.activeState || !model.activeState.getActive()) {
      return macro.VOID;
    }

    model.painting = true;
    var trailCircle = model.widgetState.addTrail();
    trailCircle.set(model.activeState.get('origin', 'up', 'right', 'direction', 'scale1'));
    publicAPI.invokeStartInteractionEvent();
    return macro.EVENT_ABORT;
  };

  publicAPI.handleMouseMove = function (callData) {
    return publicAPI.handleEvent(callData);
  };

  publicAPI.handleLeftButtonRelease = function () {
    if (model.painting) {
      publicAPI.invokeEndInteractionEvent();
      model.widgetState.clearTrailList();
    }

    model.painting = false;
    return model.hasFocus ? macro.EVENT_ABORT : macro.VOID;
  };

  publicAPI.handleEvent = function (callData) {
    if (model.manipulator && model.activeState && model.activeState.getActive()) {
      var _model$activeState, _model$activeState2, _model$activeState3;

      var normal = model.camera.getDirectionOfProjection();
      var up = model.camera.getViewUp();
      var right = [];
      vec3.cross(right, up, normal);

      (_model$activeState = model.activeState).setUp.apply(_model$activeState, _toConsumableArray(up));

      (_model$activeState2 = model.activeState).setRight.apply(_model$activeState2, right);

      (_model$activeState3 = model.activeState).setDirection.apply(_model$activeState3, _toConsumableArray(normal));

      model.manipulator.setNormal(normal);
      var worldCoords = model.manipulator.handleEvent(callData, model.apiSpecificRenderWindow);

      if (worldCoords.length) {
        var _model$widgetState, _model$activeState4;

        (_model$widgetState = model.widgetState).setTrueOrigin.apply(_model$widgetState, _toConsumableArray(worldCoords));

        (_model$activeState4 = model.activeState).setOrigin.apply(_model$activeState4, _toConsumableArray(worldCoords));

        if (model.painting) {
          var trailCircle = model.widgetState.addTrail();
          trailCircle.set(model.activeState.get('origin', 'up', 'right', 'direction', 'scale1'));
        }
      }

      publicAPI.invokeInteractionEvent();
      return macro.EVENT_ABORT;
    }

    return macro.VOID;
  };

  publicAPI.grabFocus = function () {
    if (!model.hasFocus) {
      model.activeState = model.widgetState.getHandle();
      model.activeState.activate();
      model.interactor.requestAnimation(publicAPI);
      var canvas = model.apiSpecificRenderWindow.getCanvas();

      canvas.onmouseenter = function () {
        if (model.hasFocus && model.activeState === model.widgetState.getHandle()) {
          model.activeState.setVisible(true);
        }
      };

      canvas.onmouseleave = function () {
        if (model.hasFocus && model.activeState === model.widgetState.getHandle()) {
          model.activeState.setVisible(false);
        }
      };
    }

    model.hasFocus = true;
  };

  publicAPI.loseFocus = function () {
    if (model.hasFocus) {
      model.interactor.cancelAnimation(publicAPI);
    }

    model.widgetState.deactivate();
    model.widgetState.getHandle().deactivate();
    model.activeState = null;
    model.hasFocus = false;
  };

  macro.get(publicAPI, model, ['painting']);
}

export { widgetBehavior as default };
