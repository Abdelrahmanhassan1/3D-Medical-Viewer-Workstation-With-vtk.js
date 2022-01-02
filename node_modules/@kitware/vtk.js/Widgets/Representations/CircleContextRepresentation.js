import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import macro from '../../macros.js';
import vtkActor from '../../Rendering/Core/Actor.js';
import vtkCircleSource from '../../Filters/Sources/CircleSource.js';
import vtkContextRepresentation from './ContextRepresentation.js';
import vtkDataArray from '../../Common/Core/DataArray.js';
import vtkGlyph3DMapper from '../../Rendering/Core/Glyph3DMapper.js';
import vtkMatrixBuilder from '../../Common/Core/MatrixBuilder.js';
import vtkPolyData from '../../Common/DataModel/PolyData.js';
import vtkWidgetRepresentation from './WidgetRepresentation.js';
import { ScalarMode } from '../../Rendering/Core/Mapper/Constants.js';
import { mat3, vec3 } from 'gl-matrix';

// vtkCircleContextRepresentation methods
// ----------------------------------------------------------------------------

function vtkCircleContextRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCircleContextRepresentation'); // --------------------------------------------------------------------------
  // Internal polydata dataset
  // --------------------------------------------------------------------------

  model.internalPolyData = vtkPolyData.newInstance({
    mtime: 0
  });
  model.internalArrays = {
    points: model.internalPolyData.getPoints(),
    scale: vtkDataArray.newInstance({
      name: 'scale',
      numberOfComponents: 3,
      empty: true
    }),
    color: vtkDataArray.newInstance({
      name: 'color',
      numberOfComponents: 1,
      empty: true
    }),
    direction: vtkDataArray.newInstance({
      name: 'direction',
      numberOfComponents: 9,
      empty: true
    })
  };
  model.internalPolyData.getPointData().addArray(model.internalArrays.scale);
  model.internalPolyData.getPointData().addArray(model.internalArrays.color);
  model.internalPolyData.getPointData().addArray(model.internalArrays.direction); // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model.pipelines = {
    circle: {
      source: publicAPI,
      glyph: vtkCircleSource.newInstance({
        resolution: model.glyphResolution,
        radius: 1,
        lines: model.drawBorder,
        face: model.drawFace
      }),
      mapper: vtkGlyph3DMapper.newInstance({
        orientationArray: 'direction',
        scaleArray: 'scale',
        scaleMode: vtkGlyph3DMapper.ScaleModes.SCALE_BY_COMPONENTS,
        colorByArrayName: 'color',
        scalarMode: ScalarMode.USE_POINT_FIELD_DATA
      }),
      actor: vtkActor.newInstance({
        pickable: false,
        parentProp: publicAPI
      })
    }
  };
  model.pipelines.circle.actor.getProperty().setOpacity(0.2);
  model.pipelines.circle.mapper.setOrientationModeToMatrix();
  model.pipelines.circle.mapper.setResolveCoincidentTopology(true);
  model.pipelines.circle.mapper.setResolveCoincidentTopologyPolygonOffsetParameters(-1, -1);
  vtkWidgetRepresentation.connectPipeline(model.pipelines.circle);
  publicAPI.addActor(model.pipelines.circle.actor);
  model.transform = vtkMatrixBuilder.buildFromDegree(); // --------------------------------------------------------------------------

  publicAPI.setGlyphResolution = macro.chain(publicAPI.setGlyphResolution, function (r) {
    return model.pipelines.circle.glyph.setResolution(r);
  }); // --------------------------------------------------------------------------

  publicAPI.setDrawBorder = function (draw) {
    model.pipelines.circle.glyph.setLines(draw);
  }; // --------------------------------------------------------------------------


  publicAPI.setDrawFace = function (draw) {
    model.pipelines.circle.glyph.setFace(draw);
  }; // --------------------------------------------------------------------------


  publicAPI.setOpacity = function (opacity) {
    model.pipelines.circle.actor.getProperty().setOpacity(opacity);
  }; // --------------------------------------------------------------------------


  publicAPI.requestData = function (inData, outData) {
    var _model$internalArrays = model.internalArrays,
        points = _model$internalArrays.points,
        scale = _model$internalArrays.scale,
        color = _model$internalArrays.color,
        direction = _model$internalArrays.direction;
    var list = publicAPI.getRepresentationStates(inData[0]).filter(function (state) {
      return state.getOrigin && state.getOrigin() && state.isVisible && state.isVisible();
    });
    var totalCount = list.length;

    if (color.getNumberOfValues() !== totalCount) {
      // Need to resize dataset
      points.setData(new Float32Array(3 * totalCount));
      scale.setData(new Float32Array(3 * totalCount));
      direction.setData(new Float32Array(9 * totalCount));
      color.setData(new Float32Array(totalCount));
    }

    var typedArray = {
      points: points.getData(),
      scale: scale.getData(),
      color: color.getData(),
      direction: direction.getData()
    };

    for (var i = 0; i < totalCount; i++) {
      var state = list[i];
      var isActive = state.getActive();
      var scaleFactor = isActive ? model.activeScaleFactor : 1;
      var coord = state.getOrigin();
      typedArray.points[i * 3 + 0] = coord[0];
      typedArray.points[i * 3 + 1] = coord[1];
      typedArray.points[i * 3 + 2] = coord[2];
      var right = state.getRight ? state.getRight() : [1, 0, 0];
      var up = state.getUp ? state.getUp() : [0, 1, 0];
      var dir = state.getDirection ? state.getDirection() : [0, 0, 1];
      var rotation = [].concat(_toConsumableArray(right), _toConsumableArray(up), _toConsumableArray(dir));
      var scale3 = state.getScale3 ? state.getScale3() : [1, 1, 1];
      scale3 = scale3.map(function (x) {
        return x === 0 ? 2 * model.defaultScale : 2 * x;
      }); // Reorient rotation and scale3 since the circle source faces X instead of Z

      var reorientCircleSource4 = vtkMatrixBuilder.buildFromDegree().rotateFromDirections([1, 0, 0], [0, 0, 1]) // from X to Z
      .getMatrix();
      var reorientCircleSource3 = [];
      mat3.fromMat4(reorientCircleSource3, reorientCircleSource4);
      vec3.transformMat4(scale3, scale3, reorientCircleSource4);
      mat3.multiply(rotation, rotation, reorientCircleSource3);

      for (var j = 0; j < 9; j += 1) {
        typedArray.direction[i * 9 + j] = rotation[j];
      }

      var scale1 = (state.getScale1 ? state.getScale1() : model.defaultScale) / 2;
      typedArray.scale[i * 3 + 0] = scale1 * scaleFactor * scale3[0];
      typedArray.scale[i * 3 + 1] = scale1 * scaleFactor * scale3[1];
      typedArray.scale[i * 3 + 2] = scale1 * scaleFactor * scale3[2];
      typedArray.color[i] = model.useActiveColor && isActive ? model.activeColor : state.getColor();
    }

    model.internalPolyData.modified();
    outData[0] = model.internalPolyData;
  }; // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  glyphResolution: 32,
  defaultScale: 1,
  drawBorder: false,
  drawFace: true
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkContextRepresentation.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['glyphResolution', 'defaultScale']);
  macro.get(publicAPI, model, ['glyph', 'mapper', 'actor']); // Object specific methods

  vtkCircleContextRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkCircleContextRepresentation'); // ----------------------------------------------------------------------------

var vtkCircleContextRepresentation$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkCircleContextRepresentation$1 as default, extend, newInstance };
