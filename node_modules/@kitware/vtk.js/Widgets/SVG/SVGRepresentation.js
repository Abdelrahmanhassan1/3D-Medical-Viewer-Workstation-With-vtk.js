import macro from '../../macros.js';
import vtkPolyData from '../../Common/DataModel/PolyData.js';
import vtkActor from '../../Rendering/Core/Actor.js';
import vtkPixelSpaceCallbackMapper from '../../Rendering/Core/PixelSpaceCallbackMapper.js';
import vtkWidgetRepresentation from '../Representations/WidgetRepresentation.js';
import { Behavior } from '../Representations/WidgetRepresentation/Constants.js';
import { RenderingTypes } from '../Core/WidgetManager/Constants.js';

var SVG_XMLNS = 'http://www.w3.org/2000/svg'; // ----------------------------------------------------------------------------

function createSvgElement(tag) {
  return {
    name: tag,
    attrs: {},
    eventListeners: {},
    // implies no children if set
    textContent: null,
    children: [],
    setAttribute: function setAttribute(attr, val) {
      this.attrs[attr] = val;
    },
    removeAttribute: function removeAttribute(attr) {
      delete this.attrs[attr];
    },
    appendChild: function appendChild(n) {
      this.children.push(n);
    },
    addEventListeners: function addEventListeners(event, callback) {
      this.eventListeners[event] = callback;
    }
  };
} // ----------------------------------------------------------------------------


function createSvgDomElement(tag) {
  return document.createElementNS(SVG_XMLNS, tag);
} // ----------------------------------------------------------------------------


function defer() {
  var resolve;
  var reject;
  var promise = new Promise(function (res, rej) {
    resolve = res;
    reject = rej;
  });
  return {
    promise: promise,
    resolve: resolve,
    reject: reject
  };
} // ----------------------------------------------------------------------------
// vtkSVGRepresentation
// ----------------------------------------------------------------------------


function vtkSVGRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSVGRepresentation');
  var deferred = null;
  model.psActor = vtkActor.newInstance({
    pickable: false,
    parentProp: publicAPI
  });
  model.psMapper = vtkPixelSpaceCallbackMapper.newInstance();
  model.points = vtkPolyData.newInstance();
  model.psMapper.setInputData(model.points);
  model.psActor.setMapper(model.psMapper);
  model.psMapper.setCallback(function () {
    if (deferred) {
      var d = deferred;
      deferred = null;
      d.resolve({
        coords: arguments.length <= 0 ? undefined : arguments[0],
        camera: arguments.length <= 1 ? undefined : arguments[1],
        aspect: arguments.length <= 2 ? undefined : arguments[2],
        depthValues: arguments.length <= 3 ? undefined : arguments[3],
        windowSize: arguments.length <= 4 ? undefined : arguments[4]
      });
    }
  });
  publicAPI.addActor(model.psActor); // --------------------------------------------------------------------------

  publicAPI.worldPointsToPixelSpace = function (points3d) {
    var pts = new Float32Array(points3d.length * 3);

    for (var i = 0; i < points3d.length; i++) {
      pts[i * 3 + 0] = points3d[i][0];
      pts[i * 3 + 1] = points3d[i][1];
      pts[i * 3 + 2] = points3d[i][2];
    }

    model.points.getPoints().setData(pts);
    model.points.modified();
    deferred = defer();
    return deferred.promise;
  };

  publicAPI.createListenableSvgElement = function (tag, id) {
    var element = createSvgElement(tag);

    if (model.pickable) {
      element.addEventListeners('mouseenter', function () {
        publicAPI.setHover(id);
      });
      element.addEventListeners('mouseleave', function () {
        if (publicAPI.getHover() === id) {
          publicAPI.setHover(null);
        }
      });
    }

    return element;
  }; // --------------------------------------------------------------------------


  publicAPI.updateActorVisibility = function () {
    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : RenderingTypes.FRONT_BUFFER;
    var ctxVisible = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var handleVisible = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    if (model.behavior === Behavior.CONTEXT) {
      publicAPI.setVisibility(ctxVisible);
    } else if (model.behavior === Behavior.HANDLE) {
      publicAPI.setVisibility(handleVisible);
    }
  }; // --------------------------------------------------------------------------
  // Subclasses must implement this method


  publicAPI.render = function () {
    throw new Error('Not implemented');
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

/**
 * 'hover' is not null when a pickable SVG element is mouse hovered.
 */


var DEFAULT_VALUES = {
  visibility: true
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Extend methods

  vtkWidgetRepresentation.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['visibility', 'hover']); // Object specific methods

  vtkSVGRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var vtkSVGRepresentation$1 = {
  extend: extend,
  createSvgElement: createSvgElement,
  createSvgDomElement: createSvgDomElement
};

export { vtkSVGRepresentation$1 as default, extend };
