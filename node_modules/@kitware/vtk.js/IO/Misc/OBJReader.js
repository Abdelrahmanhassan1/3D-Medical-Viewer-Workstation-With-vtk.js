import _slicedToArray from '@babel/runtime/helpers/slicedToArray';
import macro from '../../macros.js';
import DataAccessHelper from '../Core/DataAccessHelper.js';
import vtkDataArray from '../../Common/Core/DataArray.js';
import vtkPolyData from '../../Common/DataModel/PolyData.js';
import '../Core/DataAccessHelper/LiteHttpDataAccessHelper.js';

// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + gz
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip
// ----------------------------------------------------------------------------

var data = {}; // ----------------------------------------------------------------------------

function pushVector(src, srcOffset, dst, vectorSize) {
  for (var i = 0; i < vectorSize; i++) {
    dst.push(src[srcOffset + i]);
  }
} // ----------------------------------------------------------------------------


function begin(splitMode) {
  data.splitOn = splitMode;
  data.pieces = [];
  data.v = [];
  data.vt = [];
  data.vn = [];
  data.f = [[]];
  data.size = 0;
} // ----------------------------------------------------------------------------


function faceMap(str) {
  var idxs = str.split('/').map(function (i) {
    return Number(i);
  });
  var vertexIdx = idxs[0] - 1;
  var textCoordIdx = idxs[1] ? idxs[1] - 1 : vertexIdx;
  var vertexNormal = idxs[2] ? idxs[2] - 1 : vertexIdx;
  return [vertexIdx, textCoordIdx, vertexNormal];
} // ----------------------------------------------------------------------------


function parseLine(line) {
  if (line[0] === '#') {
    return;
  }

  var tokens = line.split(/[ \t]+/);

  if (tokens[0] === data.splitOn) {
    tokens.shift();
    data.pieces.push(tokens.join(' ').trim());
    data.f.push([]);
    data.size++;
  } else if (tokens[0] === 'v') {
    data.v.push(Number(tokens[1]));
    data.v.push(Number(tokens[2]));
    data.v.push(Number(tokens[3]));
  } else if (tokens[0] === 'vt') {
    data.vt.push(Number(tokens[1]));
    data.vt.push(Number(tokens[2]));
  } else if (tokens[0] === 'vn') {
    data.vn.push(Number(tokens[1]));
    data.vn.push(Number(tokens[2]));
    data.vn.push(Number(tokens[3]));
  } else if (tokens[0] === 'f') {
    // Handle triangles for now
    if (data.size === 0) {
      data.size++;
    }

    var cells = data.f[data.size - 1];
    tokens.shift();
    var faces = tokens.filter(function (s) {
      return s.length > 0 && s !== '\r';
    });
    var size = faces.length;
    cells.push(size);

    for (var i = 0; i < size; i++) {
      cells.push(faceMap(faces[i]));
    }
  }
} // ----------------------------------------------------------------------------


