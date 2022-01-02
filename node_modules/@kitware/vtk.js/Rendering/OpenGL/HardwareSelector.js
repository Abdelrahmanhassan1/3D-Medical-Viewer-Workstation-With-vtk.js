import _defineProperty from '@babel/runtime/helpers/defineProperty';
import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import _asyncToGenerator from '@babel/runtime/helpers/asyncToGenerator';
import _regeneratorRuntime from '@babel/runtime/regenerator';
import macro from '../../macros.js';
import Constants from './HardwareSelector/Constants.js';
import vtkHardwareSelector$1 from '../Core/HardwareSelector.js';
import vtkOpenGLFramebuffer from './Framebuffer.js';
import vtkSelectionNode from '../../Common/DataModel/SelectionNode.js';
import vtkDataSet from '../../Common/DataModel/DataSet.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var PassTypes = Constants.PassTypes;
var SelectionContent = vtkSelectionNode.SelectionContent,
    SelectionField = vtkSelectionNode.SelectionField;
var FieldAssociations = vtkDataSet.FieldAssociations;
var vtkErrorMacro = macro.vtkErrorMacro;
var idOffset = 1;

function getInfoHash(info) {
  return "".concat(info.propID, " ").concat(info.compositeID);
}

function convert(xx, yy, pb, area) {
  if (!pb) {
    return 0;
  }

  var offset = (yy * (area[2] - area[0] + 1) + xx) * 4;
  var rgb = [];
  rgb[0] = pb[offset];
  rgb[1] = pb[offset + 1];
  rgb[2] = pb[offset + 2];
  var val = rgb[2];
  val *= 256;
  val += rgb[1];
  val *= 256;
  val += rgb[0];
  return val;
}

function getPixelInformationWithData(buffdata, inDisplayPosition, maxDistance, outSelectedPosition) {
  // Base case
  var maxDist = maxDistance < 0 ? 0 : maxDistance;

  if (maxDist === 0) {
    outSelectedPosition[0] = inDisplayPosition[0];
    outSelectedPosition[1] = inDisplayPosition[1];

    if (inDisplayPosition[0] < buffdata.area[0] || inDisplayPosition[0] > buffdata.area[2] || inDisplayPosition[1] < buffdata.area[1] || inDisplayPosition[1] > buffdata.area[3]) {
      return null;
    } // offset inDisplayPosition based on the lower-left-corner of the Area.


    var displayPosition = [inDisplayPosition[0] - buffdata.area[0], inDisplayPosition[1] - buffdata.area[1]];
    var actorid = convert(displayPosition[0], displayPosition[1], buffdata.pixBuffer[PassTypes.ACTOR_PASS], buffdata.area);

    if (actorid <= 0) {
      // the pixel did not hit any actor.
      return null;
    }

    var _info = {};
    _info.valid = true;
    _info.propID = actorid - idOffset;
    _info.prop = buffdata.props[_info.propID];
    var compositeID = convert(displayPosition[0], displayPosition[1], buffdata.pixBuffer[PassTypes.COMPOSITE_INDEX_PASS], buffdata.area);

    if (compositeID < 0 || compositeID > 0xffffff) {
      compositeID = 0;
    }

    _info.compositeID = compositeID - idOffset;

    if (buffdata.captureZValues) {
      var offset = (displayPosition[1] * (buffdata.area[2] - buffdata.area[0] + 1) + displayPosition[0]) * 4;
      _info.zValue = (256 * buffdata.zBuffer[offset] + buffdata.zBuffer[offset + 1]) / 65535.0;
      _info.displayPosition = inDisplayPosition;
    }

    return _info;
  } // Iterate over successively growing boxes.
  // They recursively call the base case to handle single pixels.


  var dispPos = [inDisplayPosition[0], inDisplayPosition[1]];
  var curPos = [0, 0];
  var info = getPixelInformationWithData(buffdata, inDisplayPosition, 0, outSelectedPosition);

  if (info && info.valid) {
    return info;
  }

  for (var dist = 1; dist < maxDist; ++dist) {
    // Vertical sides of box.
    for (var y = dispPos[1] > dist ? dispPos[1] - dist : 0; y <= dispPos[1] + dist; ++y) {
      curPos[1] = y;

      if (dispPos[0] >= dist) {
        curPos[0] = dispPos[0] - dist;
        info = getPixelInformationWithData(buffdata, curPos, 0, outSelectedPosition);

        if (info && info.valid) {
          return info;
        }
      }

      curPos[0] = dispPos[0] + dist;
      info = getPixelInformationWithData(buffdata, curPos, 0, outSelectedPosition);

      if (info && info.valid) {
        return info;
      }
    } // Horizontal sides of box.


    for (var x = dispPos[0] >= dist ? dispPos[0] - (dist - 1) : 0; x <= dispPos[0] + (dist - 1); ++x) {
      curPos[0] = x;

      if (dispPos[1] >= dist) {
        curPos[1] = dispPos[1] - dist;
        info = getPixelInformationWithData(buffdata, curPos, 0, outSelectedPosition);

        if (info && info.valid) {
          return info;
        }
      }

      curPos[1] = dispPos[1] + dist;
      info = getPixelInformationWithData(buffdata, curPos, 0, outSelectedPosition);

      if (info && info.valid) {
        return info;
      }
    }
  } // nothing hit.


  outSelectedPosition[0] = inDisplayPosition[0];
  outSelectedPosition[1] = inDisplayPosition[1];
  return null;
} //-----------------------------------------------------------------------------


