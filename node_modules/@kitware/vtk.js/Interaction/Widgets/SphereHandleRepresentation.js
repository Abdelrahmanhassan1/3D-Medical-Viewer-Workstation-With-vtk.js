import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import vtkActor from '../../Rendering/Core/Actor.js';
import vtkCellPicker from '../../Rendering/Core/CellPicker.js';
import vtkHandleRepresentation from './HandleRepresentation.js';
import vtkInteractorObserver from '../../Rendering/Core/InteractorObserver.js';
import vtkMapper from '../../Rendering/Core/Mapper.js';
import { f as distance2BetweenPoints, n as norm } from '../../Common/Core/Math/index.js';
import vtkProperty from '../../Rendering/Core/Property.js';
import vtkSphereSource from '../../Filters/Sources/SphereSource.js';
import { InteractionState } from './HandleRepresentation/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
// vtkSphereHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkSphereHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSphereHandleRepresentation');

  var superClass = _objectSpread({}, publicAPI);

  publicAPI.getActors = function () {
    return [model.actor];
  };

  publicAPI.getNestedProps = function () {
    return publicAPI.getActors();
  };

  publicAPI.placeWidget = function () {
    var boundsArray = [];

    if (Array.isArray(arguments.length <= 0 ? undefined : arguments[0])) {
      boundsArray = arguments.length <= 0 ? undefined : arguments[0];
    } else {
      for (var i = 0; i < arguments.length; i++) {
        boundsArray.push(i < 0 || arguments.length <= i ? undefined : arguments[i]);
      }
    }

    if (boundsArray.length !== 6) {
      return;
    }

    var newBounds = [];
    var center = [];
    publicAPI.adjustBounds(boundsArray, newBounds, center);
    publicAPI.setWorldPosition(center);

    for (var _i = 0; _i < 6; _i++) {
      model.initialBounds[_i] = newBounds[_i];
    }

    model.initialLength = Math.sqrt((newBounds[1] - newBounds[0]) * (newBounds[1] - newBounds[0]) + (newBounds[3] - newBounds[2]) * (newBounds[3] - newBounds[2]) + (newBounds[5] - newBounds[4]) * (newBounds[5] - newBounds[4]));
  };

  publicAPI.setSphereRadius = function (radius) {
    model.sphere.setRadius(radius);
    publicAPI.modified();
  };

  publicAPI.getSphereRadius = function () {
    return model.sphere.getRadius();
  };

  publicAPI.getBounds = function () {
    var radius = model.sphere.getRadius();
    var center = model.sphere.getCenter();
    var bounds = [];
    bounds[0] = model.placeFactor * (center[0] - radius);
    bounds[1] = model.placeFactor * (center[0] + radius);
    bounds[2] = model.placeFactor * (center[1] - radius);
    bounds[3] = model.placeFactor * (center[1] + radius);
    bounds[4] = model.placeFactor * (center[2] - radius);
    bounds[5] = model.placeFactor * (center[2] + radius);
    return bounds;
  };

  publicAPI.setWorldPosition = function (position) {
    model.sphere.setCenter(position);
    superClass.setWorldPosition(model.sphere.getCenter());
  };

  publicAPI.setDisplayPosition = function (position) {
    superClass.setDisplayPosition(position);
    publicAPI.setWorldPosition(model.worldPosition.getValue());
  };

  publicAPI.setHandleSize = function (size) {
    superClass.setHandleSize(size);
    model.currentHandleSize = model.handleSize;
  };

  publicAPI.computeInteractionState = function (pos) {
    model.visibility = 1;
    var pos3d = [pos[0], pos[1], 0.0];
    model.cursorPicker.pick(pos3d, model.renderer);
    var pickedActor = model.cursorPicker.getDataSet();

    if (pickedActor) {
      model.interactionState = InteractionState.SELECTING;
    } else {
      model.interactionState = InteractionState.OUTSIDE;

      if (model.activeRepresentation) {
        model.visibility = 0;
      }
    }

    return model.interactionState;
  };

  publicAPI.determineConstraintAxis = function (constraint, x) {
    // Look for trivial cases
    if (!model.constrained) {
      return -1;
    }

    if (constraint >= 0 && constraint < 3) {
      return constraint;
    } // Okay, figure out constraint. First see if the choice is
    // outside the hot spot


    if (!model.waitingForMotion) {
      var pickedPosition = model.cursorPicker.getPickPosition();
      var d2 = distance2BetweenPoints(pickedPosition, model.startEventPosition);
      var tol = model.hotSpotSize * model.initialLength;

      if (d2 > tol * tol) {
        model.waitingForMotion = 0;
        return model.cursorPicker.getCellId();
      }

      model.waitingForMotion = 1;
      model.waitCount = 0;
      return -1;
    }

    if (model.waitingForMotion && x) {
      model.waitingForMotion = 0;
      var v = [];
      v[0] = Math.abs(x[0] - model.startEventPosition[0]);
      v[1] = Math.abs(x[1] - model.startEventPosition[1]);
      v[2] = Math.abs(x[2] - model.startEventPosition[2]);

      if (v[0] > v[1]) {
        return v[0] > v[2] ? 0 : 2;
      }

      return v[1] > v[2] ? 1 : 2;
    }

    return -1;
  };

  publicAPI.startComplexWidgetInteraction = function (startEventPos) {
    // Record the current event position, and the rectilinear wipe position.
    model.startEventPosition[0] = startEventPos[0];
    model.startEventPosition[1] = startEventPos[1];
    model.startEventPosition[2] = 0.0;
    model.lastEventPosition[0] = startEventPos[0];
    model.lastEventPosition[1] = startEventPos[1];
    var pos = [startEventPos[0], startEventPos[1], 0];
    model.cursorPicker.pick(pos, model.renderer);
    var pickedActor = model.cursorPicker.getDataSet();

    if (pickedActor) {
      model.interactionState = InteractionState.SELECTING;
      model.constraintAxis = publicAPI.determineConstraintAxis(-1, null);
      model.lastPickPosition = model.cursorPicker.getPickPosition();
    } else {
      model.interactionState = InteractionState.OUTSIDE;
      model.constraintAxis = -1;
    }
  };

  publicAPI.displayToWorld = function (eventPos, z) {
    return vtkInteractorObserver.computeDisplayToWorld(model.renderer, eventPos[0], eventPos[1], z);
  };

  publicAPI.complexWidgetInteraction = function (eventPos) {
    var focalPoint = vtkInteractorObserver.computeWorldToDisplay(model.renderer, model.lastPickPosition[0], model.lastPickPosition[1], model.lastPickPosition[2]);
    var z = focalPoint[2];
    var prevPickPoint = publicAPI.displayToWorld(model.lastEventPosition, z);
    var pickPoint = publicAPI.displayToWorld(eventPos, z);

    if (model.interactionState === InteractionState.SELECTING || model.interactionState === InteractionState.TRANSLATING) {
      if (!model.waitingForMotion || model.waitCount++ > 3) {
        model.constraintAxis = publicAPI.determineConstraintAxis(model.constraintAxis, pickPoint);

        if (model.interactionState === InteractionState.SELECTING && !model.translationMode) {
          publicAPI.moveFocus(prevPickPoint, pickPoint);
        } else {
          publicAPI.translate(prevPickPoint, pickPoint);
        }
      }
    } else if (model.interactionState === InteractionState.SCALING) {
      publicAPI.scale(prevPickPoint, pickPoint, eventPos);
    }

    model.lastEventPosition[0] = eventPos[0];
    model.lastEventPosition[1] = eventPos[1];
    publicAPI.modified();
  };

  publicAPI.moveFocus = function (p1, p2) {
    // get the motion vector
    var v = [];
    v[0] = p2[0] - p1[0];
    v[1] = p2[1] - p1[1];
    v[2] = p2[2] - p1[2];
    var focus = model.sphere.getCenter();

    if (model.constraintAxis >= 0) {
      focus[model.constraintAxis] += v[model.constraintAxis];
    } else {
      focus[0] += v[0];
      focus[1] += v[1];
      focus[2] += v[2];
    }

    publicAPI.setWorldPosition(focus);
  };

  publicAPI.translate = function (p1, p2) {
    // get the motion vector
    var v = [];
    v[0] = p2[0] - p1[0];
    v[1] = p2[1] - p1[1];
    v[2] = p2[2] - p1[2];
    var pos = model.sphere.getCenter();

    if (model.constraintAxis >= 0) {
      // move along axis
      for (var i = 0; i < 3; i++) {
        if (i !== model.constraintAxis) {
          v[i] = 0.0;
        }
      }
    }

    var newFocus = [];

    for (var _i2 = 0; _i2 < 3; _i2++) {
      newFocus[_i2] = pos[_i2] + v[_i2];
    }

    publicAPI.setWorldPosition(newFocus);
    var radius = publicAPI.sizeHandlesInPixels(1.0, newFocus);
    radius *= model.currentHandleSize / model.handleSize;
    model.sphere.setRadius(radius);
  };

  publicAPI.sizeBounds = function () {
    var center = model.sphere.getCenter();
    var radius = publicAPI.sizeHandlesInPixels(1.0, center);
    radius *= model.currentHandleSize / model.handleSize;
    model.sphere.setRadius(radius);
  };

  publicAPI.scale = function (p1, p2, eventPos) {
    // get the motion vector
    var v = [];
    v[0] = p2[0] - p1[0];
    v[1] = p2[1] - p1[1];
    v[2] = p2[2] - p1[2];
    var bounds = publicAPI.getBounds(); // Compute the scale factor

    var sf = norm(v) / Math.sqrt((bounds[1] - bounds[0]) * (bounds[1] - bounds[0]) + (bounds[3] - bounds[2]) * (bounds[3] - bounds[2]) + (bounds[5] - bounds[4]) * (bounds[5] - bounds[4]));

    if (eventPos[1] > model.lastEventPosition[1]) {
      sf += 1.0;
    } else {
      sf = 1.0 - sf;
    }

    model.currentHandleSize *= sf;
    model.currentHandleSize = model.currentHandleSize < 0.001 ? 0.001 : model.currentHandleSize;
    publicAPI.sizeBounds();
  };

  publicAPI.highlight = function (highlight) {
    if (highlight) {
      publicAPI.applyProperty(model.selectProperty);
    } else {
      publicAPI.applyProperty(model.property);
    }
  };

  publicAPI.buildRepresentation = function () {
    if (model.renderer) {
      if (!model.placed) {
        model.validPick = 1;
        model.placed = 1;
      }

      publicAPI.sizeBounds();
      model.sphere.update();
      publicAPI.modified();
    }
  };

  publicAPI.applyProperty = function (property) {
    model.actor.setProperty(property);
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  actor: null,
  mapper: null,
  sphere: null,
  cursorPicker: null,
  lastPickPosition: [0, 0, 0],
  lastEventPosition: [0, 0],
  constraintAxis: -1,
  translationMode: 1,
  property: null,
  selectProperty: null,
  placeFactor: 1,
  waitingForMotion: 0,
  hotSpotSize: 0.05
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkHandleRepresentation.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['glyphResolution', 'defaultScale']);
  macro.setGet(publicAPI, model, ['translationMode', 'property', 'selectProperty']);
  macro.get(publicAPI, model, ['actor']);
  model.sphere = vtkSphereSource.newInstance();
  model.sphere.setThetaResolution(16);
  model.sphere.setPhiResolution(8);
  model.mapper = vtkMapper.newInstance();
  model.mapper.setInputConnection(model.sphere.getOutputPort());
  model.actor = vtkActor.newInstance({
    parentProp: publicAPI
  });
  model.actor.setMapper(model.mapper);
  publicAPI.setHandleSize(15);
  model.currentHandleSize = model.handleSize;
  model.cursorPicker = vtkCellPicker.newInstance();
  model.cursorPicker.setPickFromList(1);
  model.cursorPicker.initializePickList();
  model.cursorPicker.addPickList(model.actor);
  model.property = vtkProperty.newInstance();
  model.property.setColor(1, 1, 1);
  model.selectProperty = vtkProperty.newInstance();
  model.selectProperty.setColor(0, 1, 0);
  model.actor.setProperty(model.property); // Object methods

  vtkSphereHandleRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkSphereHandleRepresentation'); // ----------------------------------------------------------------------------

var vtkSphereHandleRepresentation$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkSphereHandleRepresentation$1 as default, extend, newInstance };
