import macro from '../../macros.js';
import vtkCardinalSpline1D from './CardinalSpline1D.js';
import vtkKochanekSpline1D from './KochanekSpline1D.js';
import { splineKind } from './Spline3D/Constants.js';

var vtkErrorMacro = macro.vtkErrorMacro; // ----------------------------------------------------------------------------
// vtkSpline3D methods
// ----------------------------------------------------------------------------

function vtkSpline3D(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkSpline3D'); // --------------------------------------------------------------------------

  function computeCoefficients1D(spline, points) {
    if (points.length === 0) {
      vtkErrorMacro('Splines require at least one points');
    } // If we have only one point we create a spline
    // which two extremities are the same point


    if (points.length === 1) {
      points.push(points[0]);
    }

    var size = points.length;
    var work = null;
    var intervals = null;

    if (model.close) {
      work = new Float32Array(size);

      if (model.intervals.length === 0) {
        intervals = new Float32Array(size);

        for (var i = 0; i < intervals.length; i++) {
          intervals[i] = i;
        }
      } else {
        intervals = model.intervals;
      }

      spline.computeCloseCoefficients(size, work, intervals, points);
    } else {
      vtkErrorMacro('Open splines are not supported yet!');
    }
  } // --------------------------------------------------------------------------


  publicAPI.computeCoefficients = function (points) {
    var x = points.map(function (pt) {
      return pt[0];
    });
    var y = points.map(function (pt) {
      return pt[1];
    });
    var z = points.map(function (pt) {
      return pt[2];
    });
    computeCoefficients1D(model.splineX, x);
    computeCoefficients1D(model.splineY, y);
    computeCoefficients1D(model.splineZ, z);
  }; // --------------------------------------------------------------------------


  publicAPI.getPoint = function (intervalIndex, t) {
    return [model.splineX.getValue(intervalIndex, t), model.splineY.getValue(intervalIndex, t), model.splineZ.getValue(intervalIndex, t)];
  }; // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------


  if (model.kind === splineKind.KOCHANEK_SPLINE) {
    model.splineX = vtkKochanekSpline1D.newInstance({
      tension: model.tension,
      continuity: model.continuity,
      bias: model.bias
    });
    model.splineY = vtkKochanekSpline1D.newInstance({
      tension: model.tension,
      continuity: model.continuity,
      bias: model.bias
    });
    model.splineZ = vtkKochanekSpline1D.newInstance({
      tension: model.tension,
      continuity: model.continuity,
      bias: model.bias
    });
  } else if (model.kind === splineKind.CARDINAL_SPLINE) {
    model.splineX = vtkCardinalSpline1D.newInstance();
    model.splineY = vtkCardinalSpline1D.newInstance();
    model.splineZ = vtkCardinalSpline1D.newInstance();
  } else {
    vtkErrorMacro("Unknown spline type ".concat(model.kind));
  }
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  close: false,
  intervals: [],
  kind: splineKind.KOCHANEK_SPLINE,
  // Passed to the vtkKochanekSpline1D
  tension: 0,
  continuity: 0,
  bias: 0
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['close', 'intervals']);
  vtkSpline3D(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkSpline3D'); // ----------------------------------------------------------------------------

var vtkSpline3D$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkSpline3D$1 as default, extend, newInstance };
