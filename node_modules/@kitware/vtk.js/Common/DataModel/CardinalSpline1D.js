import macro from '../../macros.js';
import vtkSpline1D from './Spline1D.js';

var vtkErrorMacro = macro.vtkErrorMacro; // ----------------------------------------------------------------------------
// vtkCardinalSpline1D methods
// ----------------------------------------------------------------------------

function vtkCardinalSpline1D(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkCardinalSpline1D'); // --------------------------------------------------------------------------

  publicAPI.computeCloseCoefficients = function (size, work, x, y) {
    if (!model.coefficients || model.coefficients.length !== 4 * size) {
      model.coefficients = new Float32Array(4 * size);
    }

    var N = size - 1;

    for (var k = 1; k < N; k++) {
      var _xlk = x[k] - x[k - 1];

      var _xlkp = x[k + 1] - x[k];

      model.coefficients[4 * k + 0] = _xlkp;
      model.coefficients[4 * k + 1] = 2 * (_xlkp + _xlk);
      model.coefficients[4 * k + 2] = _xlk;
      work[k] = 3.0 * (_xlkp * (y[k] - y[k - 1]) / _xlk + _xlk * (y[k + 1] - y[k]) / _xlkp);
    }

    var xlk = x[N] - x[N - 1];
    var xlkp = x[1] - x[0];
    model.coefficients[4 * N + 0] = xlkp;
    model.coefficients[4 * N + 1] = 2 * (xlkp + xlk);
    model.coefficients[4 * N + 2] = xlk;
    work[N] = 3 * (xlkp * (y[N] - y[N - 1]) / xlk + xlk * (y[1] - y[0]) / xlkp);
    var aN = model.coefficients[4 * N + 0];
    var bN = model.coefficients[4 * N + 1];
    var cN = model.coefficients[4 * N + 2];
    var dN = work[N]; // solve resulting set of equations.

    model.coefficients[0 * 4 + 2] = 0;
    work[0] = 0;
    model.coefficients[0 * 4 + 3] = 1;

    for (var _k = 1; _k <= N; _k++) {
      model.coefficients[4 * _k + 1] -= model.coefficients[4 * _k + 0] * model.coefficients[4 * (_k - 1) + 2];
      model.coefficients[4 * _k + 2] = model.coefficients[4 * _k + 2] / model.coefficients[4 * _k + 1];
      work[_k] = (work[_k] - model.coefficients[4 * _k + 0] * work[_k - 1]) / model.coefficients[4 * _k + 1];
      model.coefficients[4 * _k + 3] = -model.coefficients[4 * _k + 0] * model.coefficients[4 * (_k - 1) + 3] / model.coefficients[4 * _k + 1];
    }

    model.coefficients[4 * N + 0] = 1;
    model.coefficients[4 * N + 1] = 0;

    for (var _k2 = N - 1; _k2 > 0; _k2--) {
      model.coefficients[4 * _k2 + 0] = model.coefficients[4 * _k2 + 3] - model.coefficients[4 * _k2 + 2] * model.coefficients[4 * (_k2 + 1) + 0];
      model.coefficients[4 * _k2 + 1] = work[_k2] - model.coefficients[4 * _k2 + 2] * model.coefficients[4 * (_k2 + 1) + 1];
    }

    work[0] = (dN - cN * model.coefficients[4 * 1 + 1] - aN * model.coefficients[4 * (N - 1) + 1]) / (bN + cN * model.coefficients[4 * 1 + 0] + aN * model.coefficients[4 * (N - 1) + 0]);
    work[N] = work[0];

    for (var _k3 = 1; _k3 < N; _k3++) {
      work[_k3] = model.coefficients[4 * _k3 + 0] * work[N] + model.coefficients[4 * _k3 + 1];
    } // the column vector work now contains the first
    // derivative of the spline function at each joint.
    // compute the coefficients of the cubic between
    // each pair of joints.


    for (var _k4 = 0; _k4 < N; _k4++) {
      var b = x[_k4 + 1] - x[_k4];
      model.coefficients[4 * _k4 + 0] = y[_k4];
      model.coefficients[4 * _k4 + 1] = work[_k4];
      model.coefficients[4 * _k4 + 2] = 3 * (y[_k4 + 1] - y[_k4]) / (b * b) - (work[_k4 + 1] + 2 * work[_k4]) / b;
      model.coefficients[4 * _k4 + 3] = 2 * (y[_k4] - y[_k4 + 1]) / (b * b * b) + (work[_k4 + 1] + work[_k4]) / (b * b);
    } // the coefficients of a fictitious nth cubic
    // are the same as the coefficients in the first interval


    model.coefficients[4 * N + 0] = y[N];
    model.coefficients[4 * N + 1] = work[N];
    model.coefficients[4 * N + 2] = model.coefficients[4 * 0 + 2];
    model.coefficients[4 * N + 3] = model.coefficients[4 * 0 + 3];
  }; // --------------------------------------------------------------------------


  publicAPI.computeOpenCoefficients = function (size, work, x, y) {
    vtkErrorMacro('Open splines are not implemented yet!');
  }; // --------------------------------------------------------------------------


  publicAPI.getValue = function (intervalIndex, t) {
    var t2 = t * t;
    var t3 = t * t * t;
    return model.coefficients[4 * intervalIndex + 3] * t3 + model.coefficients[4 * intervalIndex + 2] * t2 + model.coefficients[4 * intervalIndex + 1] * t + model.coefficients[4 * intervalIndex + 0];
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkSpline1D.extend(publicAPI, model, initialValues); // Build VTK API

  macro.obj(publicAPI, model);
  vtkCardinalSpline1D(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkCardinalSpline1D'); // ----------------------------------------------------------------------------

var vtkCardinalSpline1D$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkCardinalSpline1D$1 as default, extend, newInstance };
