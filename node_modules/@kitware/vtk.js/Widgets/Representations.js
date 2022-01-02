import vtkCircleContextRepresentation from './Representations/CircleContextRepresentation.js';
import vtkContextRepresentation from './Representations/ContextRepresentation.js';
import vtkConvexFaceContextRepresentation from './Representations/ConvexFaceContextRepresentation.js';
import vtkCubeHandleRepresentation from './Representations/CubeHandleRepresentation.js';
import vtkHandleRepresentation from './Representations/HandleRepresentation.js';
import vtkImplicitPlaneRepresentation from './Representations/ImplicitPlaneRepresentation.js';
import vtkOutlineContextRepresentation from './Representations/OutlineContextRepresentation.js';
import vtkPolyLineRepresentation from './Representations/PolyLineRepresentation.js';
import vtkSphereHandleRepresentation from './Representations/SphereHandleRepresentation.js';
import vtkWidgetRepresentation from './Representations/WidgetRepresentation.js';

var Representations = {
  vtkCircleContextRepresentation: vtkCircleContextRepresentation,
  vtkContextRepresentation: vtkContextRepresentation,
  vtkConvexFaceContextRepresentation: vtkConvexFaceContextRepresentation,
  vtkCubeHandleRepresentation: vtkCubeHandleRepresentation,
  vtkHandleRepresentation: vtkHandleRepresentation,
  vtkImplicitPlaneRepresentation: vtkImplicitPlaneRepresentation,
  vtkOutlineContextRepresentation: vtkOutlineContextRepresentation,
  vtkPolyLineRepresentation: vtkPolyLineRepresentation,
  vtkSphereHandleRepresentation: vtkSphereHandleRepresentation,
  vtkWidgetRepresentation: vtkWidgetRepresentation
};

export { Representations as default };
