import _defineProperty from '@babel/runtime/helpers/defineProperty';
import widgetBehavior$1 from '../ShapeWidget/behavior.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
function widgetBehavior(publicAPI, model) {
  model.shapeHandle = model.widgetState.getRectangleHandle();
  model.point1Handle = model.widgetState.getPoint1Handle();
  model.point2Handle = model.widgetState.getPoint2Handle();
  model.point1Handle.setManipulator(model.manipulator);
  model.point2Handle.setManipulator(model.manipulator); // We inherit shapeBehavior

  widgetBehavior$1(publicAPI, model);

  var superClass = _objectSpread({}, publicAPI);

  model.classHierarchy.push('vtkRectangleWidgetProp');

  publicAPI.setCorners = function (point1, point2) {
    if (superClass.setCorners) {
      superClass.setCorners(point1, point2);
    }

    model.shapeHandle.setOrigin(point1);
    model.shapeHandle.setCorner(point2);
  };
}

export { widgetBehavior as default };
