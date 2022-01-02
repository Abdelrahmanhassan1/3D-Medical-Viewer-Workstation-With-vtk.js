import { f as distance2BetweenPoints } from '../../Common/Core/Math/index.js';
import macro from '../../macros.js';
import generateState from './LineWidget/state.js';
import vtkAbstractWidgetFactory from '../Core/AbstractWidgetFactory.js';
import vtkArrowHandleRepresentation from '../Representations/ArrowHandleRepresentation.js';
import vtkPlanePointManipulator from '../Manipulators/PlaneManipulator.js';
import vtkSVGLandmarkRepresentation from '../SVG/SVGLandmarkRepresentation.js';
import vtkPolyLineRepresentation from '../Representations/PolyLineRepresentation.js';
import widgetBehavior from './LineWidget/behavior.js';
import { Behavior } from '../Representations/WidgetRepresentation/Constants.js';
import { ViewTypes } from '../Core/WidgetManager/Constants.js';
import { getPoint, updateTextPosition } from './LineWidget/helpers.js';

// Factory
// ----------------------------------------------------------------------------

function vtkLineWidget(publicAPI, model) {
  model.classHierarchy.push('vtkLineWidget');
  model.widgetState = generateState();
  model.behavior = widgetBehavior; // --- Widget Requirement ---------------------------------------------------

  model.methodsToLink = ['activeScaleFactor', 'activeColor', 'useActiveColor', 'glyphResolution', 'defaultScale'];

  publicAPI.getRepresentationsForViewType = function (viewType) {
    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
      case ViewTypes.VOLUME:
      default:
        return [{
          builder: vtkArrowHandleRepresentation,
          labels: ['handle1'],
          initialValues: {
            /* to scale handle size when zooming/dezooming, optional */
            scaleInPixels: true,

            /*
             * This table sets the visibility of the handles' actors
             * 1st actor is a displayActor, which hides a rendered object on the HTML layer.
             * operating on its value allows to hide a handle to the user while still being
             * able to detect its presence, so the user can move it. 2nd actor is a classic VTK
             * actor which renders the object on the VTK scene
             */
            visibilityFlagArray: [false, false],
            coincidentTopologyParameters: {
              Point: {
                factor: -1.0,
                offset: -1.0
              },
              Line: {
                factor: -1.0,
                offset: -1.0
              },
              Polygon: {
                factor: -3.0,
                offset: -3.0
              }
            }
          }
        }, {
          builder: vtkArrowHandleRepresentation,
          labels: ['handle2'],
          initialValues: {
            /* to scale handle size when zooming/dezooming, optional */
            scaleInPixels: true,

            /*
             * This table sets the visibility of the handles' actors
             * 1st actor is a displayActor, which hides a rendered object on the HTML layer.
             * operating on its value allows to hide a handle to the user while still being
             * able to detect its presence, so the user can move it. 2nd actor is a classic VTK
             * actor which renders the object on the VTK scene
             */
            visibilityFlagArray: [false, false],
            coincidentTopologyParameters: {
              Point: {
                factor: -1.0,
                offset: -1.0
              },
              Line: {
                factor: -1.0,
                offset: -1.0
              },
              Polygon: {
                factor: -3.0,
                offset: -3.0
              }
            }
          }
        }, {
          builder: vtkArrowHandleRepresentation,
          labels: ['moveHandle'],
          initialValues: {
            scaleInPixels: true,
            visibilityFlagArray: [false, false],
            coincidentTopologyParameters: {
              Point: {
                factor: -1.0,
                offset: -1.0
              },
              Line: {
                factor: -1.0,
                offset: -1.0
              },
              Polygon: {
                factor: -3.0,
                offset: -3.0
              }
            }
          }
        }, {
          builder: vtkSVGLandmarkRepresentation,
          initialValues: {
            showCircle: false,
            text: '',
            textProps: {
              dx: 12,
              dy: -12
            }
          },
          labels: ['SVGtext']
        }, {
          builder: vtkPolyLineRepresentation,
          labels: ['handle1', 'handle2', 'moveHandle'],
          initialValues: {
            behavior: Behavior.HANDLE,
            pickable: true
          }
        }];
    }
  }; // --- Public methods -------------------------------------------------------


  publicAPI.getDistance = function () {
    var p1 = getPoint(0, model.widgetState);
    var p2 = getPoint(1, model.widgetState);
    return p1 && p2 ? Math.sqrt(distance2BetweenPoints(p1, p2)) : 0;
  }; // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  /**
   * TBD: Why setting the move handle ?
   */


  model.widgetState.onBoundsChange(function (bounds) {
    var center = [(bounds[0] + bounds[1]) * 0.5, (bounds[2] + bounds[3]) * 0.5, (bounds[4] + bounds[5]) * 0.5];
    model.widgetState.getMoveHandle().setOrigin(center);
  });
  model.widgetState.getPositionOnLine().onModified(function () {
    updateTextPosition(model);
  }); // Default manipulator

  model.manipulator = vtkPlanePointManipulator.newInstance();
} // ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  isDragging: false
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['manipulator', 'isDragging']);
  vtkLineWidget(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkLineWidget'); // ----------------------------------------------------------------------------

var vtkLineWidget$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkLineWidget$1 as default, extend, newInstance };