function convertSelection(fieldassociation, dataMap, captureZValues, renderer, openGLRenderWindow) {
  var sel = [];
  var count = 0;
  dataMap.forEach(function (value, key) {
    var child = vtkSelectionNode.newInstance();
    child.setContentType(SelectionContent.INDICES);

    switch (fieldassociation) {
      case FieldAssociations.FIELD_ASSOCIATION_CELLS:
        child.setFieldType(SelectionField.CELL);
        break;

      case FieldAssociations.FIELD_ASSOCIATION_POINTS:
        child.setFieldType(SelectionField.POINT);
        break;

      default:
        vtkErrorMacro('Unknown field association');
    }

    child.getProperties().propID = value.info.propID;
    child.getProperties().prop = value.info.prop;
    child.getProperties().compositeID = value.info.compositeID;
    child.getProperties().pixelCount = value.pixelCount;

    if (captureZValues) {
      child.getProperties().displayPosition = [value.info.displayPosition[0], value.info.displayPosition[1], value.info.zValue];
      child.getProperties().worldPosition = openGLRenderWindow.displayToWorld(value.info.displayPosition[0], value.info.displayPosition[1], value.info.zValue, renderer);
    }

    child.setSelectionList(value.attributeIDs);
    sel[count] = child;
    count++;
  });
  return sel;
} //----------------------------------------------------------------------------


function generateSelectionWithData(buffdata, fx1, fy1, fx2, fy2) {
  var x1 = Math.floor(fx1);
  var y1 = Math.floor(fy1);
  var x2 = Math.floor(fx2);
  var y2 = Math.floor(fy2);
  var dataMap = new Map();
  var outSelectedPosition = [0, 0];

  for (var yy = y1; yy <= y2; yy++) {
    for (var xx = x1; xx <= x2; xx++) {
      var pos = [xx, yy];
      var info = getPixelInformationWithData(buffdata, pos, 0, outSelectedPosition);

      if (info && info.valid) {
        var hash = getInfoHash(info);

        if (!dataMap.has(hash)) {
          dataMap.set(hash, {
            info: info,
            pixelCount: 1,
            attributeIDs: [info.attributeID]
          });
        } else {
          var dmv = dataMap.get(hash);
          dmv.pixelCount++;

          if (buffdata.captureZValues) {
            if (info.zValue < dmv.info.zValue) {
              dmv.info = info;
            }
          }

          if (dmv.attributeIDs.indexOf(info.attributeID) === -1) {
            dmv.attributeIDs.push(info.attributeID);
          }
        }
      }
    }
  }

  return convertSelection(buffdata.fieldAssociation, dataMap, buffdata.captureZValues, buffdata.renderer, buffdata.openGLRenderWindow);
} // ----------------------------------------------------------------------------
// vtkOpenGLHardwareSelector methods
// ----------------------------------------------------------------------------


