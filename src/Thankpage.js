
function Thanks(){
    var oldDiv = document.getElementById('parentDiv');
    oldDiv.remove();

// document.body.innerHTML += `
// <style>
// .headerLabels {
//     font-weight: 900;
//     font-size: 3.5em;
//   }
  
//   .headerLabels .letter {
//     display: inline-block;
//     line-height: 1em;
//   }

// </style>
// <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/animejs/2.0.2/anime.min.js"></script>

// <div class="divhomepage">
//     <h1 class="headerLabels">Team Members</h1>
    
// </div>

// <script type="text/javascript">
//     var textWrapper = document.querySelector('.headerLabels');
//     textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");

//     anime.timeline({loop: true})
//     .add({
//         targets: '.headerLabels .letter',
//         scale: [4,1],
//         opacity: [0,1],
//         translateZ: 0,
//         easing: "easeOutExpo",
//         duration: 950,
//         delay: (el, i) => 70*i
//     }).add({
//         targets: '.headerLabels',
//         opacity: 0,
//         duration: 1000,
//         easing: "easeOutExpo",
//         delay: 1000
//       });
// </script>

// `;
{/* <div class="wrapper">
    <div class="typing-demo">
        Thanks For Watching.<br> 
        Team Members: <br> 
        Abdelrahman Hassan Marei <br> 
        Safwan Mahmoud <br>
        Maryam <br>
        Esraa.  <br>

    </div>
</div> */}

document.body.innerHTML += `

<style>
        * {
            padding: 0;
            margin: 0;
            font-family: sans-serif;
        }
  
        body {
            background: #2D2D2D;
        }
  
        .container {
            text-align: center;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
        }
  
        .container span {
            display: block;
        }
  
        .text1 {
            color: white;
            font-size: 70px;
            font-weight: 700;
            letter-spacing: 8px;
            margin-bottom: 20px;
            background: #2D2D2D;
            position: relative;
            animation: text 3s 1;
        }
  
        .text2 {
            font-size: 30px;
            color: #C5BA9A;
            font-family: sans-serif;
        }
        #btn-1{
            position:absolute;
            top: 80%;
            left: 53%;
            transform: translate(-80%, -45%);
        }
        @keyframes text {
            0% {
                color: black;
                margin-bottom: -40px;
            }
  
            30% {
                letter-spacing: 25px;
                margin-bottom: -40px;
            }
  
            85% {
                letter-spacing: 8px;
                margin-bottom: -40px;
            }
        }
    </style>
  

    <div class="container">
        <div class="row">
            <span class="text1">Thanks For Watching!</span>
            <span class="text2">S.A.M.E CG Team</span>
        </div>
    </div>
    <button class="btnhomepage" id="btn-1" onclick="location.href='http://localhost:8080/'">Home Page</button>
    

`;

}
export default Thanks;