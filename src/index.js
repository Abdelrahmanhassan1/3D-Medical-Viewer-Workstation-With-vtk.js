import surfaceRenderer from './surfaceRender';
import imageCroppingfunc from './imageCroppingWidget';
import piecewisefunction from './pieceWiseGuass';
import Thanks from './Thankpage';
document.body.innerHTML += `
<style>
body{
  background-image: linear-gradient(to right, #2D2D2D, #2D2D2D);
}
.divhomepage, .btnhomepage, img{
  display:flex;
  justify-content: center;
  align-items: center;
  margin-top:30px;
}
.divhomepage{
  font: bold 2.5em "Fira Sans", serif;
  padding: 10px;
  color: #C5BA9A;
  font-family: 'Dancing Script', cursive;
}
.btnhomepage {
  display:flex;
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
  font-size: 20px;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  color: black;
  font-weight: bold;
}

.btnhomepage:hover {
  box-shadow: rgba(44,187,99,.35) 0 -25px 18px -14px inset,rgba(44,187,99,.25) 0 1px 2px,rgba(44,187,99,.25) 0 2px 4px,rgba(44,187,99,.25) 0 4px 8px,rgba(44,187,99,.25) 0 8px 16px,rgba(44,187,99,.25) 0 16px 32px;
  transform: scale(1.05) rotate(-1deg);
}

</style>
<link href="https://fonts.googleapis.com/css2?family=Dancing+Script&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Pushster&display=swap" rel="stylesheet">
<div id="parentDiv">
  <div class="divhomepage">
    <img src="./data-visualization (1).png" alt="Girl in a jacket" width="100" height="100">
  </div>
  <div class="divhomepage">Medical Visualization App Using VTK.js</div>
  <div class="divhomepage">Dive into Some Examples</div>
  <div class="divhomepage">
    <button class="btnhomepage" id="surfRenderBtn">Surface Rendering</button>
    <button class="btnhomepage" id="imgcropBtn">Image Cropping Widget</button>
    <button class="btnhomepage" id="guassbtn">Ray Casting</button>
  </div>
  <div class="divhomepage">
    <button class="btnhomepage" id="thankbtn">Thank You!</button>
  </div>
</div>
`;


const surfRenderBtn = document.querySelector('#surfRenderBtn');
surfRenderBtn.addEventListener('click', surfaceRenderer);


const imgcropBtn = document.querySelector('#imgcropBtn');
imgcropBtn.addEventListener('click', imageCroppingfunc);


const guassbtn = document.querySelector('#guassbtn');
guassbtn.addEventListener('click', piecewisefunction);


const thankbtn = document.querySelector('#thankbtn');
thankbtn.addEventListener('click', Thanks);