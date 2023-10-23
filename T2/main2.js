import * as THREE from "three";
import {OrbitControls} from "../build/jsm/controls/OrbitControls.js";
import {
    initRenderer,
    initDefaultBasicLight,
    setDefaultMaterial,
    SecondaryBox,
} from "../libs/util/util.js";
import KeyboardState from "../libs/util/KeyboardState.js";
import {Ball, Base, Wall, Tile} from "./components.js";
import {Level} from "./level.js";
import {CollisionManager} from "./collisionManager.js";
import {generateColor, lerArquivoJSON, obterMatrizPeloNivel} from "./utils.js";

// Initial variables
let gamePaused = false;
let gameStarted = false;
var keyboard = new KeyboardState();
let scene; // Create main scene
let renderer = initRenderer(); // Init a basic renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;

let level;
let mouse = new THREE.Vector2();
let levelNumber= 1;
let initialBallSpeed = 0.05;
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

function startSpeedTimer(){
    timer = window.setInterval((e)=>{
        if(ballSpeed <=0.2){
            ballSpeed += 0.0013
        }else{
            ballSpeed = 0.2
            window.clearInterval(timer)
        }

    }, 100);
}


function onWindowResize(camera, renderer, frustumSize = 16) {
    let w = window.innerWidth;
    let h = window.innerHeight
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

    let ballPosition = level.ball.getPosition()

    if(ballPosition.y <= 0){
        startGame(false);
        let basePosition = level.base.getPosition();
        level.ball.setPosition(basePosition.x, basePosition.y + 0.01 + level.base.height / 2 + level.ball.radius, 0);
        level.ballSpeed = ballSpeed;
        window.clearInterval(timer)

    }
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
    let posVector = level.base.getPosition();
    level.ball.setPosition(posVector.x, posVector.y +  level.base.height/2 + level.ball.radius + 0.01, 0.0)
    level.ball.update()
}


function initLevel(levelNumber) {
    scene = new THREE.Scene();

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


    lerArquivoJSON("matrixLevel.json", levelNumber, (data) => {
        let matrix = [];
        matrix = data;
        level.initTileMatrix(matrix);
    })


    level.initGameScene(scene);
    level.createObjects(scene);
    level.createBackgroundPlane(scene);
    level.initCamera(scene);
    level.initLight(scene);
    onWindowResize(level.camera, renderer);
}



initLevel(levelNumber);
render();

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
        checkGameOver();
        checkWinGame();
    }

    requestAnimationFrame(render);
    renderer.render(scene, level.camera); // Render scene

}
