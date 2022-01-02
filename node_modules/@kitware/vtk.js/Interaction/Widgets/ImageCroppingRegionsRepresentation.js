import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import macro from '../../macros.js';
import { f as distance2BetweenPoints } from '../../Common/Core/Math/index.js';
import vtkCellPicker from '../../Rendering/Core/CellPicker.js';
import vtkActor from '../../Rendering/Core/Actor.js';
import vtkWidgetRepresentation from './WidgetRepresentation.js';
import vtkMapper from '../../Rendering/Core/Mapper.js';
import vtkPolyData from '../../Common/DataModel/PolyData.js';
import vtkSphereSource from '../../Filters/Sources/SphereSource.js';
import Constants from './ImageCroppingRegionsWidget/Constants.js';

var TOTAL_NUM_HANDLES = Constants.TOTAL_NUM_HANDLES; // prettier-ignore

var LINE_ARRAY = [2, 0, 1, 2, 2, 3, 2, 4, 5, 2, 6, 7, 2, 0, 2, 2, 1, 3, 2, 4, 6, 2, 5, 7, 2, 0, 4, 2, 1, 5, 2, 2, 6, 2, 3, 7]; // ----------------------------------------------------------------------------
// vtkImageCroppingRegionsRepresentation methods
// ----------------------------------------------------------------------------
// Reorders a bounds array such that each (a,b) pairing is a
// (min,max) pairing.

function reorderBounds(bounds) {
  for (var i = 0; i < 6; i += 2) {
    if (bounds[i] > bounds[i + 1]) {
      var tmp = bounds[i + 1];
      bounds[i + 1] = bounds[i];
      bounds[i] = tmp;
    }
  }
}

function vtkImageCroppingRegionsRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageCroppingRegionsRepresentation'); // set fields from parent classes

  model.placeFactor = 1;
  model.picker = vtkCellPicker.newInstance();
  model.picker.setPickFromList(1);
  model.picker.initializePickList();
  model.handles = Array(TOTAL_NUM_HANDLES).fill(null).map(function () {
    var source = vtkSphereSource.newInstance();
    var mapper = vtkMapper.newInstance();
    var actor = vtkActor.newInstance();
    mapper.setInputConnection(source.getOutputPort());
    actor.setMapper(mapper);
    model.picker.addPickList(actor);
    return {
      source: source,
      mapper: mapper,
      actor: actor
    };
  });
  model.outline = {
    polydata: vtkPolyData.newInstance(),
    mapper: vtkMapper.newInstance(),
    actor: vtkActor.newInstance()
  }; // 8 corners for a box

  model.outline.polydata.getPoints().setData(new Float32Array(8 * 3), 3);
  model.outline.polydata.getLines().setData(Uint16Array.from(LINE_ARRAY));
  model.outline.mapper.setInputData(model.outline.polydata);
  model.outline.actor.setMapper(model.outline.mapper); // methods

  publicAPI.getActors = function () {
    var actors = [model.outline.actor];

    for (var i = 0; i < model.handlePositions.length; ++i) {
      if (model.handlePositions[i]) {
        actors.push(model.handles[i].actor);
      }
    }

    return actors;
  };

  publicAPI.getNestedProps = function () {
    return publicAPI.getActors();
  }; // outline mapper substitutes for the crop widget rep mapper


  publicAPI.getMapper = function () {
    return model.outline.mapper;
  };

  publicAPI.getEventIntersection = function (callData) {
    var _callData$position = callData.position,
        x = _callData$position.x,
        y = _callData$position.y,
        z = _callData$position.z;
    model.picker.pick([x, y, z], callData.pokedRenderer);
    var actors = model.picker.getActors();

    if (actors.length) {
      var actorIndex = 0; // get actor closest to camera

      if (actors.length > 1) {
        var dists = model.picker.getPickedPositions().map(function (pt) {
          var camPos = callData.pokedRenderer.getActiveCamera().getPosition();
          return distance2BetweenPoints(camPos, pt);
        });
        var minDist = Infinity;
        dists.forEach(function (d, i) {
          if (minDist > d) {
            actorIndex = i;
            minDist = d;
          }
        });
      }

      var actor = actors[actorIndex];
      return model.handles.findIndex(function (h) {
        return h.actor === actor;
      });
    }

    return -1;
  };

  publicAPI.placeWidget = function () {
    var boundsArray = [];

    for (var i = 0; i < arguments.length; i++) {
      boundsArray.push(i < 0 || arguments.length <= i ? undefined : arguments[i]);
    }

    if (boundsArray.length !== 6) {
      return;
    } // make sure each bounds pairing is monotonic


    reorderBounds(boundsArray);
    var newBounds = [];
    var center = [];
    publicAPI.adjustBounds(boundsArray, newBounds, center);

    for (var _i = 0; _i < 6; _i++) {
      model.initialBounds[_i] = newBounds[_i];
    }

    model.initialLength = Math.sqrt((newBounds[1] - newBounds[0]) * (newBounds[1] - newBounds[0]) + (newBounds[3] - newBounds[2]) * (newBounds[3] - newBounds[2]) + (newBounds[5] - newBounds[4]) * (newBounds[5] - newBounds[4]));
    publicAPI.modified();
  }; // Force update the geometry


  publicAPI.updateGeometry = function () {
    var _model$outline$actor$;

    var outlinePoints = model.outline.polydata.getPoints().getData();

    for (var i = 0; i < model.handles.length; ++i) {
      if (model.handlePositions[i]) {
        var _model$handles$i = model.handles[i],
            actor = _model$handles$i.actor,
            source = _model$handles$i.source;
        source.setRadius(model.handleSizes[i]);
        source.setCenter(model.handlePositions[i]);

        if (model.activeHandleIndex === i) {
          actor.getProperty().setColor(0, 1, 0);
        } else {
          actor.getProperty().setColor(1, 1, 1);
        }
      }
    }

    for (var _i2 = 0; _i2 < model.bboxCorners.length; ++_i2) {
      outlinePoints.set(model.bboxCorners[_i2], _i2 * 3);
    }

    (_model$outline$actor$ = model.outline.actor.getProperty()).setEdgeColor.apply(_model$outline$actor$, _toConsumableArray(model.edgeColor));

    model.outline.polydata.getPoints().modified();
    model.outline.polydata.modified(); // FIXME: Ken we need your feedback
    // Move our mtime without triggering a modified()
    // model.mtime = model.outline.polydata.getMTime();
  }; // FIXME: Ken we need your feedback
  // model.outline.polydata.getPoints().getBounds();


  publicAPI.getBounds = function () {
    return model.initialBounds;
  };

  publicAPI.buildRepresentation = function () {
    if (model.renderer) {
      if (!model.placed) {
        model.validPick = 1;
        model.placed = 1;
      }

      publicAPI.updateGeometry();
    }
  };

  publicAPI.setProperty = function (property) {
    model.actor.setProperty(property);
  }; // modifications will result in geometry updates


  publicAPI.onModified(publicAPI.updateGeometry);
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  activeHandleIndex: -1,
  handlePositions: Array(TOTAL_NUM_HANDLES).fill(null),
  handleSizes: Array(TOTAL_NUM_HANDLES).fill(0),
  bboxCorners: Array(8).fill([0, 0, 0]),
  edgeColor: [1.0, 1.0, 1.0]
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkWidgetRepresentation.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['activeHandleIndex']);
  macro.setGetArray(publicAPI, model, ['edgeColor'], 3);
  macro.setGetArray(publicAPI, model, ['handlePositions'], TOTAL_NUM_HANDLES);
  macro.setGetArray(publicAPI, model, ['handleSizes'], TOTAL_NUM_HANDLES);
  macro.setGetArray(publicAPI, model, ['bboxCorners'], 8); // Object methods

  vtkImageCroppingRegionsRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkImageCroppingRegionsRepresentation'); // ----------------------------------------------------------------------------

var vtkImageCroppingRegionsRepresentation$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkImageCroppingRegionsRepresentation$1 as default, extend, newInstance };
