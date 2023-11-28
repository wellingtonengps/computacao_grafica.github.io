import * as THREE from "three";
import {
    initRenderer,
    SecondaryBox,
} from "../libs/util/util.js";
import KeyboardState from "../libs/util/KeyboardState.js";
import {Level} from "./level.js";

import {readLevel} from "./utils.js";
import {OrbitControls} from "../build/jsm/controls/OrbitControls.js";
import {SoundManager} from "./soundManager.js";
import {ColladaLoader} from "../build/jsm/loaders/ColladaLoader.js";


// Initial variables
let gamePaused = false;
let gameStarted = false;
var keyboard = new KeyboardState();
let scene; // Create main scene
let renderer = initRenderer();
let orbitControls;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;

let level;
let mouse = new THREE.Vector2();
let levelNumber= 1;
let initialBallSpeed = 0.1;
let ballSpeed = initialBallSpeed;

var infoBox = new SecondaryBox();
infoBox.changeMessage("--")

window.addEventListener("mousemove", onMouseMove);
window.addEventListener("click", onMouseClick);
window.addEventListener(
    "resize",
    function () {
        onWindowResize(level.camera, renderer);
    },
    false
);
let timer;

// Create the loading manager
const loadingManager = new THREE.LoadingManager( () => {
    let loadingScreen = document.getElementById( 'loading-screen' );
    loadingScreen.transition = 0;
    loadingScreen.style.setProperty('--speed1', '0');
    loadingScreen.style.setProperty('--speed2', '0');
    loadingScreen.style.setProperty('--speed3', '0');

    let button1 = document.getElementById("myBtn");
    let button2 = document.getElementById("myBtn2");
    let button3 = document.getElementById("myBtn3");

    // Set initial styles and event listeners
    button1.style.backgroundColor = 'Red';
    button1.innerHTML = 'Iniciar';
    button1.addEventListener("click", onButtonPressed);

    button2.style.backgroundColor = 'Green';
    button2.innerHTML = 'Reiniciar';
    button2.addEventListener("click", onButtonPressed);

    button3.style.backgroundColor = 'Blue';
    button3.innerHTML = 'Você Venceu';
    button3.addEventListener("click", onButtonPressed);
});

function showSection(sectionId) {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.display = (section.id === sectionId) ? 'block' : 'none';
    });
}



loadColladaObject( ' ../assets/objects/stormtrooper/stormtrooper.dae');


function loadColladaObject( object)
{
    const loader = new ColladaLoader( loadingManager );
    loader.load( object, ( collada ) => {
        initLevel(levelNumber);
        render();
    } );
}
function startSpeedTimer(){
    timer = window.setInterval((e)=>{
        if(ballSpeed <=0.2){
            ballSpeed += 0.0067;
        }else{
            ballSpeed = 0.2
            window.clearInterval(timer)
        }

    }, 1000);
}

function onButtonPressed() {

    let activeSection = event.currentTarget.closest('section');
    /*
    if (activeSection.id === 'loading-screen') {
        showSection('game-screen')
    } else if (activeSection.id === 'restart-screen') {
        showSection('game-screen')
        restartGame();
    } else if (activeSection.id === 'win-screen') {
        showSection('game-screen')
        restartGame();
    }*/
    if (activeSection.id === 'loading-screen') {
        showSection('game-screen')
    } else {
        showSection('game-screen')
        restartGame();
    }

}

function load(manager, levelNumber){
    const loader = new ColladaLoader( manager );
    loader.load(levelNumber, (collada) => {
        initLevel(levelNumber);
    })
}

function onWindowResize(camera, renderer, frustumSize = 16) {
    let w = window.innerWidth;
    let h = window.innerHeight;
    let aspect = w / h;
    let f = frustumSize;
    if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = aspect;
    }
    if (camera instanceof THREE.OrthographicCamera) {
        camera.left = -f * aspect / 2;
        camera.right = f * aspect / 2;
        camera.top = f / 2;
        camera.bottom = -f / 2;
    }
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onMouseClick(event){
    if(event.button === 0 && gameStarted === false){
        level.shootBall(new THREE.Vector3(0,1,0))
        startGame(true);
        startSpeedTimer();
    }
}

function toggleFullScreenMode(){
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}

function keyboardUpdate() {

    keyboard.update();
    if (keyboard.down("R")) {
        restartGame();

    } else if (keyboard.down("space")) {
        pauseGame(!gamePaused);

    } else if (keyboard.down("enter")){
        toggleFullScreenMode();
    }
    else if(keyboard.down("G")){
        nextLevel();
    }
    else if(keyboard.down("O")){
        level.resetCamera();
        orbitControls.enabled = !orbitControls.enabled;
    }

}

function restartGame() {
    startGame(false);
    initLevel(levelNumber);
    ballSpeed = initialBallSpeed;
    window.clearInterval(timer)
}

