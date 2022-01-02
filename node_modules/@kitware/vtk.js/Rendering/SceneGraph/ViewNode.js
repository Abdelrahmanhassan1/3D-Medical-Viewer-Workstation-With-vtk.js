import macro from '../../macros.js';

var vtkErrorMacro = macro.vtkErrorMacro;
var PASS_TYPES = ['Build', 'Render']; // ----------------------------------------------------------------------------
// vtkViewNode methods
// ----------------------------------------------------------------------------

function vtkViewNode(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkViewNode'); // Builds myself.

  publicAPI.build = function (prepass) {}; // Renders myself


  publicAPI.render = function (prepass) {};

  publicAPI.traverse = function (renderPass) {
    // we can choose to do special
    // traversal here based on pass
    var passTraversal = renderPass.getTraverseOperation();
    var fn = publicAPI[passTraversal];

    if (fn) {
      fn(renderPass);
      return;
    } // default traversal


    publicAPI.apply(renderPass, true);

    for (var index = 0; index < model.children.length; index++) {
      model.children[index].traverse(renderPass);
    }

    publicAPI.apply(renderPass, false);
  };

  publicAPI.apply = function (renderPass, prepass) {
    var customRenderPass = publicAPI[renderPass.getOperation()];

    if (customRenderPass) {
      customRenderPass(prepass, renderPass);
    }
  };

  publicAPI.getViewNodeFor = function (dataObject) {
    if (model.renderable === dataObject) {
      return publicAPI;
    }

    for (var index = 0; index < model.children.length; ++index) {
      var child = model.children[index];
      var vn = child.getViewNodeFor(dataObject);

      if (vn) {
        return vn;
      }
    }

    return undefined;
  };

  publicAPI.getFirstAncestorOfType = function (type) {
    if (!model.parent) {
      return null;
    }

    if (model.parent.isA(type)) {
      return model.parent;
    }

    return model.parent.getFirstAncestorOfType(type);
  };

  publicAPI.addMissingNode = function (dobj) {
    if (!dobj) {
      return;
    }

    var result = model._renderableChildMap.get(dobj); // if found just mark as visited


    if (result !== undefined) {
      result.setVisited(true);
    } else {
      // otherwise create a node
      var newNode = publicAPI.createViewNode(dobj);

      if (newNode) {
        newNode.setParent(publicAPI);
        newNode.setVisited(true);

        model._renderableChildMap.set(dobj, newNode);

        model.children.push(newNode);
      }
    }
  };

  publicAPI.addMissingNodes = function (dataObjs) {
    if (!dataObjs || !dataObjs.length) {
      return;
    }

    for (var index = 0; index < dataObjs.length; ++index) {
      var dobj = dataObjs[index];

      var result = model._renderableChildMap.get(dobj); // if found just mark as visited


      if (result !== undefined) {
        result.setVisited(true);
      } else {
        // otherwise create a node
        var newNode = publicAPI.createViewNode(dobj);

        if (newNode) {
          newNode.setParent(publicAPI);
          newNode.setVisited(true);

          model._renderableChildMap.set(dobj, newNode);

          model.children.push(newNode);
        }
      }
    }
  };

  publicAPI.prepareNodes = function () {
    for (var index = 0; index < model.children.length; ++index) {
      model.children[index].setVisited(false);
    }
  };

  publicAPI.setVisited = function (val) {
    model.visited = val;
  };

  publicAPI.removeUnusedNodes = function () {
    var deleted = null;

    for (var index = 0; index < model.children.length; ++index) {
      var child = model.children[index];
      var visited = child.getVisited();

      if (!visited) {
        var renderable = child.getRenderable();

        if (renderable) {
          model._renderableChildMap.delete(renderable);
        }

        if (!deleted) {
          deleted = [];
        }

        deleted.push(child);
      } else {
        child.setVisited(false);
      }
    }

    if (deleted) {
      // slow does alloc but not as common
      model.children = model.children.filter(function (el) {
        return !deleted.includes(el);
      });
    }
  };

  publicAPI.createViewNode = function (dataObj) {
    if (!model.myFactory) {
      vtkErrorMacro('Cannot create view nodes without my own factory');
      return null;
    }

    var ret = model.myFactory.createNode(dataObj);

    if (ret) {
      ret.setRenderable(dataObj);
    }

    return ret;
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  parent: null,
  renderable: null,
  myFactory: null,
  children: [],
  visited: false
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  macro.obj(publicAPI, model);
  macro.event(publicAPI, model, 'event');
  model._renderableChildMap = new Map();
  macro.get(publicAPI, model, ['visited']);
  macro.setGet(publicAPI, model, ['parent', 'renderable', 'myFactory']);
  macro.getArray(publicAPI, model, ['children']); // Object methods

  vtkViewNode(publicAPI, model);
} // ----------------------------------------------------------------------------


var newInstance = macro.newInstance(extend, 'vtkViewNode'); // ----------------------------------------------------------------------------

var vtkViewNode$1 = {
  newInstance: newInstance,
  extend: extend,
  PASS_TYPES: PASS_TYPES
};

export { vtkViewNode$1 as default };
