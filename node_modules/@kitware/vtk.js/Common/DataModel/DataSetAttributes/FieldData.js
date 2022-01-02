import vtk from '../../../vtk.js';
import macro from '../../../macros.js';
import vtkDataArray from '../../Core/DataArray.js';

// vtkFieldData methods
// ----------------------------------------------------------------------------

function vtkFieldData(publicAPI, model) {
  model.classHierarchy.push('vtkFieldData');
  var superGetState = publicAPI.getState; // Decode serialized data if any

  if (model.arrays) {
    model.arrays = model.arrays.map(function (item) {
      return {
        data: vtk(item.data)
      };
    });
  }

  publicAPI.initialize = function () {
    publicAPI.initializeFields();
    publicAPI.copyAllOn();
    publicAPI.clearFieldFlags();
  };

  publicAPI.initializeFields = function () {
    model.arrays = [];
    model.copyFieldFlags = {};
    publicAPI.modified();
  };

  publicAPI.copyStructure = function (other) {
    publicAPI.initializeFields();
    model.copyFieldFlags = other.getCopyFieldFlags().map(function (x) {
      return x;
    }); // Deep-copy

    model.arrays = other.arrays().map(function (x) {
      return {
        array: x
      };
    }); // Deep-copy
    // TODO: Copy array information objects (once we support information objects)
  };

  publicAPI.getNumberOfArrays = function () {
    return model.arrays.length;
  };

  publicAPI.getNumberOfActiveArrays = function () {
    return model.arrays.length;
  };

  publicAPI.addArray = function (arr) {
    model.arrays = [].concat(model.arrays, {
      data: arr
    });
    return model.arrays.length - 1;
  };

  publicAPI.removeAllArrays = function () {
    model.arrays = [];
  };

  publicAPI.removeArray = function (arrayName) {
    model.arrays = model.arrays.filter(function (entry) {
      return arrayName !== entry.data.getName();
    });
  };

  publicAPI.removeArrayByIndex = function (arrayIdx) {
    model.arrays = model.arrays.filter(function (entry, idx) {
      return idx !== arrayIdx;
    });
  };

  publicAPI.getArrays = function () {
    return model.arrays.map(function (entry) {
      return entry.data;
    });
  };

  publicAPI.getArray = function (arraySpec) {
    return typeof arraySpec === 'number' ? publicAPI.getArrayByIndex(arraySpec) : publicAPI.getArrayByName(arraySpec);
  };

  publicAPI.getArrayByName = function (arrayName) {
    return model.arrays.reduce(function (a, b, i) {
      return b.data.getName() === arrayName ? b.data : a;
    }, null);
  };

  publicAPI.getArrayWithIndex = function (arrayName) {
    return model.arrays.reduce(function (a, b, i) {
      return b.data && b.data.getName() === arrayName ? {
        array: b.data,
        index: i
      } : a;
    }, {
      array: null,
      index: -1
    });
  };

  publicAPI.getArrayByIndex = function (idx) {
    return idx >= 0 && idx < model.arrays.length ? model.arrays[idx].data : null;
  };

  publicAPI.hasArray = function (arrayName) {
    return publicAPI.getArrayWithIndex(arrayName).index >= 0;
  };

  publicAPI.getArrayName = function (idx) {
    var arr = model.arrays[idx];
    return arr ? arr.data.getName() : '';
  };

  publicAPI.getCopyFieldFlags = function () {
    return model.copyFieldFlags;
  };

  publicAPI.getFlag = function (arrayName) {
    return model.copyFieldFlags[arrayName];
  };

  publicAPI.passData = function (other) {
    var fromId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;
    var toId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
    other.getArrays().forEach(function (arr) {
      var copyFlag = publicAPI.getFlag(arr.getName());

      if (copyFlag !== false && !(model.doCopyAllOff && copyFlag !== true) && arr) {
        var destArr = publicAPI.getArrayByName(arr.getName());

        if (!destArr) {
          if (fromId < 0 || fromId > arr.getNumberOfTuples()) {
            publicAPI.addArray(arr);
          } else {
            var ncomps = arr.getNumberOfComponents();
            var newSize = arr.getNumberOfValues();
            var tId = toId > -1 ? toId : fromId;

            if (newSize < tId * ncomps) {
              newSize = (tId + 1) * ncomps;
            }

            destArr = vtkDataArray.newInstance({
              name: arr.getName(),
              dataType: arr.getDataType(),
              numberOfComponents: arr.getNumberOfComponents(),
              size: newSize
            });
            destArr.setTuple(tId, arr.getTuple(fromId));
            publicAPI.addArray(destArr);
          }
        } else if (arr.getNumberOfComponents() === destArr.getNumberOfComponents()) {
          if (fromId > -1 && fromId < arr.getNumberOfTuples()) {
            var _tId = toId > -1 ? toId : fromId;

            destArr.setTuple(_tId, arr.getTuple(fromId));
          } else {
            // if fromId and not provided, just copy all (or as much possible)
            // of arr to destArr.
            for (var i = 0; i < arr.getNumberOfTuples(); ++i) {
              destArr.setTuple(i, arr.getTuple(i));
            }
          }
        }
      }
    });
  };

  publicAPI.copyFieldOn = function (arrayName) {
    model.copyFieldFlags[arrayName] = true;
  };

  publicAPI.copyFieldOff = function (arrayName) {
    model.copyFieldFlags[arrayName] = false;
  };

  publicAPI.copyAllOn = function () {
    if (!model.doCopyAllOn || model.doCopyAllOff) {
      model.doCopyAllOn = true;
      model.doCopyAllOff = false;
      publicAPI.modified();
    }
  };

  publicAPI.copyAllOff = function () {
    if (model.doCopyAllOn || !model.doCopyAllOff) {
      model.doCopyAllOn = false;
      model.doCopyAllOff = true;
      publicAPI.modified();
    }
  };

  publicAPI.clearFieldFlags = function () {
    model.copyFieldFlags = {};
  };

  publicAPI.deepCopy = function (other) {
    model.arrays = other.getArrays().map(function (arr) {
      var arrNew = arr.newClone();
      arrNew.deepCopy(arr);
      return {
        data: arrNew
      };
    });
  };

  publicAPI.copyFlags = function (other) {
    return other.getCopyFieldFlags().map(function (x) {
      return x;
    });
  }; // TODO: publicAPI.squeeze = () => model.arrays.forEach(entry => entry.data.squeeze());


  publicAPI.reset = function () {
    return model.arrays.forEach(function (entry) {
      return entry.data.reset();
    });
  }; // TODO: getActualMemorySize


  publicAPI.getMTime = function () {
    return model.arrays.reduce(function (a, b) {
      return b.data.getMTime() > a ? b.data.getMTime() : a;
    }, model.mtime);
  }; // TODO: publicAPI.getField = (ids, other) => { copy ids from other into this model's arrays }
  // TODO: publicAPI.getArrayContainingComponent = (component) => ...


  publicAPI.getNumberOfComponents = function () {
    return model.arrays.reduce(function (a, b) {
      return a + b.data.getNumberOfComponents();
    }, 0);
  };

  publicAPI.getNumberOfTuples = function () {
    return model.arrays.length > 0 ? model.arrays[0].getNumberOfTuples() : 0;
  };

  publicAPI.getState = function () {
    var result = superGetState();
    result.arrays = model.arrays.map(function (item) {
      return {
        data: item.data.getState()
      };
    });
    return result;
  };
}

var DEFAULT_VALUES = {
  arrays: [],
  copyFieldFlags: [],
  // fields not to copy
  doCopyAllOn: true,
  doCopyAllOff: false
};
function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.obj(publicAPI, model);
  vtkFieldData(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkFieldData'); // ----------------------------------------------------------------------------

var vtkFieldData$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkFieldData$1 as default, extend, newInstance };
