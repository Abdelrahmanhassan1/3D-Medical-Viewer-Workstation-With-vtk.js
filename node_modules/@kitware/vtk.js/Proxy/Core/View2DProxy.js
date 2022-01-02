import macro from '../../macros.js';
import vtkMouseRangeManipulator from '../../Interaction/Manipulators/MouseRangeManipulator.js';
import vtkViewProxy from './ViewProxy.js';
import { j as cross, D as getMajorAxisIndex } from '../../Common/Core/Math/index.js';

var DEFAULT_STEP_WIDTH = 512;

function formatAnnotationValue(value) {
  if (Array.isArray(value)) {
    return value.map(formatAnnotationValue).join(', ');
  }

  if (Number.isInteger(value)) {
    return value;
  }

  if (Number.isFinite(value)) {
    if (Math.abs(value) < 0.01) {
      return '0';
    }

    return value.toFixed(2);
  }

  return value;
} // ----------------------------------------------------------------------------
// vtkView2DProxy methods
// ----------------------------------------------------------------------------


function vtkView2DProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkView2DProxy');

  publicAPI.updateWidthHeightAnnotation = function () {
    var _model$cornerAnnotati = model.cornerAnnotation.getMetadata(),
        ijkOrientation = _model$cornerAnnotati.ijkOrientation,
        dimensions = _model$cornerAnnotati.dimensions;

    if (ijkOrientation && dimensions) {
      var realDimensions = dimensions;

      if (dimensions.length > 3) {
        // the dimensions is a string
        realDimensions = dimensions.split(',').map(Number);
      }

      var dop = model.camera.getDirectionOfProjection();
      var viewUp = model.camera.getViewUp();
      var viewRight = [0, 0, 0];
      cross(dop, viewUp, viewRight);
      var wIdx = getMajorAxisIndex(viewRight);
      var hIdx = getMajorAxisIndex(viewUp);
      var sliceWidth = realDimensions['IJK'.indexOf(ijkOrientation[wIdx])];
      var sliceHeight = realDimensions['IJK'.indexOf(ijkOrientation[hIdx])];
      publicAPI.updateCornerAnnotation({
        sliceWidth: sliceWidth,
        sliceHeight: sliceHeight
      });
    }
  };

  var superUpdateOrientation = publicAPI.updateOrientation;

  publicAPI.updateOrientation = function (axisIndex, orientation, viewUp) {
    var promise = superUpdateOrientation(axisIndex, orientation, viewUp);
    var count = model.representations.length;

    while (count--) {
      var rep = model.representations[count];
      var slicingMode = 'XYZ'[axisIndex];

      if (rep.setSlicingMode) {
        rep.setSlicingMode(slicingMode);
      }
    }

    publicAPI.updateCornerAnnotation({
      axis: 'XYZ'[axisIndex]
    });
    return promise;
  };

  var superAddRepresentation = publicAPI.addRepresentation;

  publicAPI.addRepresentation = function (rep) {
    superAddRepresentation(rep);

    if (rep.setSlicingMode) {
      rep.setSlicingMode('XYZ'[model.axis]);
      publicAPI.bindRepresentationToManipulator(rep);
    }
  };

  var superRemoveRepresentation = publicAPI.removeRepresentation;

  publicAPI.removeRepresentation = function (rep) {
    superRemoveRepresentation(rep);

    if (rep === model.sliceRepresentation) {
      publicAPI.bindRepresentationToManipulator(null);
      var count = model.representations.length;

      while (count--) {
        if (publicAPI.bindRepresentationToManipulator(model.representations[count])) {
          count = 0;
        }
      }
    }
  }; // --------------------------------------------------------------------------
  // Range Manipulator setup
  // -------------------------------------------------------------------------


  model.rangeManipulator = vtkMouseRangeManipulator.newInstance({
    button: 1,
    scrollEnabled: true
  });
  model.interactorStyle2D.addMouseManipulator(model.rangeManipulator);

  function setWindowWidth(windowWidth) {
    publicAPI.updateCornerAnnotation({
      windowWidth: windowWidth
    });

    if (model.sliceRepresentation && model.sliceRepresentation.setWindowWidth) {
      model.sliceRepresentation.setWindowWidth(windowWidth);
    }
  }

  function setWindowLevel(windowLevel) {
    publicAPI.updateCornerAnnotation({
      windowLevel: windowLevel
    });

    if (model.sliceRepresentation && model.sliceRepresentation.setWindowLevel) {
      model.sliceRepresentation.setWindowLevel(windowLevel);
    }
  }

  function setSlice(sliceRaw) {
    var numberSliceRaw = Number(sliceRaw);
    var slice = Number.isInteger(numberSliceRaw) ? sliceRaw : numberSliceRaw.toFixed(2); // add 'slice' in annotation

    var annotation = {
      slice: slice
    };

    if (model.sliceRepresentation && model.sliceRepresentation.setSlice) {
      model.sliceRepresentation.setSlice(numberSliceRaw);
    } // extend annotation


    if (model.sliceRepresentation && model.sliceRepresentation.getAnnotations) {
      var addOn = model.sliceRepresentation.getAnnotations();
      Object.keys(addOn).forEach(function (key) {
        annotation[key] = formatAnnotationValue(addOn[key]);
      });
    }

    publicAPI.updateCornerAnnotation(annotation);
  }

  publicAPI.bindRepresentationToManipulator = function (representation) {
    var nbListeners = 0;
    model.rangeManipulator.removeAllListeners();
    model.sliceRepresentation = representation;

    while (model.sliceRepresentationSubscriptions.length) {
      model.sliceRepresentationSubscriptions.pop().unsubscribe();
    }

    if (representation) {
      model.sliceRepresentationSubscriptions.push(model.camera.onModified(publicAPI.updateWidthHeightAnnotation));

      if (representation.getWindowWidth) {
        var update = function update() {
          return setWindowWidth(representation.getWindowWidth());
        };

        var windowWidth = representation.getPropertyDomainByName('windowWidth');
        var min = windowWidth.min,
            max = windowWidth.max;
        var step = windowWidth.step;

        if (!step || step === 'any') {
          step = 1 / DEFAULT_STEP_WIDTH;
        }

        model.rangeManipulator.setVerticalListener(min, max, step, representation.getWindowWidth, setWindowWidth);
        model.sliceRepresentationSubscriptions.push(representation.onModified(update));
        update();
        nbListeners++;
      }

      if (representation.getWindowLevel) {
        var _update = function _update() {
          return setWindowLevel(representation.getWindowLevel());
        };

        var windowLevel = representation.getPropertyDomainByName('windowLevel');
        var _min = windowLevel.min,
            _max = windowLevel.max;
        var _step = windowLevel.step;

        if (!_step || _step === 'any') {
          _step = 1 / DEFAULT_STEP_WIDTH;
        }

        model.rangeManipulator.setHorizontalListener(_min, _max, _step, representation.getWindowLevel, setWindowLevel);
        model.sliceRepresentationSubscriptions.push(representation.onModified(_update));

        _update();

        nbListeners++;
      }

      var domain = representation.getPropertyDomainByName('slice');

      if (representation.getSlice && domain) {
        var _update2 = function _update2() {
          return setSlice(representation.getSlice());
        };

        model.rangeManipulator.setScrollListener(domain.min, domain.max, domain.step, representation.getSlice, setSlice);
        model.sliceRepresentationSubscriptions.push(representation.onModified(_update2));

        _update2();

        nbListeners++;
      }
    }

    return nbListeners;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  axis: 2,
  orientation: -1,
  viewUp: [0, 1, 0],
  useParallelRendering: true,
  sliceRepresentationSubscriptions: []
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkViewProxy.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['axis']); // Object specific methods

  vtkView2DProxy(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkView2DProxy'); // ----------------------------------------------------------------------------

var vtkView2DProxy$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkView2DProxy$1 as default, extend, newInstance };
