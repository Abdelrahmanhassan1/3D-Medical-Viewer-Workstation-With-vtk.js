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

//import controlPanel from './controller.html';
const controlPanel = `
<style>
        
        #label{
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
<label id="label">Select a Data Image:</label>
<form>
  <select id="mySelect" onchange="myFunction()">
    <option value="0" class="option_selected">Image Data 1</option>
    <option value="1" class="option_selected">Image Data 2</option>
    <option value="2" class="option_selected">Image Data 3</option>
    <option value="3" class="option_selected">Image Data 4</option>
  </select>
</form>
<hr>

<label id="label">Widget 1 (Volume Contour):</label> <br>

<table>
  <tr>
    <td>Iso value</td>
    <td>
      <input class='isoValue' type="range" min="0.0" max="1.0" step="0.05" value="0.0" />
    </td>
  </tr>
</table>

<label id="label">Widget 2 (Image Cropping Widget):</label> <br>

<table>
  <tr>
    <td>pickable</td>
    <td>
      <input class='flag' data-name="pickable" type="checkbox" checked />
    </td>
  </tr>
  <tr>
    <td>visibility</td>
    <td>
      <input class='flag' data-name="visibility" type="checkbox" checked />
    </td>
  </tr>
  <tr>
    <td>contextVisibility</td>
    <td>
      <input class='flag' data-name="contextVisibility" type="checkbox" checked />
    </td>
  </tr>
  <tr>
    <td>handleVisibility</td>
    <td>
      <input class='flag' data-name="handleVisibility" type="checkbox" checked />
    </td>
  </tr>
  <tr>
    <td>faceHandlesEnabled</td>
    <td>
      <input class='flag' data-name="faceHandlesEnabled" type="checkbox" checked />
    </td>
  </tr>
  <tr>
    <td>edgeHandlesEnabled</td>
    <td>
      <input class='flag' data-name="edgeHandlesEnabled" type="checkbox" checked />
    </td>
  </tr>
  <tr>
    <td>cornerHandlesEnabled</td>
    <td>
      <input class='flag' data-name="cornerHandlesEnabled" type="checkbox" checked />
    </td>
  </tr>
  
</table>




`;

const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
    background: [0, 0, 0],
});
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();

fullScreenRenderWindow.addController(controlPanel);

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
        const firstIsoValue = (dataRange[0] + dataRange[1]) / 3;

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

