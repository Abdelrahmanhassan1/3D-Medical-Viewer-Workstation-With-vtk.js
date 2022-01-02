import vtkAppendPolyData from './General/AppendPolyData.js';
import vtkCalculator from './General/Calculator.js';
import vtkClosedPolyLineToSurfaceFilter from './General/ClosedPolyLineToSurfaceFilter.js';
import vtkImageCropFilter from './General/ImageCropFilter.js';
import vtkImageMarchingCubes from './General/ImageMarchingCubes.js';
import vtkImageMarchingSquares from './General/ImageMarchingSquares.js';
import vtkImageOutlineFilter from './General/ImageOutlineFilter.js';
import vtkImageSliceFilter from './General/ImageSliceFilter.js';
import vtkImageStreamline from './General/ImageStreamline.js';
import vtkMoleculeToRepresentation from './General/MoleculeToRepresentation.js';
import vtkOutlineFilter from './General/OutlineFilter.js';
import vtkPaintFilter from './General/PaintFilter.js';
import vtkScalarToRGBA from './General/ScalarToRGBA.js';
import vtkTubeFilter from './General/TubeFilter.js';
import vtkWarpScalar from './General/WarpScalar.js';
import vtkWindowedSincPolyDataFilter from './General/WindowedSincPolyDataFilter.js';

var General = {
  vtkAppendPolyData: vtkAppendPolyData,
  vtkCalculator: vtkCalculator,
  vtkClosedPolyLineToSurfaceFilter: vtkClosedPolyLineToSurfaceFilter,
  vtkImageCropFilter: vtkImageCropFilter,
  vtkImageMarchingCubes: vtkImageMarchingCubes,
  vtkImageMarchingSquares: vtkImageMarchingSquares,
  vtkImageOutlineFilter: vtkImageOutlineFilter,
  vtkImageSliceFilter: vtkImageSliceFilter,
  vtkImageStreamline: vtkImageStreamline,
  vtkMoleculeToRepresentation: vtkMoleculeToRepresentation,
  vtkOutlineFilter: vtkOutlineFilter,
  vtkPaintFilter: vtkPaintFilter,
  vtkScalarToRGBA: vtkScalarToRGBA,
  vtkTubeFilter: vtkTubeFilter,
  vtkWarpScalar: vtkWarpScalar,
  vtkWindowedSincPolyDataFilter: vtkWindowedSincPolyDataFilter
};

export { General as default };
