import vtkStateBuilder from '../../Core/StateBuilder.js';
import { splineKind } from '../../../Common/DataModel/Spline3D/Constants.js';

function generateState() {
  return vtkStateBuilder.createBuilder().addField({
    name: 'splineKind',
    initialValue: splineKind.KOCHANEK_SPLINE
  }).addField({
    name: 'splineTension',
    initialValue: 0
  }).addField({
    name: 'splineContinuity',
    initialValue: 0
  }).addField({
    name: 'splineBias',
    initialValue: 0
  }).addStateFromMixin({
    labels: ['moveHandle'],
    mixins: ['origin', 'color', 'scale1', 'visible'],
    name: 'moveHandle',
    initialValues: {
      scale1: 0.05,
      visible: false
    }
  }).addDynamicMixinState({
    labels: ['handles'],
    mixins: ['origin', 'color', 'scale1', 'visible'],
    name: 'handle',
    initialValues: {
      scale1: 0.05
    }
  }).build();
}

export { generateState as default };
