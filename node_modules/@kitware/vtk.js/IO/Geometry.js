import vtkSTLReader from './Geometry/STLReader.js';
import vtkPLYReader from './Geometry/PLYReader.js';
import vtkDracoReader from './Geometry/DracoReader.js';
import vtkSTLWriter from './Geometry/STLWriter.js';

var Geometry = {
  vtkSTLReader: vtkSTLReader,
  vtkPLYReader: vtkPLYReader,
  vtkDracoReader: vtkDracoReader,
  vtkSTLWriter: vtkSTLWriter
};

export { Geometry as default };
