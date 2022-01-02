import _slicedToArray from '@babel/runtime/helpers/slicedToArray';

var SVG_XMLNS = 'http://www.w3.org/2000/svg';

function attrDelta(oldObj, newObj) {
  var set = [];
  var remove = [];
  var oldKeysArray = Object.keys(oldObj);
  var newKeysArray = Object.keys(newObj);
  var oldKeys = new Set(oldKeysArray);
  var newKeys = new Set(newKeysArray);

  for (var i = 0; i < oldKeysArray.length; i++) {
    var key = oldKeysArray[i];

    if (newKeys.has(key)) {
      if (oldObj[key] !== newObj[key]) {
        set.push([key, newObj[key]]);
      }
    } else {
      remove.push(key);
    }
  }

  for (var _i = 0; _i < newKeysArray.length; _i++) {
    var _key = newKeysArray[_i];

    if (!oldKeys.has(_key)) {
      set.push([_key, newObj[_key]]);
    }
  }

  return [set, remove];
}

function render(vnode) {
  var node = document.createElementNS(SVG_XMLNS, vnode.name);
  var keys = Object.keys(vnode.attrs);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    node.setAttribute(key, vnode.attrs[key]);
  } // TODO: support removing event listener (e.g. use snabbdom)


  Object.keys(vnode.eventListeners).forEach(function (key) {
    node.addEventListener(key, vnode.eventListeners[key]);
  });

  if (vnode.textContent) {
    node.textContent = vnode.textContent;
  } else {
    for (var _i2 = 0; _i2 < vnode.children.length; _i2++) {
      node.appendChild(render(vnode.children[_i2]));
    }
  }

  return node;
}
/**
 * Returns a set of patch functions to be applied to a document node.
 *
 * Patch functions must return the effective result node.
 */

function diff(oldVTree, newVTree) {
  if (newVTree.textContent !== null && newVTree.children.length) {
    throw new Error('Tree cannot have both children and textContent!');
  }

  if (!oldVTree) {
    return [function () {
      return render(newVTree);
    }];
  }

  if (!newVTree) {
    return [function (node) {
      return node.remove();
    }];
  }

  if (oldVTree.name !== newVTree.name) {
    return [function (node) {
      var newNode = render(newVTree);
      node.replaceWith(newNode);
      return newNode;
    }];
  }

  var patchFns = [];

  var _attrDelta = attrDelta(oldVTree.attrs, newVTree.attrs),
      _attrDelta2 = _slicedToArray(_attrDelta, 2),
      attrsSet = _attrDelta2[0],
      attrsRemove = _attrDelta2[1];

  if (attrsSet.length || attrsRemove.length) {
    patchFns.push(function (node) {
      for (var i = 0; i < attrsSet.length; i++) {
        var _attrsSet$i = _slicedToArray(attrsSet[i], 2),
            name = _attrsSet$i[0],
            value = _attrsSet$i[1];

        node.setAttribute(name, value);
      }

      for (var _i3 = 0; _i3 < attrsRemove.length; _i3++) {
        var _name = attrsRemove[_i3];
        node.removeAttribute(_name);
      }

      return node;
    });
  }

  if (oldVTree.textContent !== newVTree.textContent && newVTree.textContent !== null) {
    patchFns.push(function (node) {
      node.textContent = newVTree.textContent;
      return node;
    });
  }

  if (newVTree.textContent === null) {
    var min = Math.min(oldVTree.children.length, newVTree.children.length);

    var _loop = function _loop(i) {
      var childPatches = diff(oldVTree.children[i], newVTree.children[i]);
      patchFns.push(function (node) {
        for (var p = 0; p < childPatches.length; p++) {
          childPatches[p](node.children[i]);
        }

        return node;
      });
    };

    for (var i = 0; i < min; i++) {
      _loop(i);
    }

    if (oldVTree.children.length < newVTree.children.length) {
      var _loop2 = function _loop2(_i4) {
        patchFns.push(function (node) {
          node.appendChild(render(newVTree.children[_i4]));
          return node;
        });
      };

      for (var _i4 = min; _i4 < newVTree.children.length; _i4++) {
        _loop2(_i4);
      }
    } else {
      var _loop3 = function _loop3(_i5) {
        patchFns.push(function (node) {
          node.children[_i5].remove();

          return node;
        });
      };

      // always delete nodes in reverse
      for (var _i5 = oldVTree.children.length - 1; _i5 >= min; _i5--) {
        _loop3(_i5);
      }
    }
  }

  return patchFns;
}

export { diff, render };
