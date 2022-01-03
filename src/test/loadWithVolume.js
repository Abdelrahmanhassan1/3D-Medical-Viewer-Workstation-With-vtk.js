import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkImageMarchingCubes from '@kitware/vtk.js/Filters/General/ImageMarchingCubes';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import imageCropping from '../imageCroppingWidget';
import piecewise from '../pieceWiseGuass';
import { s } from '@kitware/vtk.js/Common/Core/Math/index';


// import controlPanel from './controller.html';
function surfaceRendering(){
  
const controlPanel = `
<style>
        .btnWidget{
          background-color: #4CAF50; /* Green */
          border: none;
          color: white;
          padding: 10px 20px;
          text-align: center;
          text-decoration: none;
          border-radius: 10px;
          font-size: 16px;
          justify-content: center;  
          align-items: center;  
        }
        .labelWidget{
          color: #d2691e;
          font-size: 1.2rem;
          font-family:"Rockwell";
        }
        .option_selected {
          position: absolute;
          background-color: DodgerBlue;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 99;
          font-family:"Arial";
        }
        form{
          font-size: 2rem;
        }
        select {
          outline: 0;
          width: 100%;
          height: 100%;
          color: black;
          border: 1px solid black;
          border-radius: 3px;
          font-size: 1.5 rem;
      }
      hr{
        color: #008b8b;
        height:2px;
        border-width:0;color:gray;background-color:gray
      }
  </style>
<label class="labelWidget"> Surface Rendering </label>

<hr>

<label class="labelWidget">Volume Contour</label> <br>

<table>
  <tr>
    <td>Iso value</td>
    <td>
      <input class='isoValue' type="range" min="0.0" max="1.0" step="0.05" value="0.0" />
    </td>
  </tr>
</table>

<hr>
<button class="btnWidget" id="chestbtn">Image Cropping</button>

<button class="btnWidget" id="piecebtn">Ray Casting</button>


`;



const Data_Urls = [
  `https://kitware.github.io/vtk-js/data/volume/headsq.vti/`,
  `https://kitware.github.io/vtk-js/data/volume/LIDC2.vti`
]

const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
    background: [0, 0, 0],
});
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();

fullScreenRenderWindow.addController(controlPanel);
// Write Every addListener Function below this line.

const chestbtn = document.querySelector('#chestbtn');
chestbtn.addEventListener("click", imageCropping);

const piecebtn = document.querySelector('#piecebtn');
piecebtn.addEventListener("click", piecewise);



const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();
const marchingCube = vtkImageMarchingCubes.newInstance({
    contourValue: 0.0,
    computeNormals: true,
    mergePoints: true,
});

actor.setMapper(mapper);
mapper.setInputConnection(marchingCube.getOutputPort());

function updateIsoValue(e) {
    const isoValue = Number(e.target.value);
    marchingCube.setContourValue(isoValue);
    renderWindow.render();
}

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
marchingCube.setInputConnection(reader.getOutputPort());

reader
    .setUrl(`https://kitware.github.io/vtk-js/data/volume/headsq.vti/`, { loadData: true })
    .then(() => {
        const data = reader.getOutputData();
        const dataRange = data.getPointData().getScalars().getRange();
        const firstIsoValue = (dataRange[0] + dataRange[1]) / 5;

        const el = document.querySelector('.isoValue');
        el.setAttribute('min', dataRange[0]);
        el.setAttribute('max', dataRange[1]);
        el.setAttribute('value', firstIsoValue);
        el.addEventListener('input', updateIsoValue);

        marchingCube.setContourValue(firstIsoValue);
        renderer.addActor(actor);
        renderer.getActiveCamera().set({ position: [1, 1, 0], viewUp: [0, 0, -1] });
        renderer.resetCamera();
        renderWindow.render();
    });



global.fullScreen = fullScreenRenderWindow;
global.actor = actor;
global.mapper = mapper;
global.marchingCube = marchingCube;
}
export default surfaceRendering;
