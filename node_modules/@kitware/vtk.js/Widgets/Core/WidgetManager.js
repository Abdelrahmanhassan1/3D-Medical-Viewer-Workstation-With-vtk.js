import _slicedToArray from '@babel/runtime/helpers/slicedToArray';
import { r as radiansFromDegrees } from '../../Common/Core/Math/index.js';
import { FieldAssociations } from '../../Common/DataModel/DataSet/Constants.js';
import macro from '../../macros.js';
import vtkSelectionNode from '../../Common/DataModel/SelectionNode.js';
import WidgetManagerConst from './WidgetManager/Constants.js';
import vtkSVGRepresentation from '../SVG/SVGRepresentation.js';
import { diff } from './WidgetManager/vdom.js';

var ViewTypes = WidgetManagerConst.ViewTypes,
    RenderingTypes = WidgetManagerConst.RenderingTypes,
    CaptureOn = WidgetManagerConst.CaptureOn;
var vtkErrorMacro = macro.vtkErrorMacro;
var createSvgElement = vtkSVGRepresentation.createSvgElement,
    createSvgDomElement = vtkSVGRepresentation.createSvgDomElement;
var viewIdCount = 1; // ----------------------------------------------------------------------------
// Helper
// ----------------------------------------------------------------------------

function extractRenderingComponents(renderer) {
  var camera = renderer.getActiveCamera();
  var renderWindow = renderer.getRenderWindow();
  var interactor = renderWindow.getInteractor();
  var apiSpecificRenderWindow = interactor.getView();
  return {
    renderer: renderer,
    renderWindow: renderWindow,
    interactor: interactor,
    apiSpecificRenderWindow: apiSpecificRenderWindow,
    camera: camera
  };
} // ----------------------------------------------------------------------------

