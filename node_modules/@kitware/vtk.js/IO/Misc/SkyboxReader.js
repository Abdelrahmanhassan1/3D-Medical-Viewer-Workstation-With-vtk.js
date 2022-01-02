import macro from '../../macros.js';
import ImageHelper from '../../Common/Core/ImageHelper.js';
import vtkTexture from '../../Rendering/Core/Texture.js';
import JSZip from 'jszip';

// vtkSkyboxReader methods
// ----------------------------------------------------------------------------

function vtkSkyboxReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSkyboxReader'); // Internal method to fetch Array

  function fetchData(url) {
    var compression = model.compression,
        progressCallback = model.progressCallback;
    return model.dataAccessHelper.fetchBinary(url, {
      compression: compression,
      progressCallback: progressCallback
    });
  } // Set DataSet url


  publicAPI.setUrl = function (url) {
    var option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    model.url = url; // Fetch metadata

    return publicAPI.loadData(option);
  }; // Fetch the actual data arrays


  publicAPI.loadData = function () {
    return fetchData(model.url).then(publicAPI.parseAsArrayBuffer);
  };

  publicAPI.parseAsArrayBuffer = function (content) {
    if (!content) {
      return false;
    }

    model.textures = {};
    model.busy = true;
    publicAPI.invokeBusy(model.busy);
    model.dataMapping = {};
    var workCount = 0;
    var canStartProcessing = false;
    var imageReady = [];

    function workDone() {
      workCount--; // Finish data processing

      if (workCount === 0 || canStartProcessing) {
        for (var i = 0; i < model.positions.length; i++) {
          var key = model.positions[i];
          var images = model.dataMapping[key];

          if (!model.textures[key]) {
            model.textures[key] = vtkTexture.newInstance({
              interpolate: true
            });
          }

          if (images) {
            var texture = model.textures[key];

            for (var idx = 0; idx < 6; idx++) {
              var _model$faceMapping$id = model.faceMapping[idx],
                  fileName = _model$faceMapping$id.fileName,
                  transform = _model$faceMapping$id.transform;
              var readyIndex = imageReady.indexOf("".concat(key, "/").concat(fileName));

              if (readyIndex !== -1) {
                texture.setInputData(ImageHelper.imageToImageData(images[fileName], transform), idx); // Free image

                URL.revokeObjectURL(images[fileName].src);
                delete images[fileName]; // Don't process again

                imageReady.splice(readyIndex, 1);
              }
            }
          }
        }

        if (workCount === 0) {
          model.busy = false;
          publicAPI.modified();
          publicAPI.invokeBusy(model.busy);
        }
      }
    }

    var zip = new JSZip();
    zip.loadAsync(content).then(function () {
      // Find root index.json
      zip.forEach(function (relativePath, zipEntry) {
        if (relativePath.match(/index.json$/)) {
          workCount++;
          zipEntry.async('text').then(function (txt) {
            var config = JSON.parse(txt);

            if (config.skybox && config.skybox.faceMapping) {
              model.faceMapping = config.skybox.faceMapping;
            }

            if (config.metadata && config.metadata.skybox && config.metadata.skybox.faceMapping) {
              model.faceMapping = config.metadata.skybox.faceMapping;
            }

            canStartProcessing = true;
            workDone();
          });
        }

        if (relativePath.match(/\.jpg$/)) {
          workCount++;
          var pathTokens = relativePath.split('/');
          var fileName = pathTokens.pop();
          var key = pathTokens.pop();

          if (!model.dataMapping[key]) {
            model.dataMapping[key] = {};
          }

          zipEntry.async('blob').then(function (blob) {
            var img = new Image();
            var readyKey = "".concat(key, "/").concat(fileName);
            model.dataMapping[key][fileName] = img;

            img.onload = function () {
              imageReady.push(readyKey);
              workDone();
            };

            img.src = URL.createObjectURL(blob);
          });
        }
      });
      model.positions = Object.keys(model.dataMapping);
      model.position = model.positions[0];
    });
    return publicAPI.getReadyPromise();
  };

  publicAPI.requestData = function (inData, outData) {
    outData[0] = model.textures[model.position];
  };

  publicAPI.setPosition = function (name) {
    if (model.positions.indexOf(name) !== -1 && name !== model.position) {
      model.position = name;
      publicAPI.modified();
    }
  };

  publicAPI.getReadyPromise = function () {
    if (!model.busy) {
      return Promise.resolve(publicAPI);
    }

    return new Promise(function (resolve, reject) {
      var subscription = publicAPI.onBusy(function (isBusy) {
        if (!isBusy) {
          subscription.unsubscribe();
          resolve(publicAPI);
        }
      });
    });
  }; // return Busy state


  publicAPI.isBusy = function () {
    return model.busy;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  // url: null,
  busy: false,
  // everything must be flipped in Y due to canvas
  // versus vtk ordering
  faceMapping: [{
    fileName: 'right.jpg',
    transform: {
      flipY: true
    }
  }, {
    fileName: 'left.jpg',
    transform: {
      flipY: true
    }
  }, {
    fileName: 'up.jpg',
    transform: {
      flipY: true
    }
  }, {
    fileName: 'down.jpg',
    transform: {
      flipY: true
    }
  }, {
    fileName: 'back.jpg',
    transform: {
      flipY: true
    }
  }, {
    fileName: 'front.jpg',
    transform: {
      flipY: true
    }
  }]
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['url', 'positions', 'position']);
  macro.setGet(publicAPI, model, ['faceMapping']);
  macro.event(publicAPI, model, 'busy');
  macro.algo(publicAPI, model, 0, 6); // Object methods

  vtkSkyboxReader(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkSkyboxReader'); // ----------------------------------------------------------------------------

var vtkSkyboxReader$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkSkyboxReader$1 as default, extend, newInstance };
