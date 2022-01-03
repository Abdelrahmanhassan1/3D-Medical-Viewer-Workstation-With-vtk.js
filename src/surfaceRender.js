// import '@kitware/vtk.js/favicon';

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
// import imageCroppingfunc from './imageCroppingWidget';
// import piecewise from './pieceWiseGuass';
import { s } from '@kitware/vtk.js/Common/Core/Math/index';


// import controlPanel from './controller.html';
function surfaceRenderer(){

const controlPanel = `
<style>       
        .btnWidget {
          background-color: #c2fbd7;
          border-radius: 100px;
          box-shadow: rgba(44, 187, 99, .2) 0 -25px 18px -14px inset,rgba(44, 187, 99, .15) 0 1px 2px,rgba(44, 187, 99, .15) 0 2px 4px,rgba(44, 187, 99, .15) 0 4px 8px,rgba(44, 187, 99, .15) 0 8px 16px,rgba(44, 187, 99, .15) 0 16px 32px;
          color: green;
          cursor: pointer;
          font-family: cursive;
          padding: 7px 20px;
          text-align: center;
          text-decoration: none;
          transition: all 250ms;
          border: 0;
          margin:5px;
          font-size: 15px;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
          color: black;
          font-weight: bold;
        }
        
        .btnWidget:hover {
          box-shadow: rgba(44,187,99,.35) 0 -25px 18px -14px inset,rgba(44,187,99,.25) 0 1px 2px,rgba(44,187,99,.25) 0 2px 4px,rgba(44,187,99,.25) 0 4px 8px,rgba(44,187,99,.25) 0 8px 16px,rgba(44,187,99,.25) 0 16px 32px;
          transform: scale(1.05) rotate(-1deg);
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
      .labelWidget{
        color: #d2691e;
        font-size: 1.3rem;
        font-family:"Rockwell";
      }
      td {
        color: #2F4F4F;
        font-size: 1.2rem;
        font-family:"Times New Roman";
      }
      
      table {
        margin:5px;
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

<table>
  <tr>
    <td>Iso value</td>
    <td>
      <input class='isoValue' type="range" min="0.0" max="1.0" step="0.05" value="0.0" />
    </td>
  </tr>
</table>
<hr>


<button class="btnWidget" onclick="location.href='http://localhost:8080/'">Home Page</button>
`;

{/* <button class="btnWidget" id="chestbtn">Image Cropping</button>

<button class="btnWidget" id="piecebtn">Ray Casting</button> */}

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

// const chestbtn = document.querySelector('#chestbtn');
// chestbtn.addEventListener("click", imageCroppingfunc);

// const piecebtn = document.querySelector('#piecebtn');
// piecebtn.addEventListener("click", piecewise);



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
export default surfaceRenderer;