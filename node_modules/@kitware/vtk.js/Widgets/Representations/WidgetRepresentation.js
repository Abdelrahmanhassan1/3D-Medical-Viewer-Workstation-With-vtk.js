import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import macro from '../../macros.js';
import vtkProp from '../../Rendering/Core/Prop.js';
import { g as subtract, d as dot } from '../../Common/Core/Math/index.js';
import { Behavior } from './WidgetRepresentation/Constants.js';
import { RenderingTypes } from '../Core/WidgetManager/Constants.js';
import { CATEGORIES } from '../../Rendering/Core/Mapper/CoincidentTopologyHelper.js';

var vtkErrorMacro = macro.vtkErrorMacro,
    vtkWarningMacro = macro.vtkWarningMacro; // ----------------------------------------------------------------------------

var STYLE_CATEGORIES = ['active', 'inactive', 'static'];
function mergeStyles(elementNames) {
  for (var _len = arguments.length, stylesToMerge = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    stylesToMerge[_key - 1] = arguments[_key];
  }

  var newStyleObject = {
    active: {},
    inactive: {},
    static: {}
  };
  STYLE_CATEGORIES.forEach(function (category) {
    var cat = newStyleObject[category];
    elementNames.forEach(function (name) {
      if (!cat[name]) {
        cat[name] = {};
      }

      stylesToMerge.filter(function (s) {
        return s && s[category] && s[category][name];
      }).forEach(function (s) {
        return Object.assign(cat[name], s[category][name]);
      });
    });
  });
  return newStyleObject;
} // ----------------------------------------------------------------------------

function applyStyles(pipelines, styles, activeActor) {
  if (!activeActor) {
    // static
    Object.keys(styles.static).forEach(function (name) {
      if (pipelines[name]) {
        pipelines[name].actor.getProperty().set(styles.static[name]);
      }
    }); // inactive

    Object.keys(styles.inactive).forEach(function (name) {
      if (pipelines[name]) {
        pipelines[name].actor.getProperty().set(styles.inactive[name]);
      }
    });
  } else {
    Object.keys(pipelines).forEach(function (name) {
      var style = pipelines[name].actor === activeActor ? styles.active[name] : styles.inactive[name];

      if (style) {
        pipelines[name].actor.getProperty().set(style);
      }
    });
  }
} // ----------------------------------------------------------------------------

function connectPipeline(pipeline) {
  if (pipeline.source.isA('vtkDataSet')) {
    pipeline.mapper.setInputData(pipeline.source);
  } else {
    pipeline.mapper.setInputConnection(pipeline.source.getOutputPort());
  }

  if (pipeline.glyph) {
    pipeline.mapper.setInputConnection(pipeline.glyph.getOutputPort(), 1);
  }

  pipeline.actor.setMapper(pipeline.mapper);
} // ----------------------------------------------------------------------------
// vtkWidgetRepresentation
// ----------------------------------------------------------------------------

function vtkWidgetRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWidgetRepresentation'); // Internal cache

  var cache = {
    mtimes: {},
    states: []
  }; // --------------------------------------------------------------------------

  publicAPI.getActors = function () {
    return model.actors;
  };

  publicAPI.getNestedProps = publicAPI.getActors; // --------------------------------------------------------------------------

  publicAPI.setLabels = function () {
    for (var _len2 = arguments.length, labels = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      labels[_key2] = arguments[_key2];
    }

    if (labels.length === 1) {
      model.labels = [].concat(labels[0]);
    } else {
      model.labels = labels;
    }

    publicAPI.modified();
  };

  publicAPI.getRepresentationStates = function () {
    var input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : model.inputData[0];

    if (cache.mtimes.representation === publicAPI.getMTime() && cache.mtimes.input === input.getMTime()) {
      return cache.states;
    } // Reinitialize cache


    cache.mtimes.representation = publicAPI.getMTime();
    cache.mtimes.input = input.getMTime();
    cache.states = []; // Fill states that are going to be used in the representation

    model.labels.forEach(function (name) {
      cache.states = cache.states.concat(input.getStatesWithLabel(name) || []);
    });
    return cache.states;
  };

  publicAPI.getSelectedState = function (prop, compositeID) {
    var representationStates = publicAPI.getRepresentationStates();

    if (compositeID < representationStates.length) {
      return representationStates[compositeID];
    }

    vtkErrorMacro("Representation ".concat(publicAPI.getClassName(), " should implement getSelectedState(prop, compositeID) method."));
    return null;
  };

  publicAPI.updateActorVisibility = function () {
    var renderingType = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : RenderingTypes.FRONT_BUFFER;
    var ctxVisible = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var handleVisible = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    var otherFlag = true;

    switch (model.behavior) {
      case Behavior.HANDLE:
        otherFlag = renderingType === RenderingTypes.PICKING_BUFFER || handleVisible;
        break;

      case Behavior.CONTEXT:
        otherFlag = ctxVisible;
        break;

      default:
        otherFlag = true;
        break;
    }

    var visibilityFlag = otherFlag;

    for (var i = 0; i < model.actors.length; i++) {
      if (model.visibilityFlagArray) {
        model.actors[i].setVisibility(visibilityFlag && model.visibilityFlagArray[i]);
      } else {
        model.actors[i].setVisibility(visibilityFlag);
      }
    }

    if (model.alwaysVisibleActors) {
      for (var _i = 0; _i < model.alwaysVisibleActors.length; _i++) {
        model.alwaysVisibleActors[_i].setVisibility(true);
      }
    }
  };

  function applyCoincidentTopologyParametersToMapper(mapper, parameters) {
    if (mapper && mapper.setResolveCoincidentTopologyToPolygonOffset) {
      mapper.setResolveCoincidentTopologyToPolygonOffset();
      CATEGORIES.forEach(function (category) {
        if (parameters[category]) {
          var methodName = "setRelativeCoincidentTopology".concat(category, "OffsetParameters");

          if (mapper[methodName]) {
            var _parameters$category = parameters[category],
                factor = _parameters$category.factor,
                offset = _parameters$category.offset;
            mapper[methodName](factor, offset);
          }
        }
      });
    }
  } // Add warning to model.actors.push


  model.actors.push = function () {
    vtkWarningMacro('You should use publicAPI.addActor() to initialize the actor properly');

    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    args.forEach(function (actor) {
      return publicAPI.addActor(actor);
    });
  };

  publicAPI.addActor = function (actor) {
    applyCoincidentTopologyParametersToMapper(actor.getMapper(), model.coincidentTopologyParameters);
    Array.prototype.push.apply(model.actors, [actor]);
  };

  publicAPI.setCoincidentTopologyParameters = function (parameters) {
    model.coincidentTopologyParameters = parameters;
    publicAPI.getActors().forEach(function (actor) {
      applyCoincidentTopologyParametersToMapper(actor.getMapper(), model.coincidentTopologyParameters);
    });
  };

  publicAPI.getPixelWorldHeightAtCoord = function (worldCoord) {
    var _model$displayScalePa = model.displayScaleParams,
        dispHeightFactor = _model$displayScalePa.dispHeightFactor,
        cameraPosition = _model$displayScalePa.cameraPosition,
        cameraDir = _model$displayScalePa.cameraDir,
        isParallel = _model$displayScalePa.isParallel,
        rendererPixelDims = _model$displayScalePa.rendererPixelDims;
    var scale = 1;

    if (isParallel) {
      scale = dispHeightFactor;
    } else {
      var worldCoordToCamera = _toConsumableArray(worldCoord);

      subtract(worldCoordToCamera, cameraPosition, worldCoordToCamera);
      scale = dot(worldCoordToCamera, cameraDir) * dispHeightFactor;
    }

    var rHeight = rendererPixelDims[1];
    return scale / rHeight;
  }; // Make sure setting the labels at build time works with string/array...


  publicAPI.setLabels(model.labels);
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  actors: [],
  labels: [],
  behavior: Behavior.CONTEXT,
  coincidentTopologyParameters: {
    Point: {
      factor: -1.0,
      offset: -1.0
    },
    Line: {
      factor: -1.0,
      offset: -1.0
    },
    Polygon: {
      factor: -1.0,
      offset: -1.0
    }
  },
  scaleInPixels: false,
  displayScaleParams: {
    dispHeightFactor: 1,
    cameraPosition: [0, 0, 0],
    cameraDir: [1, 0, 0],
    isParallel: false,
    rendererPixelDims: [1, 1]
  }
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Object methods

  vtkProp.extend(publicAPI, model, initialValues);
  macro.algo(publicAPI, model, 1, 1);
  macro.get(publicAPI, model, ['labels', 'coincidentTopologyParameters']);
  macro.set(publicAPI, model, ['displayScaleParams']);
  macro.setGet(publicAPI, model, ['scaleInPixels']); // Object specific methods

  vtkWidgetRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var vtkWidgetRepresentation$1 = {
  extend: extend,
  mergeStyles: mergeStyles,
  applyStyles: applyStyles,
  connectPipeline: connectPipeline
};

export { applyStyles, connectPipeline, vtkWidgetRepresentation$1 as default, extend, mergeStyles };
