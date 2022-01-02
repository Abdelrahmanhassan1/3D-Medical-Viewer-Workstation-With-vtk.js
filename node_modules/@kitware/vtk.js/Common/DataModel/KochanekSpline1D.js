import macro from '../../macros.js';
import vtkSpline1D from './Spline1D.js';

var vtkErrorMacro = macro.vtkErrorMacro; // ----------------------------------------------------------------------------
// vtkKochanekSpline1D methods
// ----------------------------------------------------------------------------

function vtkKochanekSpline1D(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkKochanekSpline1D'); // --------------------------------------------------------------------------

  publicAPI.computeCloseCoefficients = function (size, work, x, y) {
    if (!model.coefficients || model.coefficients.length !== 4 * size) {
      model.coefficients = new Float32Array(4 * size);
    }

    var N = size - 1;

    for (var i = 1; i < N; i++) {
      var _cs = y[i] - y[i - 1];

      var _cd = y[i + 1] - y[i];

      var _ds = _cs * ((1 - model.tension) * (1 - model.continuity) * (1 + model.bias)) + _cd * ((1 - model.tension) * (1 + model.continuity) * (1 - model.bias));

      var _dd = _cs * ((1 - model.tension) * (1 + model.continuity) * (1 + model.bias)) + _cd * ((1 - model.tension) * (1 - model.continuity) * (1 - model.bias)); // adjust deriviatives for non uniform spacing between nodes


      var _n = x[i + 1] - x[i];

      var _n2 = x[i] - x[i - 1];

      _ds *= _n2 / (_n2 + _n);
      _dd *= _n / (_n2 + _n);
      model.coefficients[4 * i + 0] = y[i];
      model.coefficients[4 * i + 1] = _dd;
      model.coefficients[4 * i + 2] = _ds;
    } // Calculate the deriviatives at the end points


    model.coefficients[4 * 0 + 0] = y[0];
    model.coefficients[4 * N + 0] = y[N];
    model.coefficients[4 * N + 1] = 0;
    model.coefficients[4 * N + 2] = 0;
    model.coefficients[4 * N + 3] = 0; // The curve is continuous and closed at P0=Pn

    var cs = y[N] - y[N - 1];
    var cd = y[1] - y[0];
    var ds = cs * ((1 - model.tension) * (1 - model.continuity) * (1 + model.bias)) + cd * ((1 - model.tension) * (1 + model.continuity) * (1 - model.bias));
    var dd = cs * ((1 - model.tension) * (1 + model.continuity) * (1 + model.bias)) + cd * ((1 - model.tension) * (1 - model.continuity) * (1 - model.bias)); // adjust deriviatives for non uniform spacing between nodes

    var n1 = x[1] - x[0];
    var n0 = x[N] - x[N - 1];
    ds *= n0 / (n0 + n1);
    dd *= n1 / (n0 + n1);
    model.coefficients[4 * 0 + 1] = dd;
    model.coefficients[4 * 0 + 2] = ds;
    model.coefficients[4 * N + 1] = dd;
    model.coefficients[4 * N + 2] = ds;

    for (var _i = 0; _i < N; _i++) {
      //
      // c0    = P ;    c1    = DD ;
      //   i      i       i       i
      //
      // c1    = P   ;  c2    = DS   ;
      //   i+1    i+1     i+1     i+1
      //
      // c2  = -3P  + 3P    - 2DD  - DS   ;
      //   i      i     i+1      i     i+1
      //
      // c3  =  2P  - 2P    +  DD  + DS   ;
      //   i      i     i+1      i     i+1
      //
      model.coefficients[4 * _i + 2] = -3 * y[_i] + 3 * y[_i + 1] + -2 * model.coefficients[4 * _i + 1] + -1 * model.coefficients[4 * (_i + 1) + 2];
      model.coefficients[4 * _i + 3] = 2 * y[_i] + -2 * y[_i + 1] + 1 * model.coefficients[4 * _i + 1] + 1 * model.coefficients[4 * (_i + 1) + 2];
    }
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


var DEFAULT_VALUES = {
  tension: 0,
  bias: 0,
  continuity: 0
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkSpline1D.extend(publicAPI, model, initialValues); // Build VTK API

  macro.obj(publicAPI, model);
  vtkKochanekSpline1D(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkKochanekSpline1D'); // ----------------------------------------------------------------------------

var vtkKochanekSpline1D$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkKochanekSpline1D$1 as default, extend, newInstance };
