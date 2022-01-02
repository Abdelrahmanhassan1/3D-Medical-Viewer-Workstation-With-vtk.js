import _defineProperty from '@babel/runtime/helpers/defineProperty';
import vtkStateBuilder from '../../Core/StateBuilder.js';
import { ScrollingMethods } from './Constants.js';
import { ViewTypes } from '../../Core/WidgetManager/Constants.js';

var factor = 1;
var axisXColor = [1, 0, 0];
var axisYColor = [0, 1, 0];
var axisZColor = [0, 0, 1];

var generateAxisXinY = function generateAxisXinY() {
  return vtkStateBuilder.createBuilder().addField({
    name: 'point1',
    initialValue: [0, 0, -factor]
  }).addField({
    name: 'point2',
    initialValue: [0, 0, factor]
  }).addField({
    name: 'color',
    initialValue: axisXColor
  }).addField({
    name: 'name',
    initialValue: 'AxisXinY'
  }).addField({
    name: 'viewType',
    initialValue: ViewTypes.YZ_PLANE
  }).addField({
    name: 'inViewType',
    initialValue: ViewTypes.XZ_PLANE
  }).build();
};

var generateAxisXinZ = function generateAxisXinZ() {
  return vtkStateBuilder.createBuilder().addField({
    name: 'point1',
    initialValue: [0, -factor, 0]
  }).addField({
    name: 'point2',
    initialValue: [0, factor, 0]
  }).addField({
    name: 'color',
    initialValue: axisXColor
  }).addField({
    name: 'name',
    initialValue: 'AxisXinZ'
  }).addField({
    name: 'viewType',
    initialValue: ViewTypes.YZ_PLANE
  }).addField({
    name: 'inViewType',
    initialValue: ViewTypes.XY_PLANE
  }).build();
};

var generateAxisYinX = function generateAxisYinX() {
  return vtkStateBuilder.createBuilder().addField({
    name: 'point1',
    initialValue: [0, 0, -factor]
  }).addField({
    name: 'point2',
    initialValue: [0, 0, factor]
  }).addField({
    name: 'color',
    initialValue: axisYColor
  }).addField({
    name: 'name',
    initialValue: 'AxisYinX'
  }).addField({
    name: 'viewType',
    initialValue: ViewTypes.XZ_PLANE
  }).addField({
    name: 'inViewType',
    initialValue: ViewTypes.YZ_PLANE
  }).build();
};

var generateAxisYinZ = function generateAxisYinZ() {
  return vtkStateBuilder.createBuilder().addField({
    name: 'point1',
    initialValue: [-factor, 0, 0]
  }).addField({
    name: 'point2',
    initialValue: [factor, 0, 0]
  }).addField({
    name: 'color',
    initialValue: axisYColor
  }).addField({
    name: 'name',
    initialValue: 'AxisYinZ'
  }).addField({
    name: 'viewType',
    initialValue: ViewTypes.XZ_PLANE
  }).addField({
    name: 'inViewType',
    initialValue: ViewTypes.XY_PLANE
  }).build();
};

var generateAxisZinX = function generateAxisZinX() {
  return vtkStateBuilder.createBuilder().addField({
    name: 'point1',
    initialValue: [0, -factor, 0]
  }).addField({
    name: 'point2',
    initialValue: [0, factor, 0]
  }).addField({
    name: 'color',
    initialValue: axisZColor
  }).addField({
    name: 'name',
    initialValue: 'AxisZinX'
  }).addField({
    name: 'viewType',
    initialValue: ViewTypes.XY_PLANE
  }).addField({
    name: 'inViewType',
    initialValue: ViewTypes.YZ_PLANE
  }).build();
};

var generateAxisZinY = function generateAxisZinY() {
  return vtkStateBuilder.createBuilder().addField({
    name: 'point1',
    initialValue: [-factor, 0, 0]
  }).addField({
    name: 'point2',
    initialValue: [factor, 0, 0]
  }).addField({
    name: 'color',
    initialValue: axisZColor
  }).addField({
    name: 'name',
    initialValue: 'AxisZinY'
  }).addField({
    name: 'viewType',
    initialValue: ViewTypes.XY_PLANE
  }).addField({
    name: 'inViewType',
    initialValue: ViewTypes.XZ_PLANE
  }).build();
};

function generateState() {
  var _initialValue;

  return vtkStateBuilder.createBuilder().addStateFromInstance({
    labels: ['AxisXinY'],
    name: 'AxisXinY',
    instance: generateAxisXinY()
  }).addStateFromInstance({
    labels: ['AxisXinZ'],
    name: 'AxisXinZ',
    instance: generateAxisXinZ()
  }).addStateFromInstance({
    labels: ['AxisYinX'],
    name: 'AxisYinX',
    instance: generateAxisYinX()
  }).addStateFromInstance({
    labels: ['AxisYinZ'],
    name: 'AxisYinZ',
    instance: generateAxisYinZ()
  }).addStateFromInstance({
    labels: ['AxisZinX'],
    name: 'AxisZinX',
    instance: generateAxisZinX()
  }).addStateFromInstance({
    labels: ['AxisZinY'],
    name: 'AxisZinY',
    instance: generateAxisZinY()
  }).addField({
    name: 'center',
    initialValue: [0, 0, 0]
  }).addField({
    name: 'opacity',
    initialValue: 1
  }).addField({
    name: 'activeLineState',
    initialValue: null
  }).addField({
    name: 'activeRotationPointName',
    initialValue: ''
  }).addField({
    name: 'image',
    initialValue: null
  }).addField({
    name: 'activeViewType',
    initialValue: null
  }).addField({
    name: 'lineThickness',
    initialValue: 2
  }).addField({
    name: 'sphereRadius',
    initialValue: 5
  }).addField({
    name: 'showCenter',
    initialValue: true
  }).addField({
    name: 'updateMethodName'
  }).addField({
    name: 'planes',
    initialValue: (_initialValue = {}, _defineProperty(_initialValue, ViewTypes.YZ_PLANE, {
      normal: [1, 0, 0],
      viewUp: [0, 0, 1]
    }), _defineProperty(_initialValue, ViewTypes.XZ_PLANE, {
      normal: [0, -1, 0],
      viewUp: [0, 0, 1]
    }), _defineProperty(_initialValue, ViewTypes.XY_PLANE, {
      normal: [0, 0, -1],
      viewUp: [0, -1, 0]
    }), _initialValue)
  }).addField({
    name: 'enableRotation',
    initialValue: true
  }).addField({
    name: 'enableTranslation',
    initialValue: true
  }).addField({
    name: 'keepOrthogonality',
    initialValue: false
  }).addField({
    name: 'scrollingMethod',
    initialValue: ScrollingMethods.MIDDLE_MOUSE_BUTTON
  }).addField({
    name: 'cameraOffsets',
    initialValue: {}
  }).addField({
    name: 'viewUpFromViewType',
    initialValue: {}
  }).build();
}

export { generateState as default };
