import JSZip from 'jszip';
import macro from '../../macros.js';
import vtkSerializer from './Serializer.js';
import vtkDataArray from '../../Common/Core/DataArray.js';

var vtkErrorMacro = macro.vtkErrorMacro; // ----------------------------------------------------------------------------
// vtkAppendPolyData methods
// ----------------------------------------------------------------------------

function vtkZipMultiDataSetWriter(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkZipMultiDataSetWriter');

  publicAPI.requestData = function (inData, outData) {
    // implement requestData
    var numberOfInputs = publicAPI.getNumberOfInputPorts();

    if (!numberOfInputs) {
      vtkErrorMacro('No input specified.');
      return;
    } // Default array handler


    var arrayHandler = vtkSerializer.vtkArraySerializer.newInstance();
    model.datasets = [];

    for (var i = 0; i < numberOfInputs; i++) {
      var ds = inData[i];
      var serializer = vtkSerializer.getSerializer(ds);

      if (serializer) {
        model.datasets.push(serializer.serialize(ds, arrayHandler));
      } else {
        console.error('Could not find serializer for', ds.getClassName());
      }
    }

    model.arrays = arrayHandler.arrays;
  };

  publicAPI.write = function () {
    publicAPI.update(); // Write to zip

    if (model.zipFile) {
      model.zipFile = new JSZip();
    } // Write metadata


    model.zipFile.file('datasets.json', JSON.stringify(model.datasets)); // Write Arrays

    for (var i = 0; i < model.arrays.length; i++) {
      model.zipFile.file("array_".concat(vtkDataArray.getDataType(model.arrays[i]), "_").concat(i), model.arrays[i], {
        binary: true
      });
    }

    model.zipFile.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: model.compressionLevel
      }
    }).then(function (blob) {
      model.blob = blob;
      return blob;
    });
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  zipFile: null,
  compressionLevel: 6,
  blob: null
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Make this a VTK object

  macro.obj(publicAPI, model); // Also make it an algorithm with one input and one output

  macro.algo(publicAPI, model, 1, 0);
  macro.setGet(publicAPI, model, ['zipFile', 'compressionLevel']);
  macro.get(publicAPI, model, ['blob']); // Object specific methods

  vtkZipMultiDataSetWriter(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkZipMultiDataSetWriter'); // ----------------------------------------------------------------------------

var index = {
  newInstance: newInstance,
  extend: extend
};

export { index as default, extend, newInstance };
