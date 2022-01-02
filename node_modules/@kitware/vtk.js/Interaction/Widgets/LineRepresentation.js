import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import _defineProperty from '@babel/runtime/helpers/defineProperty';
import Constants from './LineRepresentation/Constants.js';
import macro from '../../macros.js';
import vtkActor from '../../Rendering/Core/Actor.js';
import vtkBoundingBox from '../../Common/DataModel/BoundingBox.js';
import vtkBox from '../../Common/DataModel/Box.js';
import vtkLine from '../../Common/DataModel/Line.js';
import vtkLineSource from '../../Filters/Sources/LineSource.js';
import vtkMapper from '../../Rendering/Core/Mapper.js';
import vtkProperty from '../../Rendering/Core/Property.js';
import vtkSphereHandleRepresentation from './SphereHandleRepresentation.js';
import vtkWidgetRepresentation from './WidgetRepresentation.js';
import { InteractionState } from './HandleRepresentation/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var State = Constants.State,
    Restrict = Constants.Restrict; // ----------------------------------------------------------------------------
// vtkLineRepresentation methods
// ----------------------------------------------------------------------------

function vtkLineRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLineRepresentation');

  var superClass = _objectSpread({}, publicAPI);

  publicAPI.setResolution = function (res) {
    model.lineSource.setResolution(res);
  };

  publicAPI.setLineVisibility = function (visibility) {
    model.lineActor.setVisibility(visibility);
  };

  publicAPI.setPoint1Visibility = function (visibility) {
    model.point1Representation.getActors()[0].setVisibility(visibility);
  };

  publicAPI.setPoint2Visibility = function (visibility) {
    model.point2Representation.getActors()[0].setVisibility(visibility);
  };

  publicAPI.getResolution = function () {
    return model.lineSource.getResolution();
  };

  publicAPI.getPoint1WorldPosition = function () {
    return model.point1Representation.getWorldPosition();
  };

  publicAPI.getPoint2WorldPosition = function () {
    return model.point2Representation.getWorldPosition();
  };

  publicAPI.getPoint1DisplayPosition = function () {
    return model.point1Representation.getDisplayPosition();
  };

  publicAPI.getPoint2DisplayPosition = function () {
    return model.point2Representation.getDisplayPosition();
  };

  publicAPI.setPoint1WorldPosition = function (pos) {
    var _model$lineSource;

    model.point1Representation.setWorldPosition(pos);

    (_model$lineSource = model.lineSource).setPoint1.apply(_model$lineSource, _toConsumableArray(pos));
  };

  publicAPI.setPoint2WorldPosition = function (pos) {
    var _model$lineSource2;

    model.point2Representation.setWorldPosition(pos);

    (_model$lineSource2 = model.lineSource).setPoint2.apply(_model$lineSource2, _toConsumableArray(pos));
  };

  publicAPI.setPoint1DisplayPosition = function (pos) {
    model.point1Representation.setDisplayPosition(pos);
    var p = model.point1Representation.getWorldPosition();
    model.point1Representation.setWorldPosition(p);
  };

  publicAPI.setPoint2DisplayPosition = function (pos) {
    model.point2Representation.setDisplayPosition(pos);
    var p = model.point2Representation.getWorldPosition();
    model.point2Representation.setWorldPosition(p);
  };

  publicAPI.setRenderer = function (renderer) {
    model.point1Representation.setRenderer(renderer);
    model.point2Representation.setRenderer(renderer);
    superClass.setRenderer(renderer);
  };

  publicAPI.startComplexWidgetInteraction = function (startEventPos) {
    // Store the start position
    model.startEventPosition[0] = startEventPos[0];
    model.startEventPosition[1] = startEventPos[1];
    model.startEventPosition[2] = 0.0;
    model.lastEventPosition[0] = startEventPos[0];
    model.lastEventPosition[1] = startEventPos[1];
    model.lastEventPosition[2] = 0.0;
    model.startP1 = model.point1Representation.getWorldPosition();
    model.startP2 = model.point2Representation.getWorldPosition();

    if (model.interactionState === State.SCALING) {
      var dp1 = model.point1Representation.getDisplayPosition();
      var dp2 = model.point2Representation.getDisplayPosition();
      model.length = Math.sqrt((dp1[0] - dp2[0]) * (dp1[0] - dp2[0]) + (dp1[1] - dp2[1]) * (dp1[1] - dp2[1]));
    }
  };

  publicAPI.complexWidgetInteraction = function (e) {
    if (model.interactionState === State.ONP1) {
      if (model.restrictFlag !== 0) {
        var x = model.point1Representation.getWorldPosition();

        for (var i = 0; i < 3; i++) {
          x[i] = model.restrictFlag === i + 1 ? x[i] : model.startP1[i];
        }

        model.point1Representation.setWorldPosition(x);
      }
    } else if (model.interactionState === State.ONP2) {
      if (model.restrictFlag !== 0) {
        var _x = model.point2Representation.getWorldPosition();

        for (var _i = 0; _i < 3; _i++) {
          _x[_i] = model.restrictFlag === _i + 1 ? _x[_i] : model.startP2[_i];
        }

        model.point2Representation.setWorldPosition(_x);
      }
    } else if (model.interactionState === State.ONLINE) ; else if (model.interactionState === State.SCALING) ; else if (model.interactionState === State.TRANSLATINGP1) {
      var _x2 = model.point1Representation.getWorldPosition();

      var p2 = [];

      for (var _i2 = 0; _i2 < 3; _i2++) {
        p2[_i2] = model.startP2[_i2] + (_x2[_i2] - model.startP1[_i2]);
      }

      model.point1Representation.setWorldPosition(p2);
    } else if (model.interactionState === State.TRANSLATINGP2) {
      var _x3 = model.point2Representation.getWorldPosition();

      var _p = [];

      for (var _i3 = 0; _i3 < 3; _i3++) {
        _p[_i3] = model.startP1[_i3] + (_x3[_i3] - model.startP2[_i3]);
      }

      model.point2Representation.setWorldPosition(_p);
    }

    model.lastEventPosition[0] = e[0];
    model.lastEventPosition[1] = e[1];
    model.lastEventPosition[2] = 0.0;
    publicAPI.modified();
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

    var placeFactorTemp = model.placeFactor;
    model.placeFactor = 1.0;
    var newBounds = [];
    var center = [];
    publicAPI.adjustBounds(boundsArray, newBounds, center);
    model.placeFactor = placeFactorTemp;

    for (var _i4 = 0; _i4 < 6; _i4++) {
      model.initialBounds[_i4] = newBounds[_i4];
    }

    model.initialLength = Math.sqrt((newBounds[1] - newBounds[0]) * (newBounds[1] - newBounds[0]) + (newBounds[3] - newBounds[2]) * (newBounds[3] - newBounds[2]) + (newBounds[5] - newBounds[4]) * (newBounds[5] - newBounds[4])); // When PlaceWidget() is invoked, the widget orientation is preserved, but it
    // is allowed to translate and scale. This means it is centered in the
    // bounding box, and the representation scales itself to intersect the sides
    // of the bounding box. Thus we have to determine where Point1 and Point2
    // intersect the bounding box.

    var p1 = model.lineSource.getPoint1();
    var p2 = model.lineSource.getPoint2();
    var r = [model.initialLength * (p1[0] - p2[0]), model.initialLength * (p1[1] - p2[1]), model.initialLength * (p1[2] - p2[2])];
    var o = [center[0] - r[0], center[1] - r[1], center[2] - r[2]];
    var placedP1 = [];
    var t = [];
    vtkBoundingBox.intersectBox(boundsArray, o, r, placedP1, t);
    publicAPI.setPoint1WorldPosition(placedP1);
    r[0] = model.initialLength * (p2[0] - p1[0]);
    r[1] = model.initialLength * (p2[1] - p1[1]);
    r[2] = model.initialLength * (p2[2] - p1[2]);
    o[0] = center[0] - r[0];
    o[1] = center[1] - r[1];
    o[2] = center[2] - r[2];
    var placedP2 = [];
    vtkBoundingBox.intersectBox(boundsArray, o, r, placedP2, t);
    publicAPI.setPoint2WorldPosition(placedP2);
    model.placed = 1;
    model.validPick = 1;
    publicAPI.buildRepresentation();
  };

  publicAPI.computeInteractionState = function (pos) {
    var p1State = model.point1Representation.computeInteractionState(pos);
    var p2State = model.point2Representation.computeInteractionState(pos);

    if (p1State === InteractionState.SELECTING) {
      model.interactionState = State.ONP1;
      publicAPI.setRepresentationState(State.ONP1);
    } else if (p2State === InteractionState.SELECTING) {
      model.interactionState = State.ONP2;
      publicAPI.setRepresentationState(State.ONP2);
    } else {
      model.interactionState = State.OUTSIDE;
    }

    if (model.interactionState !== State.OUTSIDE) {
      return model.interactionState;
    }

    var pos1 = publicAPI.getPoint1DisplayPosition();
    var pos2 = publicAPI.getPoint2DisplayPosition();
    var xyz = [pos[0], pos[1], 0.0];
    var p1 = [pos1[0], pos1[1], 0.0];
    var p2 = [pos2[0], pos2[1], 0.0];
    var tol = model.tolerance * model.tolerance;
    var out = vtkLine.distanceToLine(xyz, p1, p2);
    var onLine = out.distance <= tol;

    if (onLine && out.t < 1.0 && out.t > 0.0) {
      model.interactionState = State.ONLINE;
      publicAPI.setRepresentationState(State.ONLINE);
      pos1 = publicAPI.getPoint1WorldPosition();
      pos2 = publicAPI.getPoint2WorldPosition(); // TODO
      // model.linePicker.pick(pos[0], pos[1], 0.0, model.renderer);
      // const closest = model.linePicker.getPickPosition();
      // model.lineHandleRepresentation.setWorldPosition(closest);
    } else {
      model.interactionState = State.OUTSIDE;
      publicAPI.setRepresentationState(State.OUTSIDE);
    }

    return model.interactionState;
  };

  publicAPI.setRepresentationState = function (state) {
    if (model.representationState === state) {
      return;
    }

    model.representationState = state;
    publicAPI.modified();

    if (state === State.OUTSIDE) {
      publicAPI.highlightPoint(0, 0);
      publicAPI.highlightPoint(1, 0);
      publicAPI.highlightLine(0);
    } else if (state === State.ONP1) {
      publicAPI.highlightPoint(0, 1);
      publicAPI.highlightPoint(1, 0);
      publicAPI.highlightLine(0);
    } else if (state === State.ONP2) {
      publicAPI.highlightPoint(0, 0);
      publicAPI.highlightPoint(1, 1);
      publicAPI.highlightLine(0);
    } else if (state === State.ONLINE) {
      publicAPI.highlightPoint(0, 0);
      publicAPI.highlightPoint(1, 0);
      publicAPI.highlightLine(1);
    } else {
      publicAPI.highlightPoint(0, 1);
      publicAPI.highlightPoint(1, 1);
      publicAPI.highlightLine(1);
    }
  };

  publicAPI.sizeHandles = function () {// Removed because radius is always close to 0
    // let radius = publicAPI.sizeHandlesInPixels(1.35, model.lineSource.getPoint1());
    // model.point1Representation.setHandleSize(radius);
    // radius = publicAPI.sizeHandlesInPixels(1.35, model.lineSource.getPoint2());
    // model.point2Representation.setHandleSize(radius);
  };

  publicAPI.buildRepresentation = function () {
    var _model$lineSource3, _model$lineSource4;

    model.point1Representation.buildRepresentation();
    model.point2Representation.buildRepresentation();

    if (model.initializeDisplayPosition === 0 && model.renderer) {
      publicAPI.setPoint1WorldPosition(model.lineSource.getPoint1());
      publicAPI.setPoint2WorldPosition(model.lineSource.getPoint2());
      model.validPick = 1;
      model.initializeDisplayPosition = 1;
    }

    model.point1Representation.setTolerance(model.tolerance);
    model.point2Representation.setTolerance(model.tolerance); // TODO
    // model.lineHandleRepresentation.setTolerance(model.tolerance);

    var x1 = publicAPI.getPoint1WorldPosition();

    (_model$lineSource3 = model.lineSource).setPoint1.apply(_model$lineSource3, _toConsumableArray(x1));

    model.point1Representation.setWorldPosition(x1);
    var x2 = publicAPI.getPoint2WorldPosition();

    (_model$lineSource4 = model.lineSource).setPoint2.apply(_model$lineSource4, _toConsumableArray(x2));

    model.point2Representation.setWorldPosition(x2);
    publicAPI.sizeHandles();
    publicAPI.modified();
  };

  publicAPI.highlightPoint = function (pointId, highlight) {
    if (pointId === 0) {
      if (highlight) {
        model.point1Representation.applyProperty(model.selectedEndPointProperty);
      } else {
        model.point1Representation.applyProperty(model.endPointProperty);
      }
    } else if (pointId === 1) {
      if (highlight) {
        model.point2Representation.applyProperty(model.selectedEndPoint2Property);
      } else {
        model.point2Representation.applyProperty(model.endPoint2Property);
      }
    } else ;
  };

  publicAPI.highlightLine = function (highlight) {
    if (highlight) {
      model.lineActor.setProperty(model.selectedLineProperty);
    } else {
      model.lineActor.setProperty(model.lineProperty);
    }
  };

  publicAPI.setLineColor = function () {
    var col = [];

    if (Array.isArray(arguments.length <= 0 ? undefined : arguments[0])) {
      col = arguments.length <= 0 ? undefined : arguments[0];
    } else {
      for (var i = 0; i < arguments.length; i++) {
        col.push(i < 0 || arguments.length <= i ? undefined : arguments[i]);
      }
    }

    if (col.length !== 3) {
      return;
    }

    if (model.lineActor.getProperty()) {
      model.lineActor.getProperty().setColor(col[0], col[1], col[2]);
    }
  };

  publicAPI.clampPosition = function (x) {
    for (var i = 0; i < 3; i++) {
      if (x[i] < model.initialBounds[2 * i]) {
        x[i] = model.initialBounds[2 * i];
      }

      if (x[i] > model.initialBounds[2 * i + 1]) {
        x[i] = model.initialBounds[2 * i + 1];
      }
    }
  };

  publicAPI.getBounds = function () {
    model.boundingBox.setBounds(model.lineActor.getBounds());
    model.boundingBox.addBounds(model.point1Representation.getBounds());
    model.boundingBox.addBounds(model.point2Representation.getBounds());
    return model.boundingBox.getBounds();
  };

  publicAPI.getActors = function () {
    var actors = [];
    actors.push.apply(actors, _toConsumableArray(model.point1Representation.getActors()));
    actors.push.apply(actors, _toConsumableArray(model.point2Representation.getActors()));
    actors.push(model.lineActor);
    return actors;
  };

  publicAPI.getNestedProps = function () {
    return publicAPI.getActors();
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  point1Representation: null,
  point2Representation: null,
  lineSource: null,
  lineMapper: null,
  lineActor: null,
  endPointProperty: null,
  selectedEndPointProperty: null,
  endPoint2Property: null,
  selectedEndPoint2Property: null,
  lineProperty: null,
  selectedLineProperty: null,
  tolerance: 5,
  placed: 0,
  representationState: State.OUTSIDE,
  startP1: [0.0, 0.0, 0.0],
  startP2: [0.0, 0.0, 0.0],
  length: 0.0,
  restrictFlag: Restrict.NONE,
  initializeDisplayPosition: 0,
  boundingBox: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkWidgetRepresentation.extend(publicAPI, model, initialValues); // Getters/Setters

  macro.get(publicAPI, model, ['point1Representation', 'point2Representation', 'endPointProperty', 'selectedEndPointProperty', 'endPoint2Property', 'selectedEndPoint2Property', 'lineProperty', 'selectedLineProperty']);
  publicAPI.setHandleSize(5);
  model.boundingBox = vtkBox.newInstance();
  model.point1Representation = vtkSphereHandleRepresentation.newInstance();
  model.point2Representation = vtkSphereHandleRepresentation.newInstance();
  var handleSize = 10;
  model.point1Representation.setHandleSize(handleSize);
  model.point2Representation.setHandleSize(handleSize); // model.point1Representation.setSphereRadius(0.01);
  // model.point2Representation.setSphereRadius(0.01);
  // Line

  model.lineSource = vtkLineSource.newInstance({
    point1: [-0.5, 0, 0],
    point2: [0.5, 0, 0],
    resolution: 5
  });
  model.lineSource.setResolution(5);
  model.lineMapper = vtkMapper.newInstance();
  model.lineMapper.setInputConnection(model.lineSource.getOutputPort());
  model.lineActor = vtkActor.newInstance({
    parentProp: publicAPI
  });
  model.lineActor.setMapper(model.lineMapper); // Default properties

  model.endPointProperty = vtkProperty.newInstance();
  model.endPointProperty.setColor(1, 1, 1);
  model.selectedEndPointProperty = vtkProperty.newInstance();
  model.selectedEndPointProperty.setColor(0, 1, 0);
  model.endPoint2Property = vtkProperty.newInstance();
  model.endPoint2Property.setColor(1, 1, 1);
  model.selectedEndPoint2Property = vtkProperty.newInstance();
  model.selectedEndPoint2Property.setColor(0, 1, 0);
  model.lineProperty = vtkProperty.newInstance();
  model.lineProperty.setAmbient(1.0);
  model.lineProperty.setAmbientColor(1.0, 1.0, 1.0);
  model.lineProperty.setLineWidth(2.0);
  model.selectedLineProperty = vtkProperty.newInstance();
  model.selectedLineProperty.setAmbient(1.0);
  model.selectedLineProperty.setColor(0.0, 1.0, 0.0);
  model.selectedLineProperty.setLineWidth(2.0); // Pass the initial properties to the actor

  model.point1Representation.applyProperty(model.endPointProperty);
  model.point2Representation.applyProperty(model.endPoint2Property);
  model.point1Representation.setWorldPosition(model.lineSource.getPoint1());
  model.point2Representation.setWorldPosition(model.lineSource.getPoint2());
  model.lineActor.setProperty(model.lineProperty); // Object methods

  vtkLineRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkLineRepresentation'); // ----------------------------------------------------------------------------

var vtkLineRepresentation$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkLineRepresentation$1 as default, extend, newInstance };
