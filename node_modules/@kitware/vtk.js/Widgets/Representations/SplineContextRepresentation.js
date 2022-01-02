import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import macro from '../../macros.js';
import vtkActor from '../../Rendering/Core/Actor.js';
import vtkContextRepresentation from './ContextRepresentation.js';
import vtkMapper from '../../Rendering/Core/Mapper.js';
import vtkPolyData from '../../Common/DataModel/PolyData.js';
import vtkSpline3D from '../../Common/DataModel/Spline3D.js';
import vtkTriangleFilter from '../../Filters/General/TriangleFilter.js';
import vtkLineFilter from '../../Filters/General/LineFilter.js';

// vtkSplineContextRepresentation methods
// ----------------------------------------------------------------------------

function vtkSplineContextRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSplineContextRepresentation'); // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model.pipelines = {
    area: {
      actor: vtkActor.newInstance({
        parentProp: publicAPI
      }),
      mapper: vtkMapper.newInstance(),
      triangleFilter: vtkTriangleFilter.newInstance()
    },
    border: {
      actor: vtkActor.newInstance({
        parentProp: publicAPI
      }),
      mapper: vtkMapper.newInstance(),
      lineFilter: vtkLineFilter.newInstance()
    }
  };
  model.pipelines.area.triangleFilter.setInputConnection(publicAPI.getOutputPort());
  model.pipelines.area.mapper.setInputConnection(model.pipelines.area.triangleFilter.getOutputPort());
  model.pipelines.area.actor.setMapper(model.pipelines.area.mapper);
  model.pipelines.area.actor.getProperty().setOpacity(0.2);
  model.pipelines.area.actor.getProperty().setColor(0, 1, 0);
  publicAPI.addActor(model.pipelines.area.actor);
  model.pipelines.border.lineFilter.setInputConnection(publicAPI.getOutputPort());
  model.pipelines.border.mapper.setInputConnection(model.pipelines.border.lineFilter.getOutputPort());
  model.pipelines.border.actor.setMapper(model.pipelines.border.mapper);
  model.pipelines.border.actor.getProperty().setOpacity(1);
  model.pipelines.border.actor.getProperty().setColor(0.1, 1, 0.1);
  model.pipelines.border.actor.setVisibility(model.outputBorder);
  publicAPI.addActor(model.pipelines.border.actor); // --------------------------------------------------------------------------

  publicAPI.requestData = function (inData, outData) {
    var _model$pipelines$bord;

    if (model.deleted) {
      return;
    }

    var polydata = vtkPolyData.newInstance();
    var widgetState = inData[0];
    var list = publicAPI.getRepresentationStates(widgetState).filter(function (state) {
      return state.getVisible && state.getVisible() && state.getOrigin && state.getOrigin();
    });
    var inPoints = list.map(function (state) {
      return state.getOrigin();
    });

    if (inPoints.length <= 1) {
      outData[0] = polydata;
      return;
    }

    var numVertices = inPoints.length;

    if (model.close) {
      inPoints.push(inPoints[0]);
    }

    var spline = vtkSpline3D.newInstance({
      close: model.close,
      kind: widgetState.getSplineKind(),
      tension: widgetState.getSplineTension(),
      bias: widgetState.getSplineBias(),
      continuity: widgetState.getSplineContinuity()
    });
    spline.computeCoefficients(inPoints);
    var outPoints = new Float32Array(3 * numVertices * model.resolution);
    var outCells = new Uint32Array(numVertices * model.resolution + 2);
    outCells[0] = numVertices * model.resolution + 1;
    outCells[numVertices * model.resolution + 1] = 0;

    for (var i = 0; i < numVertices; i++) {
      for (var j = 0; j < model.resolution; j++) {
        var t = j / model.resolution;
        var point = spline.getPoint(i, t);
        outPoints[3 * (i * model.resolution + j) + 0] = point[0];
        outPoints[3 * (i * model.resolution + j) + 1] = point[1];
        outPoints[3 * (i * model.resolution + j) + 2] = point[2];
        outCells[i * model.resolution + j + 1] = i * model.resolution + j;
      }
    }

    polydata.getPoints().setData(outPoints);

    if (model.fill) {
      polydata.getPolys().setData(outCells);
    }

    polydata.getLines().setData(model.outputBorder ? outCells : []);
    outData[0] = polydata;
    model.pipelines.area.triangleFilter.update();

    (_model$pipelines$bord = model.pipelines.border.actor.getProperty()).setColor.apply(_model$pipelines$bord, _toConsumableArray(inPoints.length <= 3 || model.pipelines.area.triangleFilter.getErrorCount() === 0 ? model.borderColor : model.errorBorderColor));
  };

  publicAPI.getSelectedState = function (prop, compositeID) {
    return model.state;
  };

  publicAPI.setFill = macro.chain(publicAPI.setFill, function (v) {
    return model.pipelines.area.actor.setVisibility(v);
  });
  publicAPI.setOutputBorder = macro.chain(publicAPI.setOutputBorder, function (v) {
    return model.pipelines.border.actor.setVisibility(v);
  });
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  resolution: 16,
  close: true,
  fill: true,
  outputBorder: false,
  borderColor: [0.1, 1, 0.1],
  errorBorderColor: [1, 0, 0]
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkContextRepresentation.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['mapper']);
  macro.setGet(publicAPI, model, ['resolution', 'close', 'fill', 'outputBorder']);
  macro.setGetArray(publicAPI, model, ['borderColor', 'errorBorderColor'], 3); // Object specific methods

  vtkSplineContextRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkSplineContextRepresentation'); // ----------------------------------------------------------------------------

var vtkSplineContextRepresentation$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkSplineContextRepresentation$1 as default, extend, newInstance };
