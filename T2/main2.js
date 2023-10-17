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
import {Level, Level2} from "./level.js";
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

window.addEventListener("mousemove", onMouseMove);
window.addEventListener("click", onMouseClick);


function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onMouseClick(event){
    if(event.button === 0 && gameStarted === false){
        level.ball.setMovement(new THREE.Vector3(0,1,0), 0.2)
        gameStarted = true;
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
    else if("G"){

    }

}

function restartGame() {

    startGame(false);
    level.restartLevel();
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
        level.ball.movementSpeed = 0;
    }
}

function pauseGame(status){
    gamePaused = status;
}

function startGame(status) {
    gameStarted = status;
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

    if(levelNumber === 1){
        level = new Level2(scene);
    }


    /*
    const matrix = [
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 0, 0, 0, 0, 0],
        [1, 1, 1, 0, 0, 0, 0],
        [1, 1, 1, 1, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1]
    ];*/

    //let matrix = obterMatrizPeloNivel(0)


    lerArquivoJSON("matrixLevel.json", 2, (data) => {
        let matrix = [];
        matrix = data;
        level.initTileMatrix(matrix);
    })






    level.initGameScene(scene);
    level.createObjects(scene);
    level.createBackgroundPlane(scene);
    level.initCamera(scene);
    level.initLight(scene);
}


initLevel(1);
render();

function render() {
    keyboardUpdate();

    if(!gameStarted){
        moveBaseToRaycasterXPosition();
        level.base.update();
        sphereFollowBase()
        level.ball.update();

    }else if(!gamePaused){
        moveBaseToRaycasterXPosition();
        level.base.update();
        level.ball.update();
        level.collisionManager.checkCollisions();
        checkGameOver();
        checkWinGame();
    }

    requestAnimationFrame(render);
    renderer.render(scene, level.camera); // Render scene
}
