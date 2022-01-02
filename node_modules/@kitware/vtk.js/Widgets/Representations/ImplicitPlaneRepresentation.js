import macro from '../../macros.js';
import vtkActor from '../../Rendering/Core/Actor.js';
import vtkClosedPolyLineToSurfaceFilter from '../../Filters/General/ClosedPolyLineToSurfaceFilter.js';
import vtkCubeSource from '../../Filters/Sources/CubeSource.js';
import vtkCutter from '../../Filters/Core/Cutter.js';
import vtkCylinderSource from '../../Filters/Sources/CylinderSource.js';
import vtkMapper from '../../Rendering/Core/Mapper.js';
import vtkMatrixBuilder from '../../Common/Core/MatrixBuilder.js';
import vtkPixelSpaceCallbackMapper from '../../Rendering/Core/PixelSpaceCallbackMapper.js';
import vtkPlane from '../../Common/DataModel/Plane.js';
import vtkPolyData from '../../Common/DataModel/PolyData.js';
import vtkSphereSource from '../../Filters/Sources/SphereSource.js';
import vtkStateBuilder from '../Core/StateBuilder.js';
import vtkWidgetRepresentation from './WidgetRepresentation.js';
import WidgetManagerConst from '../Core/WidgetManager/Constants.js';
import PropertyConst from '../../Rendering/Core/Property/Constants.js';

var RenderingTypes = WidgetManagerConst.RenderingTypes;
var Interpolation = PropertyConst.Interpolation,
    Representation = PropertyConst.Representation; // ----------------------------------------------------------------------------
// Static methods to build state
// ----------------------------------------------------------------------------

function generateState() {
  return vtkStateBuilder.createBuilder().addField({
    name: 'origin',
    initialValue: [0, 0, 0]
  }).addField({
    name: 'normal',
    initialValue: [0, 0, 1]
  }).addField({
    name: 'activeHandle',
    initialValue: null
  }).addField({
    name: 'updateMethodName'
  }).build();
} // ----------------------------------------------------------------------------
// Representation style
// ----------------------------------------------------------------------------


var STYLE_PIPELINE_NAMES = ['plane', 'outline', 'normal', 'origin', 'display2D'];
var STYLE_DEFAULT = {
  active: {
    plane: {
      opacity: 1,
      color: [0, 0.9, 0]
    },
    normal: {
      opacity: 1,
      color: [0, 0.9, 0]
    },
    origin: {
      opacity: 1,
      color: [0, 0.9, 0]
    }
  },
  inactive: {
    plane: {
      opacity: 0.6,
      color: [1, 1, 1]
    },
    normal: {
      opacity: 1,
      color: [0.9, 0, 0]
    },
    origin: {
      opacity: 1,
      color: [1, 0, 0]
    }
  },
  static: {
    display2D: {
      representation: Representation.POINT
    },
    outline: {
      color: [1, 1, 1],
      opacity: 1,
      representation: Representation.WIREFRAME,
      interpolation: Interpolation.FLAT
    }
  }
}; // ----------------------------------------------------------------------------
// vtkImplicitPlaneRepresentation methods
// ----------------------------------------------------------------------------

function vtkImplicitPlaneRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImplicitPlaneRepresentation'); // --------------------------------------------------------------------------
  // Internal polydata dataset
  // --------------------------------------------------------------------------

  model.plane = vtkPlane.newInstance();
  model.matrix = vtkMatrixBuilder.buildFromDegree();
  model.pipelines = {};
  model.pipelines.outline = {
    source: vtkCubeSource.newInstance(),
    mapper: vtkMapper.newInstance(),
    actor: vtkActor.newInstance({
      pickable: false,
      parentProp: publicAPI
    })
  };
  model.pipelines.plane = {
    source: vtkClosedPolyLineToSurfaceFilter.newInstance(),
    mapper: vtkMapper.newInstance(),
    actor: vtkActor.newInstance({
      pickable: true,
      parentProp: publicAPI
    })
  };
  model.pipelines.origin = {
    source: vtkSphereSource.newInstance(),
    mapper: vtkMapper.newInstance(),
    actor: vtkActor.newInstance({
      pickable: true,
      parentProp: publicAPI
    })
  };
  model.pipelines.normal = {
    source: vtkCylinderSource.newInstance(),
    mapper: vtkMapper.newInstance(),
    actor: vtkActor.newInstance({
      pickable: true,
      parentProp: publicAPI
    })
  };
  model.pipelines.display2D = {
    source: publicAPI,
    mapper: vtkPixelSpaceCallbackMapper.newInstance(),
    actor: vtkActor.newInstance({
      pickable: false,
      parentProp: publicAPI
    })
  }; // Plane generation pipeline

  var cutter = vtkCutter.newInstance({
    cutFunction: model.plane
  });
  cutter.setInputConnection(model.pipelines.outline.source.getOutputPort());
  model.pipelines.plane.source.setInputConnection(cutter.getOutputPort());
  vtkWidgetRepresentation.connectPipeline(model.pipelines.outline);
  vtkWidgetRepresentation.connectPipeline(model.pipelines.plane);
  vtkWidgetRepresentation.connectPipeline(model.pipelines.origin);
  vtkWidgetRepresentation.connectPipeline(model.pipelines.normal);
  vtkWidgetRepresentation.connectPipeline(model.pipelines.display2D);
  publicAPI.addActor(model.pipelines.outline.actor);
  publicAPI.addActor(model.pipelines.plane.actor);
  publicAPI.addActor(model.pipelines.origin.actor);
  publicAPI.addActor(model.pipelines.normal.actor);
  publicAPI.addActor(model.pipelines.display2D.actor); // --------------------------------------------------------------------------

  publicAPI.requestData = function (inData, outData) {
    var state = inData[0];
    var origin = state.getOrigin();

    if (!origin) {
      return;
    }

    var normal = state.getNormal();
    var bounds = state.getBounds();
    model.plane.setOrigin(origin);
    model.plane.setNormal(normal); // --------------------------------
    // Update cube parameters
    // --------------------------------

    model.pipelines.outline.source.setCenter((bounds[0] + bounds[1]) * 0.5, (bounds[2] + bounds[3]) * 0.5, (bounds[4] + bounds[5]) * 0.5);
    var xRange = bounds[1] - bounds[0];
    var yRange = bounds[3] - bounds[2];
    var zRange = bounds[5] - bounds[4];
    model.pipelines.outline.source.setXLength(xRange);
    model.pipelines.outline.source.setYLength(yRange);
    model.pipelines.outline.source.setZLength(zRange); // --------------------------------
    // Update normal parameters
    // --------------------------------

    model.pipelines.normal.source.set({
      height: Math.max(xRange, yRange, zRange),
      radius: model.handleSizeRatio * Math.min(xRange, yRange, zRange) * model.axisScale,
      resolution: model.sphereResolution
    });
    var yAxis = model.pipelines.normal.source.getOutputData();
    var newAxis = vtkPolyData.newInstance();
    newAxis.shallowCopy(yAxis);
    newAxis.getPoints().setData(Float32Array.from(yAxis.getPoints().getData()), 3);
    newAxis.getPointData().removeAllArrays();
    model.matrix.identity().translate(origin[0], origin[1], origin[2]).rotateFromDirections([0, 1, 0], normal).apply(newAxis.getPoints().getData());
    model.pipelines.normal.mapper.setInputData(newAxis); // --------------------------------
    // Update origin parameters
    // --------------------------------

    model.pipelines.origin.actor.setPosition(origin);
    var handleScale = model.handleSizeRatio * Math.min(xRange, yRange, zRange);
    model.pipelines.origin.actor.setScale(handleScale, handleScale, handleScale); // --------------------------------
    // Update style since state changed
    // --------------------------------

    vtkWidgetRepresentation.applyStyles(model.pipelines, model.representationStyle, state.getActive() && state.getActiveHandle());
    var output = vtkPolyData.newInstance();
    output.shallowCopy(model.pipelines.plane.source.getOutputData());
    outData[0] = output;
  }; // --------------------------------------------------------------------------
  // Set/Get Forwarding
  // --------------------------------------------------------------------------


  publicAPI.setSphereResolution = function (res) {
    model.sphereResolution = res;
    return model.pipelines.origin.source.setPhiResolution(res) && model.pipelines.origin.source.setThetaResolution(res);
  };

  publicAPI.setRepresentationStyle = function (style) {
    model.representationStyle = vtkWidgetRepresentation.mergeStyles(STYLE_PIPELINE_NAMES, model.representationStyle, style); // Apply static and inactive

    vtkWidgetRepresentation.applyStyles(model.pipelines, model.representationStyle); // Force requestData to execute

    publicAPI.modified();
  }; // --------------------------------------------------------------------------
  // WidgetRepresentation API
  // --------------------------------------------------------------------------


  publicAPI.updateActorVisibility = function (renderingType, ctxVisible, hVisible) {
    var planeVisible = model.planeVisible,
        originVisible = model.originVisible,
        normalVisible = model.normalVisible,
        outlineVisible = model.outlineVisible;

    if (renderingType === RenderingTypes.PICKING_BUFFER) {
      model.pipelines.plane.actor.setVisibility(planeVisible);
      model.pipelines.origin.actor.setVisibility(originVisible);
      model.pipelines.normal.actor.setVisibility(normalVisible); //

      model.pipelines.plane.actor.getProperty().setOpacity(1);
    } else {
      model.pipelines.outline.actor.setVisibility(outlineVisible && ctxVisible);
      model.pipelines.plane.actor.setVisibility(planeVisible && hVisible);
      model.pipelines.origin.actor.setVisibility(originVisible && hVisible);
      model.pipelines.normal.actor.setVisibility(normalVisible && hVisible); //

      var state = model.inputData[0];

      if (state) {
        vtkWidgetRepresentation.applyStyles(model.pipelines, model.representationStyle, state.getActive() && state.getActiveHandle());
      }
    }
  }; // --------------------------------------------------------------------------


  publicAPI.getSelectedState = function (prop, compositeID) {
    // We only have one state to control us
    // we may want to update some field on the state to highlight the
    // selected handle later on...
    var state = model.inputData[0];
    state.setActiveHandle(prop);

    switch (prop) {
      case model.pipelines.plane.actor:
        state.setUpdateMethodName('updateFromPlane');
        break;

      case model.pipelines.origin.actor:
        state.setUpdateMethodName('updateFromOrigin');
        break;

      case model.pipelines.normal.actor:
        state.setUpdateMethodName('updateFromNormal');
        break;

      default:
        state.setUpdateMethodName('updateFromPlane');
        break;
    }

    return state;
  }; // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------


  publicAPI.setRepresentationStyle(STYLE_DEFAULT);
  publicAPI.setSphereResolution(model.sphereResolution);
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  sphereResolution: 24,
  handleSizeRatio: 0.05,
  axisScale: 0.1,
  normalVisible: true,
  originVisible: true,
  planeVisible: true,
  outlineVisible: true
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkWidgetRepresentation.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['sphereResolution', 'representationStyle']);
  macro.setGet(publicAPI, model, ['handleSizeRatio', 'axisScale', 'normalVisible', 'originVisible', 'planeVisible', 'outlineVisible']); // Object specific methods

  vtkImplicitPlaneRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkImplicitPlaneRepresentation'); // ----------------------------------------------------------------------------

var vtkImplicitPlaneRepresentation$1 = {
  newInstance: newInstance,
  extend: extend,
  generateState: generateState
};

export { vtkImplicitPlaneRepresentation$1 as default, extend, newInstance };
