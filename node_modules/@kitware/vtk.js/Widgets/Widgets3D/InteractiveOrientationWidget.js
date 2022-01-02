import macro from '../../macros.js';
import vtkAbstractWidgetFactory from '../Core/AbstractWidgetFactory.js';
import vtkConvexFaceContextRepresentation from '../Representations/ConvexFaceContextRepresentation.js';
import widgetBehavior from './InteractiveOrientationWidget/behavior.js';
import { generateState, INITIAL_POINTS } from './InteractiveOrientationWidget/state.js';
import { Behavior } from '../Representations/WidgetRepresentation/Constants.js';
import { ViewTypes } from '../Core/WidgetManager/Constants.js';

// Factory
// ----------------------------------------------------------------------------

function vtkInteractiveOrientationWidget(publicAPI, model) {
  model.classHierarchy.push('vtkInteractiveOrientationWidget'); // --- Widget Requirement ---------------------------------------------------

  model.methodsToLink = ['closePolyLine', 'activeScaleFactor', 'activeColor', 'useActiveColor', 'glyphResolution', 'defaultScale'];
  model.behavior = widgetBehavior;
  model.widgetState = generateState();

  publicAPI.setBounds = function (bounds) {
    var handles = model.widgetState.getStatesWithLabel('handles');

    for (var i = 0; i < handles.length; i++) {
      var xyz = INITIAL_POINTS[i];
      var x = xyz[0] > 0 ? bounds[1] : bounds[0];
      var y = xyz[1] > 0 ? bounds[3] : bounds[2];
      var z = xyz[2] > 0 ? bounds[5] : bounds[4];
      handles[i].setOrigin(x, y, z);
    }
  };

  publicAPI.getRepresentationsForViewType = function (viewType) {
    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
      case ViewTypes.VOLUME:
      default:
        return [{
          builder: vtkConvexFaceContextRepresentation,
          labels: ['---', '--+', '-++', '-+-'],
          initialValues: {
            behavior: Behavior.HANDLE,
            pickable: true,
            activeScaleFactor: 1.2,
            activeColor: 1,
            useActiveColor: true,
            name: 'Face 1'
          }
        }, {
          builder: vtkConvexFaceContextRepresentation,
          labels: ['---', '+--', '+-+', '--+'],
          initialValues: {
            behavior: Behavior.HANDLE,
            pickable: true,
            activeScaleFactor: 1.2,
            activeColor: 1,
            useActiveColor: true,
            name: 'Face 2'
          }
        }, {
          builder: vtkConvexFaceContextRepresentation,
          labels: ['+--', '++-', '+++', '+-+'],
          initialValues: {
            behavior: Behavior.HANDLE,
            pickable: true,
            activeScaleFactor: 1.2,
            activeColor: 1,
            useActiveColor: true,
            name: 'Face 3'
          }
        }, {
          builder: vtkConvexFaceContextRepresentation,
          labels: ['++-', '-+-', '-++', '+++'],
          initialValues: {
            behavior: Behavior.HANDLE,
            pickable: true,
            activeScaleFactor: 1.2,
            activeColor: 1,
            useActiveColor: true,
            name: 'Face 4'
          }
        }, {
          builder: vtkConvexFaceContextRepresentation,
          labels: ['-++', '--+', '+-+', '+++'],
          initialValues: {
            behavior: Behavior.HANDLE,
            pickable: true,
            activeScaleFactor: 1.2,
            activeColor: 1,
            useActiveColor: true,
            name: 'Face 5'
          }
        }, {
          builder: vtkConvexFaceContextRepresentation,
          labels: ['-+-', '++-', '+--', '---'],
          initialValues: {
            behavior: Behavior.HANDLE,
            pickable: true,
            activeScaleFactor: 1.2,
            activeColor: 1,
            useActiveColor: true,
            name: 'Face 6'
          }
        }];
    }
  };
} // ----------------------------------------------------------------------------


var DEFAULT_VALUES = {}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  vtkInteractiveOrientationWidget(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkInteractiveOrientationWidget'); // ----------------------------------------------------------------------------

var vtkInteractiveOrientationWidget$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkInteractiveOrientationWidget$1 as default, extend, newInstance };
