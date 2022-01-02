import macro from '../../macros.js';
import vtkActor from '../../Rendering/Core/Actor.js';
import vtkCubeSource from '../../Filters/Sources/CubeSource.js';
import vtkDataArray from '../../Common/Core/DataArray.js';
import vtkGlyph3DMapper from '../../Rendering/Core/Glyph3DMapper.js';
import vtkHandleRepresentation from './HandleRepresentation.js';
import vtkPolyData from '../../Common/DataModel/PolyData.js';
import { ScalarMode } from '../../Rendering/Core/Mapper/Constants.js';

// vtkCubeHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkCubeHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCubeHandleRepresentation'); // --------------------------------------------------------------------------
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
    })
  };
  model.internalPolyData.getPointData().addArray(model.internalArrays.scale);
  model.internalPolyData.getPointData().addArray(model.internalArrays.color); // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model.mapper = vtkGlyph3DMapper.newInstance({
    scaleArray: 'scale',
    colorByArrayName: 'color',
    scalarMode: ScalarMode.USE_POINT_FIELD_DATA
  });
  model.actor = vtkActor.newInstance({
    parentProp: publicAPI
  });
  model.glyph = vtkCubeSource.newInstance();
  model.mapper.setInputConnection(publicAPI.getOutputPort(), 0);
  model.mapper.setInputConnection(model.glyph.getOutputPort(), 1);
  model.actor.setMapper(model.mapper);
  publicAPI.addActor(model.actor); // --------------------------------------------------------------------------

  publicAPI.requestData = function (inData, outData) {
    var _model$internalArrays = model.internalArrays,
        points = _model$internalArrays.points,
        scale = _model$internalArrays.scale,
        color = _model$internalArrays.color;
    var list = publicAPI.getRepresentationStates(inData[0]).filter(function (state) {
      return state.getOrigin && state.getOrigin() && state.isVisible && state.isVisible();
    });
    var totalCount = list.length;

    if (color.getNumberOfValues() !== totalCount) {
      // Need to resize dataset
      points.setData(new Float32Array(3 * totalCount));
      scale.setData(new Float32Array(3 * totalCount));
      color.setData(new Float32Array(totalCount));
    }

    var typedArray = {
      points: points.getData(),
      scale: scale.getData(),
      color: color.getData()
    };

    for (var i = 0; i < totalCount; i++) {
      var state = list[i];
      var isActive = state.getActive();
      var scaleFactor = isActive ? model.activeScaleFactor : 1;
      var coord = state.getOrigin();

      if (coord) {
        typedArray.points[i * 3 + 0] = coord[0];
        typedArray.points[i * 3 + 1] = coord[1];
        typedArray.points[i * 3 + 2] = coord[2];
        typedArray.scale[i] = scaleFactor * (state.getScale1 ? state.getScale1() : model.defaultScale);

        if (publicAPI.getScaleInPixels()) {
          typedArray.scale[i] *= publicAPI.getPixelWorldHeightAtCoord(coord);
        }

        typedArray.color[i] = model.useActiveColor && isActive ? model.activeColor : state.getColor();
      }
    }

    model.internalPolyData.modified();
    outData[0] = model.internalPolyData;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkHandleRepresentation.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['glyph', 'mapper', 'actor', 'defaultScale']); // Object specific methods

  vtkCubeHandleRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkCubeHandleRepresentation'); // ----------------------------------------------------------------------------

var vtkCubeHandleRepresentation$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkCubeHandleRepresentation$1 as default, extend, newInstance };
