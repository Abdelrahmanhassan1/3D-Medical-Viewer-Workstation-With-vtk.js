import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import vtkAbstractWidgetFactory from '../Core/AbstractWidgetFactory.js';
import { BehaviorCategory, ShapeBehavior } from './ShapeWidget/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function vtkShapeWidget(publicAPI, model) {
  model.classHierarchy.push('vtkShapeWidget');
  model.methodsToLink = ['scaleInPixels', 'textProps', 'fontProperties'];
}

function defaultValues(initialValues) {
  var _None;

  return _objectSpread({
    manipulator: null,
    modifierBehavior: {
      None: (_None = {}, _defineProperty(_None, BehaviorCategory.PLACEMENT, ShapeBehavior[BehaviorCategory.PLACEMENT].CLICK_AND_DRAG), _defineProperty(_None, BehaviorCategory.POINTS, ShapeBehavior[BehaviorCategory.POINTS].CORNER_TO_CORNER), _defineProperty(_None, BehaviorCategory.RATIO, ShapeBehavior[BehaviorCategory.RATIO].FREE), _None)
    },
    resetAfterPointPlacement: false
  }, initialValues);
} // ----------------------------------------------------------------------------


function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, defaultValues(initialValues));
  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['modifierBehavior', 'resetAfterPointPlacement']);
  vtkShapeWidget(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkShapeWidget');
var vtkShapeWidget$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkShapeWidget$1 as default, extend, newInstance };
