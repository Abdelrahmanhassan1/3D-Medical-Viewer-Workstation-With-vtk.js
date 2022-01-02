import macro from '../../macros.js';
import vtkActor from '../../Rendering/Core/Actor.js';
import vtkDataArray from '../../Common/Core/DataArray.js';
import vtkGlyph3DMapper from '../../Rendering/Core/Glyph3DMapper.js';
import vtkHandleRepresentation from './HandleRepresentation.js';
import vtkPixelSpaceCallbackMapper from '../../Rendering/Core/PixelSpaceCallbackMapper.js';
import vtkPolyData from '../../Common/DataModel/PolyData.js';
import vtkSphereSource from '../../Filters/Sources/SphereSource.js';
import { ScalarMode } from '../../Rendering/Core/Mapper/Constants.js';

// vtkSphereHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkSphereHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSphereHandleRepresentation'); // --------------------------------------------------------------------------
  // Internal polydata dataset
  // --------------------------------------------------------------------------

  model.internalPolyData = vtkPolyData.newInstance({
    mtime: 0
  });
  model.internalArrays = {
    points: model.internalPolyData.getPoints(),
    scale: vtkDataArray.newInstance({
      name: 'scale',
      numberOfComponents: 1,
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

  /*
   * displayActors and displayMappers are used to render objects in HTML, allowing objects
   * to be 'rendered' internally in a VTK scene without being visible on the final output
   */

  model.displayMapper = vtkPixelSpaceCallbackMapper.newInstance();
  model.displayActor = vtkActor.newInstance({
    parentProp: publicAPI
  }); // model.displayActor.getProperty().setOpacity(0); // don't show in 3D

  model.displayActor.setMapper(model.displayMapper);
  model.displayMapper.setInputConnection(publicAPI.getOutputPort());
  publicAPI.addActor(model.displayActor);
  model.alwaysVisibleActors = [model.displayActor];
  model.mapper = vtkGlyph3DMapper.newInstance({
    scaleArray: 'scale',
    colorByArrayName: 'color',
    scalarMode: ScalarMode.USE_POINT_FIELD_DATA
  });
  model.actor = vtkActor.newInstance({
    parentProp: publicAPI
  });
  model.glyph = vtkSphereSource.newInstance({
    phiResolution: model.glyphResolution,
    thetaResolution: model.glyphResolution
  });
  model.mapper.setInputConnection(publicAPI.getOutputPort(), 0);
  model.mapper.setInputConnection(model.glyph.getOutputPort(), 1);
  model.actor.setMapper(model.mapper);
  publicAPI.addActor(model.actor); // --------------------------------------------------------------------------

  publicAPI.setGlyphResolution = macro.chain(publicAPI.setGlyphResolution, function (r) {
    return model.glyph.setPhiResolution(r) && model.glyph.setThetaResolution(r);
  }); // --------------------------------------------------------------------------

  function callbackProxy(coords) {
    if (model.displayCallback) {
      var filteredList = [];
      var states = publicAPI.getRepresentationStates();

      for (var i = 0; i < states.length; i++) {
        if (states[i].getActive()) {
          filteredList.push(coords[i]);
        }
      }

      if (filteredList.length) {
        model.displayCallback(filteredList);
        return;
      }
    }

    model.displayCallback();
  }

  publicAPI.setDisplayCallback = function (callback) {
    model.displayCallback = callback;
    model.displayMapper.setCallback(callback ? callbackProxy : null);
  }; // --------------------------------------------------------------------------


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
      points.setData(new Float32Array(3 * totalCount), 3);
      scale.setData(new Float32Array(totalCount));
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
      typedArray.points[i * 3 + 0] = coord[0];
      typedArray.points[i * 3 + 1] = coord[1];
      typedArray.points[i * 3 + 2] = coord[2];
      typedArray.scale[i] = scaleFactor * (state.getScale1 ? state.getScale1() : model.defaultScale);

      if (publicAPI.getScaleInPixels()) {
        typedArray.scale[i] *= publicAPI.getPixelWorldHeightAtCoord(coord);
      }

      typedArray.color[i] = model.useActiveColor && isActive ? model.activeColor : state.getColor();
    }

    model.internalPolyData.modified();
    outData[0] = model.internalPolyData;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  glyphResolution: 8,
  defaultScale: 1
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkHandleRepresentation.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['glyph', 'mapper', 'actor']); // Object specific methods

  vtkSphereHandleRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkSphereHandleRepresentation'); // ----------------------------------------------------------------------------

var vtkSphereHandleRepresentation$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkSphereHandleRepresentation$1 as default, extend, newInstance };