function createSvgRoot(id) {
  var svgRoot = createSvgDomElement('svg');
  svgRoot.setAttribute('style', 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;');
  svgRoot.setAttribute('version', '1.1');
  svgRoot.setAttribute('baseProfile', 'full');
  return svgRoot;
} // ----------------------------------------------------------------------------
// vtkWidgetManager methods
// ----------------------------------------------------------------------------


function vtkWidgetManager(publicAPI, model) {
  if (!model.viewId) {
    model.viewId = "view-".concat(viewIdCount++);
  }

  model.classHierarchy.push('vtkWidgetManager');
  var propsWeakMap = new WeakMap();
  var widgetToSvgMap = new WeakMap();
  var svgVTrees = new WeakMap();
  var subscriptions = []; // --------------------------------------------------------------------------
  // Internal variable
  // --------------------------------------------------------------------------

  model.svgRoot = createSvgRoot(model.viewId); // --------------------------------------------------------------------------
  // API internal
  // --------------------------------------------------------------------------

  function updateWidgetWeakMap(widget) {
    var representations = widget.getRepresentations();

    for (var i = 0; i < representations.length; i++) {
      var representation = representations[i];
      var origin = {
        widget: widget,
        representation: representation
      };
      var actors = representation.getActors();

      for (var j = 0; j < actors.length; j++) {
        var actor = actors[j];
        propsWeakMap.set(actor, origin);
      }
    }
  }

  function getViewWidget(widget) {
    return widget && (widget.isA('vtkAbstractWidget') ? widget : widget.getWidgetForView({
      viewId: model.viewId
    }));
  } // --------------------------------------------------------------------------
  // internal SVG API
  // --------------------------------------------------------------------------


  var pendingSvgRenders = new WeakMap();

  function enableSvgLayer() {
    var container = model.apiSpecificRenderWindow.getReferenceByName('el');
    var canvas = model.apiSpecificRenderWindow.getCanvas();
    container.insertBefore(model.svgRoot, canvas.nextSibling);
    var containerStyles = window.getComputedStyle(container);

    if (containerStyles.position === 'static') {
      container.style.position = 'relative';
    }
  }

  function disableSvgLayer() {
    var container = model.apiSpecificRenderWindow.getReferenceByName('el');
    container.removeChild(model.svgRoot);
  }

  function removeFromSvgLayer(viewWidget) {
    var group = widgetToSvgMap.get(viewWidget);

    if (group) {
      widgetToSvgMap.delete(viewWidget);
      svgVTrees.delete(viewWidget);
      model.svgRoot.removeChild(group);
    }
  }

  function setSvgSize() {
    var _model$apiSpecificRen = model.apiSpecificRenderWindow.getSize(),
        _model$apiSpecificRen2 = _slicedToArray(_model$apiSpecificRen, 2),
        cwidth = _model$apiSpecificRen2[0],
        cheight = _model$apiSpecificRen2[1];

    var ratio = window.devicePixelRatio || 1;
    var bwidth = String(cwidth / ratio);
    var bheight = String(cheight / ratio);
    var viewBox = "0 0 ".concat(cwidth, " ").concat(cheight);
    var origWidth = model.svgRoot.getAttribute('width');
    var origHeight = model.svgRoot.getAttribute('height');
    var origViewBox = model.svgRoot.getAttribute('viewBox');

    if (origWidth !== bwidth) {
      model.svgRoot.setAttribute('width', bwidth);
    }

    if (origHeight !== bheight) {
      model.svgRoot.setAttribute('height', bheight);
    }

    if (origViewBox !== viewBox) {
      model.svgRoot.setAttribute('viewBox', viewBox);
    }
  }

  function updateSvg() {
    if (model.useSvgLayer) {
      var _loop = function _loop(i) {
        var widget = model.widgets[i];
        var svgReps = widget.getRepresentations().filter(function (r) {
          return r.isA('vtkSVGRepresentation');
        });
        var pendingContent = [];

        if (widget.getVisibility()) {
          pendingContent = svgReps.filter(function (r) {
            return r.getVisibility();
          }).map(function (r) {
            return r.render();
          });
        }

        var promise = Promise.all(pendingContent);
        var renders = pendingSvgRenders.get(widget) || [];
        renders.push(promise);
        pendingSvgRenders.set(widget, renders);
        promise.then(function (vnodes) {
          var pendingRenders = pendingSvgRenders.get(widget) || [];
          var idx = pendingRenders.indexOf(promise);

          if (model.deleted || widget.isDeleted() || idx === -1) {
            return;
          } // throw away previous renders


          pendingRenders = pendingRenders.slice(idx + 1);
          pendingSvgRenders.set(widget, pendingRenders);
          var oldVTree = svgVTrees.get(widget);
          var newVTree = createSvgElement('g');

          for (var ni = 0; ni < vnodes.length; ni++) {
            newVTree.appendChild(vnodes[ni]);
          }

          var widgetGroup = widgetToSvgMap.get(widget);
          var node = widgetGroup;
          var patchFns = diff(oldVTree, newVTree);

          for (var j = 0; j < patchFns.length; j++) {
            node = patchFns[j](node);
          }

          if (!widgetGroup && node) {
            // add
            model.svgRoot.appendChild(node);
            widgetToSvgMap.set(widget, node);
          } else if (widgetGroup && !node) {
            // delete
            widgetGroup.remove();
            widgetToSvgMap.delete(widget);
          }

          svgVTrees.set(widget, newVTree);
        });
      };

      for (var i = 0; i < model.widgets.length; i++) {
        _loop(i);
      }
    }
  } // --------------------------------------------------------------------------
  // Widget scaling
  // --------------------------------------------------------------------------


  function updateDisplayScaleParams() {
    var apiSpecificRenderWindow = model.apiSpecificRenderWindow,
        camera = model.camera,
        renderer = model.renderer;

    if (renderer && apiSpecificRenderWindow && camera) {
      var _apiSpecificRenderWin = apiSpecificRenderWindow.getSize(),
          _apiSpecificRenderWin2 = _slicedToArray(_apiSpecificRenderWin, 2),
          rwW = _apiSpecificRenderWin2[0],
          rwH = _apiSpecificRenderWin2[1];

      var _renderer$getViewport = renderer.getViewport(),
          _renderer$getViewport2 = _slicedToArray(_renderer$getViewport, 4),
          vxmin = _renderer$getViewport2[0],
          vymin = _renderer$getViewport2[1],
          vxmax = _renderer$getViewport2[2],
          vymax = _renderer$getViewport2[3];

      var rendererPixelDims = [rwW * (vxmax - vxmin), rwH * (vymax - vymin)];
      var cameraPosition = camera.getPosition();
      var cameraDir = camera.getDirectionOfProjection();
      var isParallel = camera.getParallelProjection();
      var dispHeightFactor = isParallel ? 2 * camera.getParallelScale() : 2 * Math.tan(radiansFromDegrees(camera.getViewAngle()) / 2);
      model.widgets.forEach(function (w) {
        w.getNestedProps().forEach(function (r) {
          if (r.getScaleInPixels()) {
            r.setDisplayScaleParams({
              dispHeightFactor: dispHeightFactor,
              cameraPosition: cameraPosition,
              cameraDir: cameraDir,
              isParallel: isParallel,
              rendererPixelDims: rendererPixelDims
            });
          }
        });
      });
    }
  } // --------------------------------------------------------------------------
  // API public
  // --------------------------------------------------------------------------


  function updateWidgetForRender(w) {
    w.updateRepresentationForRender(model.renderingType);
  }

  function renderPickingBuffer() {
    model.renderingType = RenderingTypes.PICKING_BUFFER;
    model.widgets.forEach(updateWidgetForRender);
  }

  function renderFrontBuffer() {
    model.renderingType = RenderingTypes.FRONT_BUFFER;
    model.widgets.forEach(updateWidgetForRender);
  }

  function captureBuffers(x1, y1, x2, y2) {
    renderPickingBuffer();
    model.selector.setArea(x1, y1, x2, y2);
    model.selector.releasePixBuffers();
    model.previousSelectedData = null;
    return model.selector.captureBuffers();
  }

  publicAPI.enablePicking = function () {
    model.pickingEnabled = true;
    model.pickingAvailable = true;
    publicAPI.renderWidgets();
  };

  publicAPI.renderWidgets = function () {
    if (model.pickingEnabled && model.captureOn === CaptureOn.MOUSE_RELEASE) {
      var _model$apiSpecificRen3 = model.apiSpecificRenderWindow.getSize(),
          _model$apiSpecificRen4 = _slicedToArray(_model$apiSpecificRen3, 2),
          w = _model$apiSpecificRen4[0],
          h = _model$apiSpecificRen4[1];

      model.pickingAvailable = captureBuffers(0, 0, w, h);
    }

    renderFrontBuffer();
    publicAPI.modified();
  };

  publicAPI.disablePicking = function () {
    model.pickingEnabled = false;
    model.pickingAvailable = false;
  };

  publicAPI.setRenderer = function (renderer) {
    Object.assign(model, extractRenderingComponents(renderer));

    while (subscriptions.length) {
      subscriptions.pop().unsubscribe();
    }

    model.selector = model.apiSpecificRenderWindow.getSelector();
    model.selector.setFieldAssociation(FieldAssociations.FIELD_ASSOCIATION_POINTS);
    model.selector.attach(model.apiSpecificRenderWindow, model.renderer);
    subscriptions.push(model.interactor.onRenderEvent(updateSvg));
    subscriptions.push(model.apiSpecificRenderWindow.onModified(setSvgSize));
    setSvgSize();
    subscriptions.push(model.apiSpecificRenderWindow.onModified(updateDisplayScaleParams));
    subscriptions.push(model.camera.onModified(updateDisplayScaleParams));
    updateDisplayScaleParams();
    subscriptions.push(model.interactor.onStartAnimation(function () {
      model.isAnimating = true;
    }));
    subscriptions.push(model.interactor.onEndAnimation(function () {
      model.isAnimating = false;
      publicAPI.renderWidgets();
    }));
    subscriptions.push(model.interactor.onMouseMove(function (_ref) {
      var position = _ref.position;

      if (model.isAnimating || !model.pickingAvailable) {
        return;
      }

      publicAPI.updateSelectionFromXY(position.x, position.y);

      var _publicAPI$getSelecte = publicAPI.getSelectedData(),
          requestCount = _publicAPI$getSelecte.requestCount,
          selectedState = _publicAPI$getSelecte.selectedState,
          representation = _publicAPI$getSelecte.representation,
          widget = _publicAPI$getSelecte.widget;

      if (requestCount) {
        // Call activate only once
        return;
      } // Default cursor behavior


      model.apiSpecificRenderWindow.setCursor(widget ? 'pointer' : 'default');

      if (model.widgetInFocus === widget && widget.hasFocus()) {
        widget.activateHandle({
          selectedState: selectedState,
          representation: representation
        }); // Ken FIXME

        model.interactor.render();
        model.interactor.render();
      } else {
        for (var i = 0; i < model.widgets.length; i++) {
          var w = model.widgets[i];

          if (w === widget && w.getNestedPickable()) {
            w.activateHandle({
              selectedState: selectedState,
              representation: representation
            });
            model.activeWidget = w;
          } else {
            w.deactivateAllHandles();
          }
        } // Ken FIXME


        model.interactor.render();
        model.interactor.render();
      }
    }));
    publicAPI.modified();

    if (model.pickingEnabled) {
      // also sets pickingAvailable
      publicAPI.enablePicking();
    }

    if (model.useSvgLayer) {
      enableSvgLayer();
    }
  };

  function addWidgetInternal(viewWidget) {
    viewWidget.setWidgetManager(publicAPI);
    updateWidgetWeakMap(viewWidget);
    updateDisplayScaleParams(); // Register to renderer

    model.renderer.addActor(viewWidget);
  }

  publicAPI.addWidget = function (widget, viewType, initialValues) {
    if (!model.renderer) {
      vtkErrorMacro('Widget manager MUST BE link to a view before registering widgets');
      return null;
    }

    var viewId = model.viewId,
        renderer = model.renderer;
    var w = widget.getWidgetForView({
      viewId: viewId,
      renderer: renderer,
      viewType: viewType || ViewTypes.DEFAULT,
      initialValues: initialValues
    });

    if (model.widgets.indexOf(w) === -1) {
      model.widgets.push(w);
      addWidgetInternal(w);
      publicAPI.modified();
    }

    return w;
  };

  function removeWidgetInternal(viewWidget) {
    model.renderer.removeActor(viewWidget);
    removeFromSvgLayer(viewWidget);
    viewWidget.delete();
  }

  function onWidgetRemoved() {
    model.renderer.getRenderWindow().getInteractor().render();
    publicAPI.renderWidgets();
  }

  publicAPI.removeWidgets = function () {
    model.widgets.forEach(removeWidgetInternal);
    model.widgets = [];
    model.widgetInFocus = null;
    onWidgetRemoved();
  };

  publicAPI.removeWidget = function (widget) {
    var viewWidget = getViewWidget(widget);
    var index = model.widgets.indexOf(viewWidget);

    if (index !== -1) {
      model.widgets.splice(index, 1);
      var isWidgetInFocus = model.widgetInFocus === viewWidget;

      if (isWidgetInFocus) {
        publicAPI.releaseFocus();
      }

      removeWidgetInternal(viewWidget);
      onWidgetRemoved();
    }
  };

  publicAPI.updateSelectionFromXY = function (x, y) {
    if (model.pickingEnabled) {
      // First pick SVG representation
      for (var i = 0; i < model.widgets.length; ++i) {
        var widget = model.widgets[i];
        var hoveredSVGReps = widget.getRepresentations().filter(function (r) {
          return r.isA('vtkSVGRepresentation') && r.getHover() != null;
        });

        if (hoveredSVGReps.length) {
          var selection = vtkSelectionNode.newInstance();
          selection.getProperties().compositeID = hoveredSVGReps[0].getHover();
          selection.getProperties().widget = widget;
          selection.getProperties().representation = hoveredSVGReps[0];
          model.selections = [selection];
          return;
        }
      } // Then pick regular representations.


      var pickingAvailable = model.pickingAvailable;

      if (model.captureOn === CaptureOn.MOUSE_MOVE) {
        pickingAvailable = captureBuffers(x, y, x, y);
        renderFrontBuffer();
      }

      if (pickingAvailable) {
        model.selections = model.selector.generateSelection(x, y, x, y);
      }
    }
  };

  publicAPI.updateSelectionFromMouseEvent = function (event) {
    var pageX = event.pageX,
        pageY = event.pageY;

    var _model$apiSpecificRen5 = model.apiSpecificRenderWindow.getCanvas().getBoundingClientRect(),
        top = _model$apiSpecificRen5.top,
        left = _model$apiSpecificRen5.left,
        height = _model$apiSpecificRen5.height;

    var x = pageX - left;
    var y = height - (pageY - top);
    publicAPI.updateSelectionFromXY(x, y);
  };

  publicAPI.getSelectedData = function () {
    if (!model.selections || !model.selections.length) {
      model.previousSelectedData = null;
      return {};
    }

    var _model$selections$0$g = model.selections[0].getProperties(),
        propID = _model$selections$0$g.propID,
        compositeID = _model$selections$0$g.compositeID,
        prop = _model$selections$0$g.prop;

    var _model$selections$0$g2 = model.selections[0].getProperties(),
        widget = _model$selections$0$g2.widget,
        representation = _model$selections$0$g2.representation; // prop is undefined for SVG representation, widget is undefined for handle
    // representation.


    if (model.previousSelectedData && model.previousSelectedData.prop === prop && model.previousSelectedData.widget === widget && model.previousSelectedData.compositeID === compositeID) {
      model.previousSelectedData.requestCount++;
      return model.previousSelectedData;
    }

    if (propsWeakMap.has(prop)) {
      var props = propsWeakMap.get(prop);
      widget = props.widget;
      representation = props.representation;
    }

    if (widget && representation) {
      var selectedState = representation.getSelectedState(prop, compositeID);
      model.previousSelectedData = {
        requestCount: 0,
        propID: propID,
        compositeID: compositeID,
        prop: prop,
        widget: widget,
        representation: representation,
        selectedState: selectedState
      };
      return model.previousSelectedData;
    }

    model.previousSelectedData = null;
    return {};
  };

  publicAPI.grabFocus = function (widget) {
    var viewWidget = getViewWidget(widget);

    if (model.widgetInFocus && model.widgetInFocus !== viewWidget) {
      model.widgetInFocus.loseFocus();
    }

    model.widgetInFocus = viewWidget;

    if (model.widgetInFocus) {
      model.widgetInFocus.grabFocus();
    }
  };

  publicAPI.releaseFocus = function () {
    return publicAPI.grabFocus(null);
  };

  publicAPI.setUseSvgLayer = function (useSvgLayer) {
    if (useSvgLayer !== model.useSvgLayer) {
      model.useSvgLayer = useSvgLayer;

      if (model.renderer) {
        if (useSvgLayer) {
          enableSvgLayer(); // force a render so svg widgets can be drawn

          updateSvg();
        } else {
          disableSvgLayer();
        }
      }

      return true;
    }

    return false;
  };

  var superDelete = publicAPI.delete;

  publicAPI.delete = function () {
    while (subscriptions.length) {
      subscriptions.pop().unsubscribe();
    }

    superDelete();
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  viewId: null,
  widgets: [],
  renderer: null,
  viewType: ViewTypes.DEFAULT,
  pickingAvailable: false,
  isAnimating: false,
  pickingEnabled: true,
  selections: null,
  previousSelectedData: null,
  widgetInFocus: null,
  useSvgLayer: true,
  captureOn: CaptureOn.MOUSE_MOVE
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['captureOn', {
    type: 'enum',
    name: 'viewType',
    enum: ViewTypes
  }]);
  macro.get(publicAPI, model, ['selections', 'widgets', 'viewId', 'pickingEnabled', 'useSvgLayer']); // Object specific methods

  vtkWidgetManager(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkWidgetManager'); // ----------------------------------------------------------------------------

var vtkWidgetManager$1 = {
  newInstance: newInstance,
  extend: extend,
  Constants: WidgetManagerConst
};

export { vtkWidgetManager$1 as default, extend, extractRenderingComponents, newInstance };