function end(model) {
  var hasTcoords = !!data.vt.length;
  var hasNormals = !!data.vn.length;

  if (model.splitMode) {
    model.numberOfOutputs = data.size;

    for (var idx = 0; idx < data.size; idx++) {
      var ctMapping = {};
      var polydata = vtkPolyData.newInstance({
        name: data.pieces[idx]
      });
      var pts = [];
      var tc = [];
      var normals = [];
      var polys = [];
      var polyIn = data.f[idx];
      var nbElems = polyIn.length;
      var offset = 0;

      while (offset < nbElems) {
        var cellSize = polyIn[offset];
        polys.push(cellSize);

        for (var pIdx = 0; pIdx < cellSize; pIdx++) {
          var _polyIn = _slicedToArray(polyIn[offset + pIdx + 1], 3),
              vIdx = _polyIn[0],
              tcIdx = _polyIn[1],
              nIdx = _polyIn[2];

          var key = "".concat(vIdx, "/").concat(tcIdx, "/").concat(nIdx);

          if (ctMapping[key] === undefined) {
            ctMapping[key] = pts.length / 3;
            pushVector(data.v, vIdx * 3, pts, 3);

            if (hasTcoords) {
              pushVector(data.vt, tcIdx * 2, tc, 2);
            }

            if (hasNormals) {
              pushVector(data.vn, nIdx * 3, normals, 3);
            }
          }

          polys.push(ctMapping[key]);
        }

        offset += cellSize + 1;
      }

      polydata.getPoints().setData(Float32Array.from(pts), 3);
      polydata.getPolys().setData(Uint32Array.from(polys));

      if (hasTcoords) {
        var tcoords = vtkDataArray.newInstance({
          numberOfComponents: 2,
          values: Float32Array.from(tc),
          name: 'TextureCoordinates'
        });
        polydata.getPointData().setTCoords(tcoords);
      }

      if (hasNormals) {
        var normalsArray = vtkDataArray.newInstance({
          numberOfComponents: 3,
          values: Float32Array.from(normals),
          name: 'Normals'
        });
        polydata.getPointData().setNormals(normalsArray);
      } // register in output


      model.output[idx] = polydata;
    }
  } else {
    model.numberOfOutputs = 1;

    var _polydata = vtkPolyData.newInstance();

    _polydata.getPoints().setData(Float32Array.from(data.v), 3);

    if (hasTcoords && data.v.length / 3 === data.vt.length / 2) {
      var _tcoords = vtkDataArray.newInstance({
        numberOfComponents: 2,
        values: Float32Array.from(data.vt),
        name: 'TextureCoordinates'
      });

      _polydata.getPointData().setTCoords(_tcoords);
    }

    if (hasNormals && data.v.length === data.vn.length) {
      var _normalsArray = vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: Float32Array.from(data.vn),
        name: 'Normals'
      });

      _polydata.getPointData().setNormals(_normalsArray);
    }

    var _polys = [];
    var _polyIn2 = data.f[0];
    var _nbElems = _polyIn2.length;
    var _offset = 0;

    while (_offset < _nbElems) {
      var _cellSize = _polyIn2[_offset];

      _polys.push(_cellSize);

      for (var _pIdx = 0; _pIdx < _cellSize; _pIdx++) {
        var _polyIn3 = _slicedToArray(_polyIn2[_offset + _pIdx + 1], 1),
            _vIdx = _polyIn3[0];

        _polys.push(_vIdx);
      }

      _offset += _cellSize + 1;
    }

    _polydata.getPolys().setData(Uint32Array.from(_polys));

    model.output[0] = _polydata;
  }
} // ----------------------------------------------------------------------------
// vtkOBJReader methods
// ----------------------------------------------------------------------------


function vtkOBJReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOBJReader'); // Create default dataAccessHelper if not available

  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  } // Internal method to fetch Array


  function fetchData(url) {
    var option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return model.dataAccessHelper.fetchText(publicAPI, url, option);
  } // Set DataSet url


  publicAPI.setUrl = function (url) {
    var option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (url.indexOf('.obj') === -1 && !option.fullpath) {
      model.baseURL = url;
      model.url = "".concat(url, "/index.obj");
    } else {
      model.url = url; // Remove the file in the URL

      var path = url.split('/');
      path.pop();
      model.baseURL = path.join('/');
    } // Fetch metadata


    return publicAPI.loadData(option);
  }; // Fetch the actual data arrays


  publicAPI.loadData = function () {
    var option = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return fetchData(model.url, option).then(publicAPI.parseAsText);
  };

  publicAPI.parseAsText = function (content) {
    if (!content) {
      return true;
    }

    if (content !== model.parseData) {
      publicAPI.modified();
    }

    model.parseData = content;
    model.numberOfOutputs = 0;
    begin(model.splitMode);
    content.split('\n').forEach(parseLine);
    end(model);
    return true;
  };

  publicAPI.requestData = function (inData, outData) {
    publicAPI.parseAsText(model.parseData);
  }; // return Busy state


  publicAPI.isBusy = function () {
    return !!model.requestCount;
  };

  publicAPI.getNumberOfOutputPorts = function () {
    return model.numberOfOutputs;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  numberOfOutputs: 1,
  requestCount: 0,
  splitMode: null // baseURL: null,
  // dataAccessHelper: null,
  // url: null,

}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['url', 'baseURL']);
  macro.setGet(publicAPI, model, ['dataAccessHelper', 'splitMode']);
  macro.algo(publicAPI, model, 0, 1);
  macro.event(publicAPI, model, 'busy'); // Object methods

  vtkOBJReader(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkOBJReader'); // ----------------------------------------------------------------------------

var vtkOBJReader$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkOBJReader$1 as default, extend, newInstance };
