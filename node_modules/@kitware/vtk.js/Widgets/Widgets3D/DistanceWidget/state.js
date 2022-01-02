import vtkStateBuilder from '../../Core/StateBuilder.js';

function generateState() {
  return vtkStateBuilder.createBuilder().addStateFromMixin({
    labels: ['moveHandle'],
    mixins: ['origin', 'color', 'scale1', 'visible'],
    name: 'moveHandle',
    initialValues: {
      scale1: 0.1,
      visible: false
    }
  }).addDynamicMixinState({
    labels: ['handles'],
    mixins: ['origin', 'color', 'scale1', 'visible'],
    name: 'handle',
    initialValues: {
      scale1: 0.1
    }
  }).build();
}

export { generateState as default };