function checkWinGame() {
    if(level.countTiles === level.getTotalTiles()){
        pauseGame(true);
    }
}

function checkGameOver(){
    //let ballPosition = level.ball.getPosition()

    if(ballPosition.y <= 0){
        startGame(false);
        /*let basePosition = level.base.getPosition();
        level.ball.setPosition(basePosition.x, basePosition.y + 0.01 + level.base.height / 2 + level.ball.radius, 0);
        level.ballSpeed = ballSpeed;*/
        level.resetBall();
        window.clearInterval(timer)
    }
}

function lifeOver(){
    startGame(false);
    level.resetBall();
    window.clearInterval(timer);
}

function gameOver() {
    startGame(false);
    level.resetBall();
    window.clearInterval(timer);
    showSection('restart-screen');
}


function winGame(){
    pauseGame(true);
    nextLevel();
    showSection('win-screen')
}


function pauseGame(status){
    gamePaused = status;
}

function startGame(status) {
    gameStarted = status;
    ballSpeed = initialBallSpeed;

}

function nextLevel() {
    levelNumber = levelNumber + 1;
    startGame(false);
    pauseGame(false);
    initLevel(levelNumber)
    window.clearInterval(timer)
}



function moveBaseToRaycasterXPosition() {
    let raycaster = new THREE.Raycaster()
    level.camera.updateMatrixWorld();
    raycaster.setFromCamera(mouse, level.camera);
    let v = new THREE.Vector3()

    var intersects = raycaster.intersectObject(level.backgroundPlane);
    let base = level.base;
    let baseWidth = base.width;

    if (intersects.length > 0) {
        let x = intersects[0].point.x;
        base.setPosition(x, 2.0, 0.0)
        if (x <= 0.50 + baseWidth/2) {
            //todo: tirar números mágicos
            base.setPosition(0.50 + baseWidth/2, 2.0, 0.0)
            //ball.setPosition(0.50 + baseWidth/2, 2.0, 0.0)
        } else if (x >= 9.25 - 0.5 - baseWidth/2) {
            base.setPosition(9.25 - 0.5 - baseWidth/2, 2.0, 0.0)
        }
    }
}

function sphereFollowBase(){
    /*let posVector = level.base.getPosition();
    level.ball.setPosition(posVector.x, posVector.y +  level.base.height/2 + level.ball.radius + 0.01, 0.0)
    level.ball.update()*/
    level.sphereFollowBase();
}


function initLevel(levelNumber) {
    scene = new THREE.Scene();
    const path = 'assets/textures/cube/Corona/corona';
    const format = '.png';
    const urls = [
        path + '_ft' + format, path + '_bk' + format,
        path + '_up' + format, path + '_dn' + format,
        path + '_rt' + format, path + '_lf' + format
    ];
// Setting the two cube maps, one for refraction and one for reflection
    let cubeMapTexture = new THREE.CubeTextureLoader().load( urls );

// Create the main scene and Set its background as a cubemap (using a CubeTexture)
    scene.background = cubeMapTexture;


    level = new Level(scene);

    /*
    const matrix = [
        [1, 0, 0, 0, 1, 1, 1],
        [1, 1, 0, 0, 0, 0, 0],
        [1, 1, 1, 0, 0, 0, 0],
        [1, 1, 1, 1, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1]
    ];*/

    //let matrix = obterMatrizPeloNivel(0)


    readLevel("levels.json", levelNumber, (data) => {
        let matrix = [];
        matrix = data;
        level.initTileMatrix(matrix);
        level.initLife(5);
    })


    level.initGameScene(scene);
    level.createBackgroundPlane(scene);
    level.initCamera(scene);
    level.initLight(scene);
    level.setOnLifeOver(lifeOver.bind(this));
    level.setOnGameOver(gameOver.bind(this));
    level.setOnWinGame(winGame.bind(this));

    orbitControls = new OrbitControls(level.camera, renderer.domElement );
    orbitControls.target = new THREE.Vector3(4.625, 8, 0);
    orbitControls.update()
    orbitControls.enabled = false;
    onWindowResize(level.camera, renderer);
}


//initLevel(levelNumber);
//render();

function render() {
    keyboardUpdate();
    infoBox.changeMessage("Speed: " +  ballSpeed.toFixed(2))

    if(!gameStarted){
        moveBaseToRaycasterXPosition();
        sphereFollowBase()
        //level.base.update();
        //level.ball.update();
        level.updateObjects()


    }else if(!gamePaused){
        moveBaseToRaycasterXPosition();
        //level.base.update();
        level.ballSpeed = ballSpeed;
        //level.ball.update();
        level.collisionManager.checkCollisions();
        level.updateObjects();
        //checkGameOver();
        //checkWinGame();
    }


    renderer.render(scene, level.camera); // Render scene
    requestAnimationFrame(render);
}
