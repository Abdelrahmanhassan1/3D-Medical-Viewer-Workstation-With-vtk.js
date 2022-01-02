import JSZip from 'jszip';
import pako from 'pako';
import macro from '../../../macros.js';
import Endian from '../../../Common/Core/Endian.js';
import { DataTypeByteSize } from '../../../Common/Core/DataArray/Constants.js';
import { registerType } from '../DataAccessHelper.js';

var vtkErrorMacro = macro.vtkErrorMacro,
    vtkDebugMacro = macro.vtkDebugMacro;

function toMimeType(url) {
  var ext = url.split('.').pop().toLowerCase();

  if (ext === 'jpg') {
    return 'jpeg';
  }

  return ext;
}

function handleUint8Array(array, compression, done) {
  return function (uint8array) {
    array.buffer = new ArrayBuffer(uint8array.length); // copy uint8array to buffer

    var view = new Uint8Array(array.buffer);
    view.set(uint8array);

    if (compression) {
      if (array.dataType === 'string' || array.dataType === 'JSON') {
        array.buffer = pako.inflate(new Uint8Array(array.buffer), {
          to: 'string'
        });
      } else {
        array.buffer = pako.inflate(new Uint8Array(array.buffer)).buffer;
      }
    }

    if (array.ref.encode === 'JSON') {
      array.values = JSON.parse(array.buffer);
    } else {
      if (Endian.ENDIANNESS !== array.ref.encode && Endian.ENDIANNESS) {
        // Need to swap bytes
        vtkDebugMacro("Swap bytes of ".concat(array.name));
        Endian.swapBytes(array.buffer, DataTypeByteSize[array.dataType]);
      }

      array.values = macro.newTypedArray(array.dataType, array.buffer);
    }

    if (array.values.length !== array.size) {
      vtkErrorMacro("Error in FetchArray: ".concat(array.name, " does not have the proper array size. Got ").concat(array.values.length, ", instead of ").concat(array.size));
    }

    done();
  };
}

function handleString(array, compression, done) {
  return function (string) {
    if (compression) {
      array.values = JSON.parse(pako.inflate(string, {
        to: 'string'
      }));
    } else {
      array.values = JSON.parse(string);
    }

    done();
  };
}

var handlers = {
  uint8array: handleUint8Array,
  string: handleString
};

function removeLeadingSlash(str) {
  return str[0] === '/' ? str.substr(1) : str;
}

function normalizePath(str) {
  return new URL(str, 'http://any').pathname;
}

function cleanUpPath(str) {
  return removeLeadingSlash(normalizePath(str));
}

function create(createOptions) {
  var ready = false;
  var requestCount = 0;
  var zip = new JSZip();
  var zipRoot = zip;
  zip.loadAsync(createOptions.zipContent).then(function () {
    ready = true; // Find root index.json

    var metaFiles = [];
    zip.forEach(function (relativePath, zipEntry) {
      if (relativePath.indexOf('index.json') !== -1) {
        metaFiles.push(relativePath);
      }
    });
    metaFiles.sort(function (a, b) {
      return a.length - b.length;
    });
    var fullRootPath = metaFiles[0].split('/');

    while (fullRootPath.length > 1) {
      var dirName = fullRootPath.shift();
      zipRoot = zipRoot.folder(dirName);
    }

    if (createOptions.callback) {
      createOptions.callback(zip);
    }
  });
  return {
    fetchArray: function fetchArray() {
      var instance = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var baseURL = arguments.length > 1 ? arguments[1] : undefined;
      var array = arguments.length > 2 ? arguments[2] : undefined;
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      return new Promise(function (resolve, reject) {
        if (!ready) {
          vtkErrorMacro('ERROR!!! zip not ready...');
        }

        var url = cleanUpPath([baseURL, array.ref.basepath, options.compression ? "".concat(array.ref.id, ".gz") : array.ref.id].join('/'));

        if (++requestCount === 1 && instance.invokeBusy) {
          instance.invokeBusy(true);
        }

        function doneCleanUp() {
          // Done with the ref and work
          delete array.ref;

          if (--requestCount === 0 && instance.invokeBusy) {
            instance.invokeBusy(false);
          }

          if (instance.modified) {
            instance.modified();
          }

          resolve(array);
        }

        var asyncType = array.dataType === 'string' && !options.compression ? 'string' : 'uint8array';
        var asyncCallback = handlers[asyncType](array, options.compression, doneCleanUp);
        zipRoot.file(url).async(asyncType).then(asyncCallback);
      });
    },
    fetchJSON: function fetchJSON() {
      var url = arguments.length > 1 ? arguments[1] : undefined;
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var path = cleanUpPath(url);

      if (!ready) {
        vtkErrorMacro('ERROR!!! zip not ready...');
      }

      if (options.compression) {
        if (options.compression === 'gz') {
          return zipRoot.file(path).async('uint8array').then(function (uint8array) {
            var str = pako.inflate(uint8array, {
              to: 'string'
            });
            return Promise.resolve(JSON.parse(str));
          });
        }

        return Promise.reject(new Error('Invalid compression'));
      }

      return zipRoot.file(path).async('string').then(function (str) {
        return Promise.resolve(JSON.parse(str));
      });
    },
    fetchText: function fetchText() {
      var url = arguments.length > 1 ? arguments[1] : undefined;
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var path = cleanUpPath(url);

      if (!ready) {
        vtkErrorMacro('ERROR!!! zip not ready...');
      }

      if (options.compression) {
        if (options.compression === 'gz') {
          return zipRoot.file(path).async('uint8array').then(function (uint8array) {
            var str = pako.inflate(uint8array, {
              to: 'string'
            });
            return Promise.resolve(str);
          });
        }

        return Promise.reject(new Error('Invalid compression'));
      }

      return zipRoot.file(path).async('string').then(function (str) {
        return Promise.resolve(str);
      });
    },
    fetchImage: function fetchImage() {
      var url = arguments.length > 1 ? arguments[1] : undefined;
      var path = cleanUpPath(url);

      if (!ready) {
        vtkErrorMacro('ERROR!!! zip not ready...');
      }

      return new Promise(function (resolve, reject) {
        var img = new Image();

        img.onload = function () {
          return resolve(img);
        };

        img.onerror = reject;
        zipRoot.file(path).async('base64').then(function (str) {
          img.src = "data:image/".concat(toMimeType(path), ";base64,").concat(str);
        });
      });
    },
    fetchBinary: function fetchBinary() {
      var url = arguments.length > 1 ? arguments[1] : undefined;
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var path = cleanUpPath(url);

      if (!ready) {
        vtkErrorMacro('ERROR!!! zip not ready...');
      }

      if (options.compression) {
        if (options.compression === 'gz') {
          return zipRoot.file(path).then(function (data) {
            var array = pako.inflate(data).buffer;
            return Promise.resolve(array);
          });
        }

        return Promise.reject(new Error('Invalid compression'));
      }

      return zipRoot.file(path).async('arraybuffer').then(function (data) {
        return Promise.resolve(data);
      });
    }
  };
}

var JSZipDataAccessHelper = {
  create: create
};
registerType('zip', function (options) {
  return JSZipDataAccessHelper.create(options);
});

export { JSZipDataAccessHelper as default };
