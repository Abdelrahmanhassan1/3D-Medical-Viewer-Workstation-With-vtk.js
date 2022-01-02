import _defineProperty from '@babel/runtime/helpers/defineProperty';
import { ViewTypes } from '../../Core/WidgetManager/Constants.js';

var _defaultViewUpFromVie, _viewTypeToXYZ;
var ScrollingMethods = {
  MIDDLE_MOUSE_BUTTON: 0,
  LEFT_MOUSE_BUTTON: 1,
  RIGHT_MOUSE_BUTTON: 2
}; // Note: These strings are used in ResliceCursorWidget/behavior.js
// as method's names

var InteractionMethodsName = {
  TranslateAxis: 'translateAxis',
  RotateLine: 'rotateLine',
  TranslateCenter: 'translateCenter'
};
var defaultViewUpFromViewType = (_defaultViewUpFromVie = {}, _defineProperty(_defaultViewUpFromVie, ViewTypes.YZ_PLANE, [0, 0, 1]), _defineProperty(_defaultViewUpFromVie, ViewTypes.XZ_PLANE, [0, 0, 1]), _defineProperty(_defaultViewUpFromVie, ViewTypes.XY_PLANE, [0, -1, 0]), _defaultViewUpFromVie);
var xyzToViewType = [ViewTypes.YZ_PLANE, ViewTypes.XZ_PLANE, ViewTypes.XY_PLANE];
var viewTypeToXYZ = (_viewTypeToXYZ = {}, _defineProperty(_viewTypeToXYZ, ViewTypes.YZ_PLANE, 0), _defineProperty(_viewTypeToXYZ, ViewTypes.XZ_PLANE, 1), _defineProperty(_viewTypeToXYZ, ViewTypes.XY_PLANE, 2), _viewTypeToXYZ);
var Constants = {
  ScrollingMethods: ScrollingMethods,
  InteractionMethodsName: InteractionMethodsName,
  xyzToViewType: xyzToViewType,
  viewTypeToXYZ: viewTypeToXYZ
};

export { InteractionMethodsName, ScrollingMethods, Constants as default, defaultViewUpFromViewType, viewTypeToXYZ, xyzToViewType };
