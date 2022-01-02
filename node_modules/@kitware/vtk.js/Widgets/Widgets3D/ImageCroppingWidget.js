import _slicedToArray from '@babel/runtime/helpers/slicedToArray';
import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import macro from '../../macros.js';
import vtkAbstractWidgetFactory from '../Core/AbstractWidgetFactory.js';
import vtkPlanePointManipulator from '../Manipulators/PlaneManipulator.js';
import vtkLineManipulator from '../Manipulators/LineManipulator.js';
import vtkSphereHandleRepresentation from '../Representations/SphereHandleRepresentation.js';
import vtkCroppingOutlineRepresentation from '../Representations/CroppingOutlineRepresentation.js';
import widgetBehavior from './ImageCroppingWidget/behavior.js';
import state from './ImageCroppingWidget/state.js';
import { transformVec3, AXES } from './ImageCroppingWidget/helpers.js';
import { ViewTypes } from '../Core/WidgetManager/Constants.js';

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkImageCroppingWidget(publicAPI, model) {
  model.classHierarchy.push('vtkImageCroppingWidget');
  var stateSub = null; // --------------------------------------------------------------------------

  function setHandlesEnabled(label, flag) {
    model.widgetState.getStatesWithLabel(label).forEach(function (handle) {
      handle.setVisible(flag);
    });
  } // Set the visibility of the three classes of handles: face, edge, corner


  publicAPI.setFaceHandlesEnabled = function (flag) {
    return setHandlesEnabled('faces', flag);
  };

  publicAPI.setEdgeHandlesEnabled = function (flag) {
    return setHandlesEnabled('edges', flag);
  };

  publicAPI.setCornerHandlesEnabled = function (flag) {
    return setHandlesEnabled('corners', flag);
  }; // --------------------------------------------------------------------------
  // Copies the transforms and dimension of a vtkImageData


  publicAPI.copyImageDataDescription = function (im) {
    var _model$widgetState, _model$widgetState2;

    (_model$widgetState = model.widgetState).setIndexToWorldT.apply(_model$widgetState, _toConsumableArray(im.getIndexToWorld()));

    (_model$widgetState2 = model.widgetState).setWorldToIndexT.apply(_model$widgetState2, _toConsumableArray(im.getWorldToIndex()));

    var dims = im.getDimensions();
    var planeState = model.widgetState.getCroppingPlanes();
    planeState.setPlanes([0, dims[0], 0, dims[1], 0, dims[2]]);
    publicAPI.modified();
  }; // --------------------------------------------------------------------------
  // Updates handle positions based on cropping planes


  publicAPI.updateHandles = function () {
    var planes = model.widgetState.getCroppingPlanes().getPlanes();
    var midpts = [(planes[0] + planes[1]) / 2, (planes[2] + planes[3]) / 2, (planes[4] + planes[5]) / 2];
    var iAxis = [planes[0], midpts[0], planes[1]];
    var jAxis = [planes[2], midpts[1], planes[3]];
    var kAxis = [planes[4], midpts[2], planes[5]];
    var indexToWorldT = model.widgetState.getIndexToWorldT();

    var getAxis = function getAxis(a) {
      return AXES[a];
    };

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        for (var k = 0; k < 3; k++) {
          // skip center of box
          if (i !== 1 || j !== 1 || k !== 1) {
            var name = [i, j, k].map(getAxis).join('');
            var coord = transformVec3([iAxis[i], jAxis[j], kAxis[k]], indexToWorldT);

            var _model$widgetState$ge = model.widgetState.getStatesWithLabel(name),
                _model$widgetState$ge2 = _slicedToArray(_model$widgetState$ge, 1),
                handle = _model$widgetState$ge2[0];

            handle.setOrigin.apply(handle, _toConsumableArray(coord));
          }
        }
      }
    }
  }; // --------------------------------------------------------------------------


  publicAPI.delete = macro.chain(publicAPI.delete, function () {
    if (stateSub) {
      stateSub.unsubscribe();
    }
  }); // --- Widget Requirement ---------------------------------------------------

  model.behavior = widgetBehavior;
  model.widgetState = state(); // Given a view type (geometry, slice, volume), return a description
  // of what representations to create and what widget state to pass
  // to the respective representations.

  publicAPI.getRepresentationsForViewType = function (viewType) {
    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
      case ViewTypes.VOLUME:
      default:
        return [// Describes constructing a vtkSphereHandleRepresentation, and every
        // time the widget state updates, we will give the representation
        // a list of all handle states (which have the label "handles").
        {
          builder: vtkSphereHandleRepresentation,
          labels: ['handles']
        }, {
          builder: vtkCroppingOutlineRepresentation,
          // outline is defined by corner points
          labels: ['corners']
        }];
    }
  }; // Update handle positions when cropping planes update


  stateSub = model.widgetState.getCroppingPlanes().onModified(publicAPI.updateHandles); // Add manipulators to our widgets.

  var planeManipulator = vtkPlanePointManipulator.newInstance();
  var lineManipulator = vtkLineManipulator.newInstance();
  model.widgetState.getStatesWithLabel('corners').forEach(function (handle) {
    return handle.setManipulator(planeManipulator);
  });
  model.widgetState.getStatesWithLabel('edges').forEach(function (handle) {
    return handle.setManipulator(planeManipulator);
  });
  model.widgetState.getStatesWithLabel('faces').forEach(function (handle) {
    return handle.setManipulator(lineManipulator);
  });
} // ----------------------------------------------------------------------------


var DEFAULT_VALUES = {}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  vtkImageCroppingWidget(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkImageCroppingWidget'); // ----------------------------------------------------------------------------

var vtkImageCroppingWidget$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkImageCroppingWidget$1 as default, extend, newInstance };
