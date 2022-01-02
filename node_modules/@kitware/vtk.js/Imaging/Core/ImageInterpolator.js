import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import vtkAbstractImageInterpolator from './AbstractImageInterpolator.js';
import { vtkInterpolationMathRound, vtkInterpolationMathClamp, vtkInterpolationMathMirror, vtkInterpolationMathWrap, vtkInterpolationWeights, vtkInterpolationMathFloor } from './AbstractImageInterpolator/InterpolationInfo.js';
import { InterpolationMode, ImageBorderMode } from './AbstractImageInterpolator/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
// vtkImageInterpolator methods
// ----------------------------------------------------------------------------

function vtkImageInterpolator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageInterpolator');

  publicAPI.computeSupportSize = function (matrix) {
    var s = 1;

    if (model.interpolationMode === InterpolationMode.LINEAR) {
      s = 2;
    } else if (model.interpolationMode === InterpolationMode.CUBIC) {
      s = 4;
    }

    var size = [s, s, s];

    if (matrix == null) {
      return size;
    } // TODO CHECK MATRIX


    if (matrix[12] !== 0 || matrix[13] !== 0 || matrix[14] !== 0 || matrix[15] !== 1) {
      return size;
    }

    for (var i = 0; i < 3; ++i) {
      var integerRow = true;

      for (var j = 0; j < 3; ++j) {
        integerRow = integerRow && Number.isInteger(matrix[4 * i + j]);
      }

      if (integerRow) {
        size[i] = 1;
      }
    }

    return size;
  };

  publicAPI.internalUpdate = function () {
    model.interpolationInfo.interpolationMode = model.interpolationMode;
  };

  publicAPI.isSeparable = function () {
    return true;
  };

  publicAPI.interpolateNearest = function (interpolationInfo, point, value) {
    var inExt = interpolationInfo.extent;
    var inInc = interpolationInfo.increments;
    var numscalars = interpolationInfo.numberOfComponents;
    var inIdX0 = vtkInterpolationMathRound(point[0]);
    var inIdY0 = vtkInterpolationMathRound(point[1]);
    var inIdZ0 = vtkInterpolationMathRound(point[2]);

    switch (interpolationInfo.borderMode) {
      case ImageBorderMode.REPEAT:
        inIdX0 = vtkInterpolationMathWrap(inIdX0, inExt[0], inExt[1]);
        inIdY0 = vtkInterpolationMathWrap(inIdY0, inExt[2], inExt[3]);
        inIdZ0 = vtkInterpolationMathWrap(inIdZ0, inExt[4], inExt[5]);
        break;

      case ImageBorderMode.MIRROR:
        inIdX0 = vtkInterpolationMathMirror(inIdX0, inExt[0], inExt[1]);
        inIdY0 = vtkInterpolationMathMirror(inIdY0, inExt[2], inExt[3]);
        inIdZ0 = vtkInterpolationMathMirror(inIdZ0, inExt[4], inExt[5]);
        break;

      default:
        inIdX0 = vtkInterpolationMathClamp(inIdX0, inExt[0], inExt[1]);
        inIdY0 = vtkInterpolationMathClamp(inIdY0, inExt[2], inExt[3]);
        inIdZ0 = vtkInterpolationMathClamp(inIdZ0, inExt[4], inExt[5]);
        break;
    }

    var startId = inIdX0 * inInc[0] + inIdY0 * inInc[1] + inIdZ0 * inInc[2];

    for (var i = 0; i < numscalars; ++i) {
      value[i] = interpolationInfo.pointer[startId + i];
    }
  };

  publicAPI.interpolatePoint = function (interpolationInfo, point, value) {
    switch (model.interpolationMode) {
      case InterpolationMode.NEAREST:
      default:
        publicAPI.interpolateNearest(interpolationInfo, point, value);
        break;

      case InterpolationMode.LINEAR:
        console.log('LINEAR not implemented');
        break;

      case InterpolationMode.CUBIC:
        console.log('CUBIC not implemented');
        break;
    }
  };

  publicAPI.interpolateRowNearest = function (weights, idX, idY, idZ, outPtr, n) {
    // TODO check pointers
    var iX = weights.positions[0].subarray(idX);
    var iY = weights.positions[1].subarray(idY);
    var iZ = weights.positions[2].subarray(idZ);
    var inPtr0 = weights.pointer.subarray(iY[0] + iZ[0]); // get the number of components per pixel

    var numscalars = weights.numberOfComponents; // This is a hot loop.

    for (var i = 0; i < n; ++i) {
      outPtr.set(inPtr0.subarray(iX[i], numscalars), i * numscalars);
    }
  };

  publicAPI.interpolateRow = function (weights, xIdx, yIdx, zIdx, value, n) {
    switch (model.interpolationMode) {
      case InterpolationMode.NEAREST:
      default:
        publicAPI.interpolateRowNearest(weights, xIdx, yIdx, zIdx, value, n);
        break;

      case InterpolationMode.LINEAR:
        console.log('LINEAR not implemented');
        break;

      case InterpolationMode.CUBIC:
        console.log('CUBIC not implemented');
        break;
    }
  };

  publicAPI.vtkTricubicInterpWeights = function (f) {
    var half = 0.5; // cubic interpolation

    var fm1 = f - 1;
    var fd2 = f * half;
    var ft3 = f * 3;
    return [-fd2 * fm1 * fm1, ((ft3 - 2) * fd2 - 1) * fm1, -((ft3 - 4) * f - 1) * fd2, f * fd2 * fm1];
  };

  publicAPI.precomputeWeightsForExtent = function (matrix, outExt, clipExt) {
    var weights = _objectSpread(_objectSpread({}, vtkInterpolationWeights.newInstance()), model.interpolationInfo);

    weights.weightType = 'Float32Array';
    var interpMode = weights.interpolationMode;
    var validClip = true;

    for (var j = 0; j < 3; ++j) {
      // set k to the row for which the element in column j is nonzero
      var k = void 0;

      for (k = 0; k < 3; ++k) {
        if (matrix[4 * j + k] !== 0) {
          break;
        }
      } // get the extents


      clipExt[2 * j] = outExt[2 * j];
      clipExt[2 * j + 1] = outExt[2 * j + 1];
      var minExt = weights.extent[2 * k];
      var maxExt = weights.extent[2 * k + 1];
      var minBounds = model.structuredBounds[2 * k];
      var maxBounds = model.structuredBounds[2 * k + 1]; // the kernel size should not exceed the input dimension

      var step = 1;
      step = interpMode < InterpolationMode.LINEAR ? step : 2;
      step = interpMode < InterpolationMode.CUBIC ? step : 4;
      var inCount = maxExt - minExt + 1;
      step = step < inCount ? step : inCount; // if output pixels lie exactly on top of the input pixels

      if (Number.isInteger(matrix[4 * j + k]) && Number.isInteger(matrix[4 * k + k])) {
        step = 1;
      }

      var size = step * (outExt[2 * j + 1] - outExt[2 * j] + 1); // TODO: check pointers

      var positions = new Int16Array(size); // positions -= step*outExt[2 * j];

      var startPositions = step * outExt[2 * j];
      var constants = null;

      if (interpMode !== InterpolationMode.NEAREST) {
        constants = new Int16Array(size); // constants -= step * outExt[2 * j];
      }

      weights.kernelSize[j] = step;
      weights.weightExtent[2 * j] = outExt[2 * j];
      weights.weightExtent[2 * j + 1] = outExt[2 * j + 1];
      weights.positions[j] = positions; // TODO: check pointers

      weights.weights[j] = constants; // TODO: check pointers

      var region = 0;

      for (var i = outExt[2 * j]; i <= outExt[2 * j + 1]; ++i) {
        var point = matrix[4 * 3 + k] + i * matrix[4 * j + k];
        var lcount = step;
        var inId0 = 0;
        var f = 0;

        if (interpMode === InterpolationMode.NEAREST) {
          inId0 = Math.round(point);
        } else {
          var res = vtkInterpolationMathFloor(point);
          inId0 = res.integer;
          f = res.error;

          if (interpMode === InterpolationMode.CUBIC && step !== 1) {
            inId0--;
            lcount = 4;
          }
        }

        var inId = [0, 0, 0, 0];
        var l = 0;

        switch (weights.borderMode) {
          case ImageBorderMode.REPEAT:
            do {
              inId[l] = vtkInterpolationMathWrap(inId0, minExt, maxExt);
              inId0++;
            } while (++l < lcount);

            break;

          case ImageBorderMode.MIRROR:
            do {
              inId[l] = vtkInterpolationMathMirror(inId0, minExt, maxExt);
              inId0++;
            } while (++l < lcount);

            break;

          default:
            do {
              inId[l] = vtkInterpolationMathClamp(inId0, minExt, maxExt);
              inId0++;
            } while (++l < lcount);

            break;
        } // compute the weights and offsets


        var inInc = weights.increments[k];
        positions[step * i - startPositions] = inId[0] * inInc;

        if (interpMode !== InterpolationMode.NEAREST) {
          constants[step * i - startPositions] = 1;
        }

        if (step > 1) {
          if (interpMode === InterpolationMode.LINEAR) {
            positions[step * i + 1 - startPositions] = inId[1] * inInc;
            constants[step * i - startPositions] = 1.0 - f;
            constants[step * i + 1 - startPositions] = f;
          } else if (interpMode === InterpolationMode.CUBIC) {
            var g = publicAPI.vtkTricubicInterpWeights(f);

            if (step === 4) {
              for (var ll = 0; ll < 4; ll++) {
                positions[step * i + ll - startPositions] = inId[ll] * inInc;
                constants[step * i + ll - startPositions] = g[ll];
              }
            } else {
              // it gets tricky if there are fewer than 4 slices
              var gg = [0, 0, 0, 0];

              for (var _ll = 0; _ll < 4; _ll++) {
                var rIdx = inId[_ll] - minExt;
                gg[rIdx] += g[_ll];
              }

              for (var jj = 0; jj < step; jj++) {
                positions[step * i + jj - startPositions] = minExt + jj;
                constants[step * i + jj - startPositions] = gg[jj];
              }
            }
          }
        }

        if (point >= minBounds && point <= maxBounds) {
          if (region === 0) {
            // entering the input extent
            region = 1;
            clipExt[2 * j] = i;
          }
        } else if (region === 1) {
          // leaving the input extent
          region = 2;
          clipExt[2 * j + 1] = i - 1;
        }
      }

      if (region === 0 || clipExt[2 * j] > clipExt[2 * j + 1]) {
        // never entered input extent!
        validClip = false;
      }
    }

    if (!validClip) {
      // output extent doesn't itersect input extent
      for (var _j = 0; _j < 3; _j++) {
        clipExt[2 * _j] = outExt[2 * _j];
        clipExt[2 * _j + 1] = outExt[2 * _j] - 1;
      }
    }
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  interpolationMode: InterpolationMode.NEAREST
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkAbstractImageInterpolator.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['interpolationMode']); // Object specific methods

  vtkImageInterpolator(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkImageInterpolator'); // ----------------------------------------------------------------------------

var vtkImageInterpolator$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkImageInterpolator$1 as default, extend, newInstance };
