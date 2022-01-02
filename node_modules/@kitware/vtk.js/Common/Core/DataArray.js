import _defineProperty from '@babel/runtime/helpers/defineProperty';
import Constants from './DataArray/Constants.js';
import { newInstance as newInstance$1, newTypedArray, newTypedArrayFrom, obj, set } from '../../macros.js';
import { n as norm } from './Math/index.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var DefaultDataType = Constants.DefaultDataType;
var TUPLE_HOLDER = []; // ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function createRangeHelper() {
  var min = Number.MAX_VALUE;
  var max = -Number.MAX_VALUE;
  var count = 0;
  var sum = 0;
  return {
    add: function add(value) {
      if (min > value) {
        min = value;
      }

      if (max < value) {
        max = value;
      }

      count++;
      sum += value;
    },
    get: function get() {
      return {
        min: min,
        max: max,
        count: count,
        sum: sum,
        mean: sum / count
      };
    },
    getRange: function getRange() {
      return {
        min: min,
        max: max
      };
    }
  };
}

function computeRange(values) {
  var component = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var numberOfComponents = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  var helper = createRangeHelper();
  var size = values.length;
  var value = 0;

  if (component < 0 && numberOfComponents > 1) {
    // Compute magnitude
    for (var i = 0; i < size; i += numberOfComponents) {
      value = 0;

      for (var j = 0; j < numberOfComponents; j++) {
        value += values[i + j] * values[i + j];
      }

      value = Math.pow(value, 0.5);
      helper.add(value);
    }

    return helper.getRange();
  }

  var offset = component < 0 ? 0 : component;

  for (var _i = offset; _i < size; _i += numberOfComponents) {
    helper.add(values[_i]);
  }

  return helper.getRange();
}

function ensureRangeSize(rangeArray) {
  var size = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var ranges = rangeArray || []; // Pad ranges with null value to get the

  while (ranges.length <= size) {
    ranges.push(null);
  }

  return ranges;
}

function getDataType(typedArray) {
  // Expects toString() to return "[object ...Array]"
  return Object.prototype.toString.call(typedArray).slice(8, -1);
}

function getMaxNorm(normArray) {
  var numComps = normArray.getNumberOfComponents();
  var maxNorm = 0.0;

  for (var i = 0; i < normArray.getNumberOfTuples(); ++i) {
    var norm$1 = norm(normArray.getTuple(i), numComps);

    if (norm$1 > maxNorm) {
      maxNorm = norm$1;
    }
  }

  return maxNorm;
} // ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------


var STATIC = {
  computeRange: computeRange,
  createRangeHelper: createRangeHelper,
  getDataType: getDataType,
  getMaxNorm: getMaxNorm
}; // ----------------------------------------------------------------------------
// vtkDataArray methods
// ----------------------------------------------------------------------------

