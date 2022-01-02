import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import vtkActor from '../../Rendering/Core/Actor.js';
import vtkInteractorObserver from '../../Rendering/Core/InteractorObserver.js';
import { g as subtract, k as add } from '../../Common/Core/Math/index.js';
import vtkPixelSpaceCallbackMapper from '../../Rendering/Core/PixelSpaceCallbackMapper.js';
import vtkPointSource from '../../Filters/Sources/PointSource.js';
import vtkHandleRepresentation from './HandleRepresentation.js';
import { TextAlign, VerticalAlign } from './LabelRepresentation/Constants.js';
import { InteractionState } from './HandleRepresentation/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
// vtkLabelRepresentation methods
// ----------------------------------------------------------------------------

function vtkLabelRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLabelRepresentation');

  var superClass = _objectSpread({}, publicAPI);

  function getCanvasPosition() {
    if (model.canvas) {
      // canvas left/bottom in CSS coords
      var dpr = window.devicePixelRatio;
      return {
        left: Number(model.canvas.style.left.split('px')[0]) * dpr,
        bottom: Number(model.canvas.style.bottom.split('px')[0]) * dpr
      };
    }

    return null;
  }

  publicAPI.buildRepresentation = function () {
    if (model.labelText !== null) {
      publicAPI.setLabelText(model.labelText);
    }

    publicAPI.modified();
  };

  publicAPI.getActors = function () {
    return [model.actor];
  };

  publicAPI.getNestedProps = function () {
    return publicAPI.getActors();
  };

  publicAPI.computeInteractionState = function (pos) {
    if (model.canvas) {
      var dpr = window.devicePixelRatio || 1;
      var height = model.canvas.height * dpr;
      var width = model.canvas.width * dpr;
      var canvasPosition = getCanvasPosition(); // pos is in display coords

      if (pos[0] >= canvasPosition.left && pos[0] <= canvasPosition.left + width && pos[1] >= canvasPosition.bottom && pos[1] <= canvasPosition.bottom + height) {
        model.interactionState = InteractionState.SELECTING;
      } else {
        model.interactionState = InteractionState.OUTSIDE;
      }
    }

    return model.interactionState;
  };

  publicAPI.startComplexWidgetInteraction = function (startEventPos) {
    // Record the current event position, and the rectilinear wipe position.
    model.startEventPosition[0] = startEventPos[0];
    model.startEventPosition[1] = startEventPos[1];
    model.startEventPosition[2] = 0.0;
    model.lastEventPosition[0] = startEventPos[0];
    model.lastEventPosition[1] = startEventPos[1];
  };

  publicAPI.complexWidgetInteraction = function (eventPos) {
    if (model.interactionState === InteractionState.SELECTING) {
      var center = model.point.getCenter();
      var displayCenter = vtkInteractorObserver.computeWorldToDisplay(model.renderer, center[0], center[1], center[2]);
      var focalDepth = displayCenter[2];
      var worldStartEventPosition = vtkInteractorObserver.computeDisplayToWorld(model.renderer, model.lastEventPosition[0], model.lastEventPosition[1], focalDepth);
      var worldCurrentPosition = vtkInteractorObserver.computeDisplayToWorld(model.renderer, eventPos[0], eventPos[1], focalDepth);
      publicAPI.moveFocus(worldStartEventPosition, worldCurrentPosition);
      model.lastEventPosition[0] = eventPos[0];
      model.lastEventPosition[1] = eventPos[1];
      publicAPI.modified();
    }
  };

  publicAPI.setWorldPosition = function (position) {
    model.point.setCenter(position);
    superClass.setWorldPosition(model.point.getCenter());
    publicAPI.modified();
  };

  publicAPI.setDisplayPosition = function (position) {
    superClass.setDisplayPosition(position);
    publicAPI.setWorldPosition(model.worldPosition.getValue());
  };

  publicAPI.moveFocus = function (start, end) {
    var motionVector = [];
    subtract(end, start, motionVector);
    var focus = model.point.getCenter();
    add(focus, motionVector, focus);
    publicAPI.setWorldPosition(focus);
  };

  publicAPI.getBounds = function () {
    var center = model.point.getCenter();
    var bounds = [];
    bounds[0] = model.placeFactor * (center[0] - 1);
    bounds[1] = model.placeFactor * (center[0] + 1);
    bounds[2] = model.placeFactor * (center[1] - 1);
    bounds[3] = model.placeFactor * (center[1] + 1);
    bounds[4] = model.placeFactor * (center[2] - 1);
    bounds[5] = model.placeFactor * (center[2] + 1);
    return bounds;
  };

  publicAPI.setContainer = function (container) {
    if (model.container && model.container !== container) {
      model.container.removeChild(model.canvas);
    }

    if (model.container !== container) {
      model.container = container;

      if (model.container) {
        model.container.appendChild(model.canvas);
      }

      publicAPI.modified();
    }
  };

  publicAPI.setLabelStyle = function (labelStyle) {
    model.labelStyle = _objectSpread(_objectSpread({}, model.labelStyle), labelStyle);
    publicAPI.modified();
  };

  publicAPI.setSelectLabelStyle = function (selectLabelStyle) {
    model.selectLabelStyle = _objectSpread(_objectSpread({}, model.selectLabelStyle), selectLabelStyle);
    publicAPI.modified();
  };

  publicAPI.computeTextDimensions = function (text) {
    var currentLabelStyle = model.highlight ? model.selectLabelStyle : model.labelStyle;
    var separatorRegExp = /\r?\n/;
    var separatorRes = separatorRegExp.exec(text);
    var separator = separatorRes !== null ? separatorRes[0] : null;
    var lines = text.split(separator);
    var lineSpace = currentLabelStyle.fontSize * (1 + currentLabelStyle.lineSpace);
    var padding = currentLabelStyle.fontSize / 4;
    var height = 2 * padding + currentLabelStyle.fontSize + (lines.length - 1) * lineSpace;
    var width = lines.reduce(function (maxWidth, line) {
      return Math.max(maxWidth, Math.round(model.context.measureText(line).width));
    }, 0);
    return {
      width: width,
      height: height,
      lineSpace: lineSpace,
      padding: padding,
      lines: lines
    };
  };

  publicAPI.updateLabel = function () {
    if (model.context && model.canvas) {
      // Clear canvas
      model.context.clearRect(0, 0, model.canvas.width, model.canvas.height);
      model.canvas.hidden = !model.actor.getVisibility(); // Render text

      if (model.actor.getVisibility()) {
        var currentLabelStyle = model.highlight ? model.selectLabelStyle : model.labelStyle;

        var _publicAPI$computeTex = publicAPI.computeTextDimensions(model.labelText),
            width = _publicAPI$computeTex.width,
            height = _publicAPI$computeTex.height,
            lineSpace = _publicAPI$computeTex.lineSpace,
            padding = _publicAPI$computeTex.padding,
            lines = _publicAPI$computeTex.lines;

        model.canvas.height = Math.round(height);
        model.canvas.width = width + 2 * padding; // Update label style

        model.context.strokeStyle = currentLabelStyle.strokeColor;
        model.context.lineWidth = currentLabelStyle.strokeSize;
        model.context.fillStyle = currentLabelStyle.fontColor;
        model.context.font = "".concat(currentLabelStyle.fontStyle, " ").concat(currentLabelStyle.fontSize, "px ").concat(currentLabelStyle.fontFamily); // Update canvas dimensions

        var x = padding;
        var y = currentLabelStyle.fontSize; // Add text

        lines.forEach(function (line) {
          var offset = 0;

          if (model.textAlign === TextAlign.RIGHT) {
            offset = width - Math.round(model.context.measureText(line).width);
          } else if (model.textAlign === TextAlign.CENTER) {
            offset = 0.5 * (width - Math.round(model.context.measureText(line).width));
          }

          model.context.strokeText(line, x + offset, y);
          model.context.fillText(line, x + offset, y);
          y += lineSpace;
        });
      }
    }
  };

  publicAPI.highlight = function (highlight) {
    model.highlight = highlight;
    publicAPI.modified();
  };

  publicAPI.getCanvasSize = function () {
    if (model.canvas) {
      return {
        height: model.canvas.height,
        width: model.canvas.width
      };
    }

    return null;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


function defaultValues(initialValues) {
  return _objectSpread({
    container: null,
    labelStyle: {
      fontColor: 'white',
      fontStyle: 'normal',
      fontSize: 15,
      fontFamily: 'Arial',
      strokeColor: 'black',
      strokeSize: 1,
      lineSpace: 0.2
    },
    labelText: '',
    textAlign: TextAlign.LEFT,
    verticalAlign: VerticalAlign.BOTTOM,
    selectLabelStyle: {
      fontColor: 'rgb(0, 255, 0)',
      fontStyle: 'normal',
      fontSize: 15,
      fontFamily: 'Arial',
      strokeColor: 'black',
      strokeSize: 1,
      lineSpace: 0.2
    }
  }, initialValues);
} // ----------------------------------------------------------------------------


function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, defaultValues(initialValues)); // Inheritance

  vtkHandleRepresentation.extend(publicAPI, model, initialValues);
  publicAPI.setPlaceFactor(1); // Canvas

  model.canvas = document.createElement('canvas');
  model.canvas.style.position = 'absolute'; // Context

  model.context = model.canvas.getContext('2d'); // PixelSpaceCallbackMapper

  model.point = vtkPointSource.newInstance();
  model.point.setNumberOfPoints(1);
  model.point.setRadius(0);
  model.mapper = vtkPixelSpaceCallbackMapper.newInstance();
  model.mapper.setInputConnection(model.point.getOutputPort());
  model.mapper.setCallback(function (coordList) {
    if (model.canvas) {
      var yOffset = 0;

      if (model.verticalAlign === VerticalAlign.BOTTOM) {
        yOffset = -model.canvas.height;
      } else if (model.verticalAlign === VerticalAlign.CENTER) {
        yOffset = -0.5 * model.canvas.height;
      } // coordList[0] is in display coords


      var dpr = window.devicePixelRatio;
      model.canvas.style.left = "".concat(Math.round(coordList[0][0]) / dpr, "px");
      model.canvas.style.bottom = "".concat(Math.round(coordList[0][1] / dpr + yOffset), "px");
      publicAPI.modified();
    }
  });
  model.actor = vtkActor.newInstance({
    parentProp: publicAPI
  });
  model.actor.setMapper(model.mapper);
  model.actorVisibility = true;
  model.highlight = false;
  model.actor.onModified(function () {
    if (model.actorVisibility !== model.actor.getVisibility()) {
      model.actorVisibility = model.actor.getVisibility();
      publicAPI.modified();
    }
  });
  publicAPI.onModified(function () {
    publicAPI.updateLabel();
  });
  macro.setGet(publicAPI, model, ['labelText', 'textAlign', 'verticalAlign']);
  macro.get(publicAPI, model, ['container', 'labelStyle']); // Object methods

  vtkLabelRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkLabelRepresentation'); // ----------------------------------------------------------------------------

var vtkLabelRepresentation$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkLabelRepresentation$1 as default, extend, newInstance };