function vtkOpenGLHardwareSelector(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLHardwareSelector'); //----------------------------------------------------------------------------

  publicAPI.releasePixBuffers = function () {
    model.pixBuffer = [];
    model.zBuffer = null;
  }; //----------------------------------------------------------------------------


  publicAPI.beginSelection = function () {
    model.openGLRenderer = model.openGLRenderWindow.getViewNodeFor(model.renderer);
    model.maxAttributeId = 0;
    var size = model.openGLRenderWindow.getSize();

    if (!model.framebuffer) {
      model.framebuffer = vtkOpenGLFramebuffer.newInstance();
      model.framebuffer.setOpenGLRenderWindow(model.openGLRenderWindow);
      model.framebuffer.saveCurrentBindingsAndBuffers();
      model.framebuffer.create(size[0], size[1]); // this calls model.framebuffer.bind()

      model.framebuffer.populateFramebuffer();
    } else {
      model.framebuffer.setOpenGLRenderWindow(model.openGLRenderWindow);
      model.framebuffer.saveCurrentBindingsAndBuffers();
      var fbSize = model.framebuffer.getSize();

      if (fbSize[0] !== size[0] || fbSize[1] !== size[1]) {
        model.framebuffer.create(size[0], size[1]); // this calls model.framebuffer.bind()

        model.framebuffer.populateFramebuffer();
      } else {
        model.framebuffer.bind();
      }
    }

    model.openGLRenderer.clear();
    model.openGLRenderer.setSelector(publicAPI);
    model.hitProps = {};
    model.props = [];
    publicAPI.releasePixBuffers();
  }; //----------------------------------------------------------------------------


  publicAPI.endSelection = function () {
    model.hitProps = {};
    model.openGLRenderer.setSelector(null);
    model.framebuffer.restorePreviousBindingsAndBuffers();
  };

  publicAPI.preCapturePass = function () {};

  publicAPI.postCapturePass = function () {}; //----------------------------------------------------------------------------


  publicAPI.select = function () {
    var sel = null;

    if (publicAPI.captureBuffers()) {
      sel = publicAPI.generateSelection(model.area[0], model.area[1], model.area[2], model.area[3]);
      publicAPI.releasePixBuffers();
    }

    return sel;
  };

  publicAPI.getSourceDataAsync = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(renderer, fx1, fy1, fx2, fy2) {
      var size, result;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              // assign the renderer
              model.renderer = renderer; // set area to all if no arguments provided

              if (fx1 === undefined) {
                size = model.openGLRenderWindow.getSize();
                publicAPI.setArea(0, 0, size[0] - 1, size[1] - 1);
              } else {
                publicAPI.setArea(fx1, fy1, fx2, fy2);
              } // just do capture buffers and package up the result


              if (publicAPI.captureBuffers()) {
                _context.next = 4;
                break;
              }

              return _context.abrupt("return", false);

            case 4:
              result = {
                area: _toConsumableArray(model.area),
                pixBuffer: _toConsumableArray(model.pixBuffer),
                captureZValues: model.captureZValues,
                zBuffer: model.zBuffer,
                props: _toConsumableArray(model.props),
                fieldAssociation: model.fieldAssociation,
                renderer: renderer,
                openGLRenderWindow: model.openGLRenderWindow
              };

              result.generateSelection = function () {
                for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                  args[_key] = arguments[_key];
                }

                return generateSelectionWithData.apply(void 0, [result].concat(args));
              };

              return _context.abrupt("return", result);

            case 7:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x, _x2, _x3, _x4, _x5) {
      return _ref.apply(this, arguments);
    };
  }(); //----------------------------------------------------------------------------


  publicAPI.captureBuffers = function () {
    if (!model.renderer || !model.openGLRenderWindow) {
      vtkErrorMacro('Renderer and view must be set before calling Select.');
      return false;
    }

    model.openGLRenderer = model.openGLRenderWindow.getViewNodeFor(model.renderer); // todo revisit making selection part of core
    // then we can do this in core

    model.openGLRenderWindow.getRenderable().preRender(); // int rgba[4];
    // rwin.getColorBufferSizes(rgba);
    // if (rgba[0] < 8 || rgba[1] < 8 || rgba[2] < 8) {
    //   vtkErrorMacro("Color buffer depth must be at least 8 bit. "
    //     "Currently: " << rgba[0] << ", " << rgba[1] << ", " <<rgba[2]);
    //   return false;
    // }

    publicAPI.invokeEvent({
      type: 'StartEvent'
    }); // Initialize renderer for selection.
    // change the renderer's background to black, which will indicate a miss

    model.originalBackground = model.renderer.getBackgroundByReference();
    model.renderer.setBackground(0.0, 0.0, 0.0);
    var rpasses = model.openGLRenderWindow.getRenderPasses();
    publicAPI.beginSelection();

    for (model.currentPass = PassTypes.MIN_KNOWN_PASS; model.currentPass <= PassTypes.COMPOSITE_INDEX_PASS; model.currentPass++) {
      if (publicAPI.passRequired(model.currentPass)) {
        publicAPI.preCapturePass(model.currentPass);

        if (model.captureZValues && model.currentPass === PassTypes.ACTOR_PASS && typeof rpasses[0].requestDepth === 'function' && typeof rpasses[0].getFramebuffer === 'function') {
          rpasses[0].requestDepth();
          model.openGLRenderWindow.traverseAllPasses();
        } else {
          model.openGLRenderWindow.traverseAllPasses();
        }

        publicAPI.postCapturePass(model.currentPass);
        publicAPI.savePixelBuffer(model.currentPass);
      }
    }

    publicAPI.endSelection(); // restore original background

    model.renderer.setBackground(model.originalBackground);
    publicAPI.invokeEvent({
      type: 'EndEvent'
    }); // restore image, not needed?
    // model.openGLRenderWindow.traverseAllPasses();

    return true;
  }; //----------------------------------------------------------------------------


  publicAPI.passRequired = function (pass) {
    return true;
  }; //----------------------------------------------------------------------------


  publicAPI.savePixelBuffer = function (passNo) {
    model.pixBuffer[passNo] = model.openGLRenderWindow.getPixelData(model.area[0], model.area[1], model.area[2], model.area[3]);

    if (passNo === PassTypes.ACTOR_PASS) {
      if (model.captureZValues) {
        var rpasses = model.openGLRenderWindow.getRenderPasses();

        if (typeof rpasses[0].requestDepth === 'function' && typeof rpasses[0].getFramebuffer === 'function') {
          var fb = rpasses[0].getFramebuffer();
          fb.saveCurrentBindingsAndBuffers();
          fb.bind();
          model.zBuffer = model.openGLRenderWindow.getPixelData(model.area[0], model.area[1], model.area[2], model.area[3]);
          fb.restorePreviousBindingsAndBuffers();
        }
      }

      publicAPI.buildPropHitList(model.pixBuffer[passNo]);
    }
  }; //----------------------------------------------------------------------------


  publicAPI.buildPropHitList = function (pixelbuffer) {
    for (var yy = 0; yy <= model.area[3] - model.area[1]; yy++) {
      for (var xx = 0; xx <= model.area[2] - model.area[0]; xx++) {
        var val = convert(xx, yy, pixelbuffer, model.area);

        if (val > 0) {
          val--;

          if (!(val in model.hitProps)) {
            model.hitProps[val] = true;
          }
        }
      }
    }
  }; //----------------------------------------------------------------------------


  publicAPI.renderProp = function (prop) {
    if (model.currentPass === PassTypes.ACTOR_PASS) {
      publicAPI.setPropColorValueFromInt(model.props.length + idOffset);
      model.props.push(prop);
    }
  }; //----------------------------------------------------------------------------


  publicAPI.renderCompositeIndex = function (index) {
    if (model.currentPass === PassTypes.COMPOSITE_INDEX_PASS) {
      publicAPI.setPropColorValueFromInt(index + idOffset);
    }
  }; //----------------------------------------------------------------------------
  // TODO: make inline


  publicAPI.renderAttributeId = function (attribid) {
    if (attribid < 0) {
      // negative attribid is valid. It happens when rendering higher order
      // elements where new points are added for rendering smooth surfaces.
      return;
    }

    model.maxAttributeId = attribid > model.maxAttributeId ? attribid : model.maxAttributeId; // if (model.currentPass < PassTypes.ID_LOW24) {
    //   return; // useless...
    // }
  }; //----------------------------------------------------------------------------


  publicAPI.passTypeToString = function (type) {
    return macro.enumToString(PassTypes, type);
  }; //----------------------------------------------------------------------------


  publicAPI.isPropHit = function (id) {
    return Boolean(model.hitProps[id]);
  };

  publicAPI.setPropColorValueFromInt = function (val) {
    model.propColorValue[0] = val % 256 / 255.0;
    model.propColorValue[1] = Math.floor(val / 256) % 256 / 255.0;
    model.propColorValue[2] = Math.floor(val / 65536) % 256 / 255.0;
  }; // info has
  //   valid
  //   propId
  //   prop
  //   compositeID
  //   attributeID
  //----------------------------------------------------------------------------


  publicAPI.getPixelInformation = function (inDisplayPosition, maxDistance, outSelectedPosition) {
    // Base case
    var maxDist = maxDistance < 0 ? 0 : maxDistance;

    if (maxDist === 0) {
      outSelectedPosition[0] = inDisplayPosition[0];
      outSelectedPosition[1] = inDisplayPosition[1];

      if (inDisplayPosition[0] < model.area[0] || inDisplayPosition[0] > model.area[2] || inDisplayPosition[1] < model.area[1] || inDisplayPosition[1] > model.area[3]) {
        return null;
      } // offset inDisplayPosition based on the lower-left-corner of the Area.


      var displayPosition = [inDisplayPosition[0] - model.area[0], inDisplayPosition[1] - model.area[1]];
      var actorid = convert(displayPosition[0], displayPosition[1], model.pixBuffer[PassTypes.ACTOR_PASS], model.area);

      if (actorid <= 0) {
        // the pixel did not hit any actor.
        return null;
      }

      var _info2 = {};
      _info2.valid = true;
      _info2.propID = actorid - idOffset;
      _info2.prop = model.props[_info2.propID];
      var compositeID = convert(displayPosition[0], displayPosition[1], model.pixBuffer[PassTypes.COMPOSITE_INDEX_PASS], model.area);

      if (compositeID < 0 || compositeID > 0xffffff) {
        compositeID = 0;
      }

      _info2.compositeID = compositeID - idOffset;

      if (model.captureZValues) {
        var offset = (displayPosition[1] * (model.area[2] - model.area[0] + 1) + displayPosition[0]) * 4;
        _info2.zValue = (256 * model.zBuffer[offset] + model.zBuffer[offset + 1]) / 65535.0;
        _info2.displayPosition = inDisplayPosition;
      }

      return _info2;
    } // Iterate over successively growing boxes.
    // They recursively call the base case to handle single pixels.


    var dispPos = [inDisplayPosition[0], inDisplayPosition[1]];
    var curPos = [0, 0];
    var info = publicAPI.getPixelInformation(inDisplayPosition, 0, outSelectedPosition);

    if (info && info.valid) {
      return info;
    }

    for (var dist = 1; dist < maxDist; ++dist) {
      // Vertical sides of box.
      for (var y = dispPos[1] > dist ? dispPos[1] - dist : 0; y <= dispPos[1] + dist; ++y) {
        curPos[1] = y;

        if (dispPos[0] >= dist) {
          curPos[0] = dispPos[0] - dist;
          info = publicAPI.getPixelInformation(curPos, 0, outSelectedPosition);

          if (info && info.valid) {
            return info;
          }
        }

        curPos[0] = dispPos[0] + dist;
        info = publicAPI.getPixelInformation(curPos, 0, outSelectedPosition);

        if (info && info.valid) {
          return info;
        }
      } // Horizontal sides of box.


      for (var x = dispPos[0] >= dist ? dispPos[0] - (dist - 1) : 0; x <= dispPos[0] + (dist - 1); ++x) {
        curPos[0] = x;

        if (dispPos[1] >= dist) {
          curPos[1] = dispPos[1] - dist;
          info = publicAPI.getPixelInformation(curPos, 0, outSelectedPosition);

          if (info && info.valid) {
            return info;
          }
        }

        curPos[1] = dispPos[1] + dist;
        info = publicAPI.getPixelInformation(curPos, 0, outSelectedPosition);

        if (info && info.valid) {
          return info;
        }
      }
    } // nothing hit.


    outSelectedPosition[0] = inDisplayPosition[0];
    outSelectedPosition[1] = inDisplayPosition[1];
    return null;
  }; //----------------------------------------------------------------------------


  publicAPI.generateSelection = function (fx1, fy1, fx2, fy2) {
    var x1 = Math.floor(fx1);
    var y1 = Math.floor(fy1);
    var x2 = Math.floor(fx2);
    var y2 = Math.floor(fy2);
    var dataMap = new Map();
    var outSelectedPosition = [0, 0];

    for (var yy = y1; yy <= y2; yy++) {
      for (var xx = x1; xx <= x2; xx++) {
        var pos = [xx, yy];
        var info = publicAPI.getPixelInformation(pos, 0, outSelectedPosition);

        if (info && info.valid) {
          var hash = getInfoHash(info);

          if (!dataMap.has(hash)) {
            dataMap.set(hash, {
              info: info,
              pixelCount: 1,
              attributeIDs: [info.attributeID]
            });
          } else {
            var dmv = dataMap.get(hash);
            dmv.pixelCount++;

            if (model.captureZValues) {
              if (info.zValue < dmv.info.zValue) {
                dmv.info = info;
              }
            }

            if (dmv.attributeIDs.indexOf(info.attributeID) === -1) {
              dmv.attributeIDs.push(info.attributeID);
            }
          }
        }
      }
    }

    return convertSelection(model.fieldAssociation, dataMap, model.captureZValues, model.renderer, model.openGLRenderWindow);
  }; //----------------------------------------------------------------------------


  publicAPI.attach = function (w, r) {
    model.openGLRenderWindow = w;
    model.renderer = r;
  }; // override


  var superSetArea = publicAPI.setArea;

  publicAPI.setArea = function () {
    if (superSetArea.apply(void 0, arguments)) {
      model.area[0] = Math.floor(model.area[0]);
      model.area[1] = Math.floor(model.area[1]);
      model.area[2] = Math.floor(model.area[2]);
      model.area[3] = Math.floor(model.area[3]);
      return true;
    }

    return false;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  area: undefined,
  renderer: null,
  openGLRenderWindow: null,
  openGLRenderer: null,
  currentPass: -1,
  propColorValue: null,
  props: null,
  idOffset: 1
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  vtkHardwareSelector$1.extend(publicAPI, model, initialValues);
  model.propColorValue = [0, 0, 0];
  model.props = [];

  if (!model.area) {
    model.area = [0, 0, 0, 0];
  }

  macro.setGetArray(publicAPI, model, ['area'], 4);
  macro.setGet(publicAPI, model, ['renderer', 'currentPass', 'openGLRenderWindow']);
  macro.setGetArray(publicAPI, model, ['propColorValue'], 3);
  macro.event(publicAPI, model, 'event'); // Object methods

  vtkOpenGLHardwareSelector(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkOpenGLHardwareSelector'); // ----------------------------------------------------------------------------

var vtkHardwareSelector = _objectSpread({
  newInstance: newInstance,
  extend: extend
}, Constants);

export { vtkHardwareSelector as default, extend, newInstance };