function vtkDataArray(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkDataArray');

  function dataChange() {
    model.ranges = null;
    publicAPI.modified();
  }

  publicAPI.getElementComponentSize = function () {
    return model.values.BYTES_PER_ELEMENT;
  }; // Description:
  // Return the data component at the location specified by tupleIdx and
  // compIdx.


  publicAPI.getComponent = function (tupleIdx) {
    var compIdx = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    return model.values[tupleIdx * model.numberOfComponents + compIdx];
  }; // Description:
  // Set the data component at the location specified by tupleIdx and compIdx
  // to value.
  // Note that i is less than NumberOfTuples and j is less than
  //  NumberOfComponents. Make sure enough memory has been allocated
  // (use SetNumberOfTuples() and SetNumberOfComponents()).


  publicAPI.setComponent = function (tupleIdx, compIdx, value) {
    if (value !== model.values[tupleIdx * model.numberOfComponents + compIdx]) {
      model.values[tupleIdx * model.numberOfComponents + compIdx] = value;
      dataChange();
    }
  };

  publicAPI.getData = function () {
    return model.values;
  };

  publicAPI.getRange = function () {
    var componentIndex = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : -1;
    var rangeIdx = componentIndex < 0 ? model.numberOfComponents : componentIndex;
    var range = null;

    if (!model.ranges) {
      model.ranges = ensureRangeSize(model.ranges, model.numberOfComponents);
    }

    range = model.ranges[rangeIdx];

    if (range) {
      model.rangeTuple[0] = range.min;
      model.rangeTuple[1] = range.max;
      return model.rangeTuple;
    } // Need to compute ranges...


    range = computeRange(model.values, componentIndex, model.numberOfComponents);
    model.ranges[rangeIdx] = range;
    model.rangeTuple[0] = range.min;
    model.rangeTuple[1] = range.max;
    return model.rangeTuple;
  };

  publicAPI.setRange = function (rangeValue, componentIndex) {
    if (!model.ranges) {
      model.ranges = ensureRangeSize(model.ranges, model.numberOfComponents);
    }

    var range = {
      min: rangeValue.min,
      max: rangeValue.max
    };
    model.ranges[componentIndex] = range;
    model.rangeTuple[0] = range.min;
    model.rangeTuple[1] = range.max;
    return model.rangeTuple;
  };

  publicAPI.setTuple = function (idx, tuple) {
    var offset = idx * model.numberOfComponents;

    for (var i = 0; i < model.numberOfComponents; i++) {
      model.values[offset + i] = tuple[i];
    }
  };

  publicAPI.getTuple = function (idx) {
    var tupleToFill = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : TUPLE_HOLDER;
    var numberOfComponents = model.numberOfComponents || 1;

    if (tupleToFill.length !== numberOfComponents) {
      tupleToFill.length = numberOfComponents;
    }

    var offset = idx * numberOfComponents; // Check most common component sizes first
    // to avoid doing a for loop if possible

    if (numberOfComponents === 1) {
      tupleToFill[0] = model.values[offset];
    } else if (numberOfComponents === 2) {
      tupleToFill[0] = model.values[offset];
      tupleToFill[1] = model.values[offset + 1];
    } else if (numberOfComponents === 3) {
      tupleToFill[0] = model.values[offset];
      tupleToFill[1] = model.values[offset + 1];
      tupleToFill[2] = model.values[offset + 2];
    } else if (numberOfComponents === 4) {
      tupleToFill[0] = model.values[offset];
      tupleToFill[1] = model.values[offset + 1];
      tupleToFill[2] = model.values[offset + 2];
      tupleToFill[3] = model.values[offset + 3];
    } else {
      for (var i = 0; i < numberOfComponents; i++) {
        tupleToFill[i] = model.values[offset + i];
      }
    }

    return tupleToFill;
  };

  publicAPI.getTupleLocation = function () {
    var idx = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    return idx * model.numberOfComponents;
  };

  publicAPI.getNumberOfComponents = function () {
    return model.numberOfComponents;
  };

  publicAPI.getNumberOfValues = function () {
    return model.values.length;
  };

  publicAPI.getNumberOfTuples = function () {
    return model.values.length / model.numberOfComponents;
  };

  publicAPI.getDataType = function () {
    return model.dataType;
  };
  /* eslint-disable no-use-before-define */


  publicAPI.newClone = function () {
    return newInstance({
      empty: true,
      name: model.name,
      dataType: model.dataType,
      numberOfComponents: model.numberOfComponents
    });
  };
  /* eslint-enable no-use-before-define */


  publicAPI.getName = function () {
    if (!model.name) {
      publicAPI.modified();
      model.name = "vtkDataArray".concat(publicAPI.getMTime());
    }

    return model.name;
  };

  publicAPI.setData = function (typedArray, numberOfComponents) {
    model.values = typedArray;
    model.size = typedArray.length;
    model.dataType = getDataType(typedArray);

    if (numberOfComponents) {
      model.numberOfComponents = numberOfComponents;
    }

    if (model.size % model.numberOfComponents !== 0) {
      model.numberOfComponents = 1;
    }

    dataChange();
  }; // Override serialization support


  publicAPI.getState = function () {
    var jsonArchive = _objectSpread(_objectSpread({}, model), {}, {
      vtkClass: publicAPI.getClassName()
    }); // Convert typed array to regular array


    jsonArchive.values = Array.from(jsonArchive.values);
    delete jsonArchive.buffer; // Clean any empty data

    Object.keys(jsonArchive).forEach(function (keyName) {
      if (!jsonArchive[keyName]) {
        delete jsonArchive[keyName];
      }
    }); // Sort resulting object by key name

    var sortedObj = {};
    Object.keys(jsonArchive).sort().forEach(function (name) {
      sortedObj[name] = jsonArchive[name];
    }); // Remove mtime

    if (sortedObj.mtime) {
      delete sortedObj.mtime;
    }

    return sortedObj;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  name: '',
  numberOfComponents: 1,
  size: 0,
  dataType: DefaultDataType,
  rangeTuple: [0, 0] // values: null,
  // ranges: null,

}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);

  if (!model.empty && !model.values && !model.size) {
    throw new TypeError('Cannot create vtkDataArray object without: size > 0, values');
  }

  if (!model.values) {
    model.values = newTypedArray(model.dataType, model.size);
  } else if (Array.isArray(model.values)) {
    model.values = newTypedArrayFrom(model.dataType, model.values);
  }

  if (model.values) {
    model.size = model.values.length;
    model.dataType = getDataType(model.values);
  } // Object methods


  obj(publicAPI, model);
  set(publicAPI, model, ['name', 'numberOfComponents']); // Object specific methods

  vtkDataArray(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = newInstance$1(extend, 'vtkDataArray'); // ----------------------------------------------------------------------------

var vtkDataArray$1 = _objectSpread(_objectSpread({
  newInstance: newInstance,
  extend: extend
}, STATIC), Constants);

export { STATIC, vtkDataArray$1 as default, extend, newInstance };
