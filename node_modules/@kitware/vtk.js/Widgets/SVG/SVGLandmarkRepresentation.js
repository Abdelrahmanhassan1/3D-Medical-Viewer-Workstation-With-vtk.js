import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import vtkSVGRepresentation from './SVGRepresentation.js';
import { fontSizeToPixels, VerticalTextAlignment } from './SVGLandmarkRepresentation/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var createSvgElement = vtkSVGRepresentation.createSvgElement; // ----------------------------------------------------------------------------
// vtkSVGLandmarkRepresentation
// ----------------------------------------------------------------------------

function vtkSVGLandmarkRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSVGLandmarkRepresentation');

  publicAPI.render = function () {
    var list = publicAPI.getRepresentationStates();
    var coords = [];
    var texts = [];
    list.forEach(function (state, index) {
      if (state.getOrigin && state.getOrigin() && state.getVisible && state.getVisible()) {
        coords.push(state.getOrigin());
        texts.push(state.getText ? state.getText() : "L".concat(index));
      }
    });
    return publicAPI.worldPointsToPixelSpace(coords).then(function (pixelSpace) {
      var points2d = pixelSpace.coords;
      var winHeight = pixelSpace.windowSize[1];
      var root = createSvgElement('g');

      var _loop = function _loop(i) {
        var xy = points2d[i];

        if (Number.isNaN(xy[0]) || Number.isNaN(xy[1])) {
          return "continue"; // eslint-disable-line
        }

        var x = xy[0];
        var y = winHeight - xy[1];

        if (model.showCircle === true) {
          var circle = publicAPI.createListenableSvgElement('circle', i);
          Object.keys(model.circleProps || {}).forEach(function (prop) {
            return circle.setAttribute(prop, model.circleProps[prop]);
          });
          circle.setAttribute('cx', x);
          circle.setAttribute('cy', y);
          root.appendChild(circle);
        }

        if (!texts[i]) {
          texts[i] = '';
        }

        var splitText = texts[i].split('\n');
        var fontSize = fontSizeToPixels(model.fontProperties);
        splitText.forEach(function (subText, j) {
          var text = publicAPI.createListenableSvgElement('text', i);
          Object.keys(model.textProps || {}).forEach(function (prop) {
            text.setAttribute(prop, model.textProps[prop]);
          });
          text.setAttribute('x', x);
          text.setAttribute('y', y); // Vertical offset (dy) calculation based on VerticalTextAlignment

          var dy = model.textProps.dy ? model.textProps.dy : 0;

          switch (model.textProps.verticalAlign) {
            case VerticalTextAlignment.MIDDLE:
              dy -= fontSize * (0.5 * splitText.length - j - 1);
              break;

            case VerticalTextAlignment.TOP:
              dy += fontSize * (j + 1);
              break;

            case VerticalTextAlignment.BOTTOM:
            default:
              dy -= fontSize * (splitText.length - j - 1);
              break;
          }

          text.setAttribute('dy', dy);
          text.setAttribute('font-size', fontSize);

          if (model.fontProperties != null) {
            text.setAttribute('font-family', model.fontProperties.fontFamily);
            text.setAttribute('font-weight', model.fontProperties.fontStyle);
            text.setAttribute('fill', model.fontProperties.fontColor);
          }

          text.textContent = subText;
          root.appendChild(text);
        });
      };

      for (var i = 0; i < points2d.length; i++) {
        var _ret = _loop(i);

        if (_ret === "continue") continue;
      }

      return root;
    });
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

/**
 * textProps can contain any "svg" attribute (e.g. text-anchor, text-align,
 * alignment-baseline...)
 * @param {*} initialValues
 * @returns
 */


function defaultValues(initialValues) {
  return _objectSpread(_objectSpread({}, initialValues), {}, {
    circleProps: _objectSpread({
      r: 5,
      stroke: 'red',
      fill: 'red'
    }, initialValues.circleProps),
    textProps: _objectSpread({
      fill: 'white'
    }, initialValues.textProps)
  });
} // ----------------------------------------------------------------------------


function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  vtkSVGRepresentation.extend(publicAPI, model, defaultValues(initialValues));
  macro.setGet(publicAPI, model, ['circleProps', 'fontProperties', 'name', 'textProps']); // Object specific methods

  vtkSVGLandmarkRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkSVGLandmarkRepresentation'); // ----------------------------------------------------------------------------

var vtkSVGLandmarkRepresentation$1 = {
  extend: extend,
  newInstance: newInstance
};

export { vtkSVGLandmarkRepresentation$1 as default, extend, newInstance };
