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
import {CollisionManager} from "./collisionManager.js";
import {generateColor} from "./utils.js";

// Initial variables
let gamePaused = false;
let gameStarted = false;
var keyboard = new KeyboardState();
let scene = new THREE.Scene(); // Create main scene
let renderer = initRenderer(); // Init a basic renderer
let clock = new THREE.Clock()
clock.start()
//Camera variables
let orthoSize = 16;
let w = window.innerWidth;
let h = window.innerHeight
let aspect = w/h;
let near = 0.1;
let far = 1000;

// variables for create tile matrix
let tileMatrix = [];
let rowSize = 7;
let numRows = 5;
let tileWallStartX = 0.5;
let tileWallStarty = 12;
let tileWidth = 1.0;
let tileHeight = 0.5;
let sphereRadius = 0.2;
let baseStartPos = new THREE.Vector3(4.0, 2.0, 0.0)
let baseHeight = 0.5;
let baseWidth = 1.0;
let collisionManager = new CollisionManager();
let countTiles= 0;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

let camera = new THREE.OrthographicCamera(-orthoSize * aspect / 2, orthoSize * aspect / 2, // left, right
    orthoSize / 2, -orthoSize / 2,                  // top, bottom
    near, far);
camera.position.set(4, 8, 8.25)

let light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
camera.lookAt(4, 8, 0);
camera.updateProjectionMatrix();

window.addEventListener("mousemove", onMouseMove);
window.addEventListener("click", onMouseClick);

// create objects
let backgroundPlane = createBackgroundPlane();
let wallTop = new Wall(8, 0.5, 0.5, 4.0, 15.75, 0.0);
let wallLeft = new Wall(0.5, 16, 0.5, 0.25, 8.0, 0.0);
let wallRight = new Wall(0.5, 16, 0.5, 7.75, 8.0, 0.0);
let base = new Base(baseHeight, baseWidth, 0.5, baseStartPos.x, baseStartPos.y, baseStartPos.z)
let ball = new Ball(sphereRadius, baseStartPos.x, baseStartPos.y + 0.01 + baseHeight / 2 + sphereRadius, 0);

// add normal
wallTop.surfaceNormal = new THREE.Vector3(0, -1, 0);
wallLeft.surfaceNormal = new THREE.Vector3(-1,0,0);
wallRight.surfaceNormal = new THREE.Vector3(1,0,0)


// add objects scene
scene.add(backgroundPlane);
scene.add(wallLeft.getObject());
scene.add(wallRight.getObject());
scene.add(wallTop.getObject());
scene.add(base.getObject());
ball.scene = scene;
scene.add(ball.getObject());

// movimento inicial
ball.setMovement(new THREE.Vector3(0,0,0), 0);

//
var positionMessage = new SecondaryBox("");
positionMessage.changeStyle("rgba(0,0,0,0)", "lightgray", "16px", "ubuntu");


//register collidable
collisionManager.registerCollidable(wallLeft)
collisionManager.registerCollidable(wallTop)
collisionManager.registerCollidable(wallRight)
collisionManager.registerCollidable(base)
collisionManager.registerCollider(ball)


window.addEventListener(
    "resize",
    function () {
        onWindowResize(camera, renderer);
    },
    false
);

function createObjects(scene){}

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

function toggleFullScreenMode(){
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}

function resetTiles(){
    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < rowSize; j++) {
            tileMatrix[i][j].getObject().visible=true;
            tileMatrix[i][j].active=true;

        }
    }
}

function restartGame() {

    startGame(false);
    base.setPosition(baseStartPos.x, baseStartPos.y, baseStartPos.z);
    ball.setPosition(baseStartPos.x, baseStartPos.y + 0.01 + baseHeight / 2 + sphereRadius, 0);
    ball.movementSpeed = 0;
    countTiles = 0;
    resetTiles();
}

function pauseGame(status){
    gamePaused = status;
}

function startGame(status) {
    gameStarted = status;
}

function checkGameOver(){

    let ballPosition = ball.getPosition()

    if(ballPosition.y <= 0){
        startGame(false);
        let basePosition = base.getPosition();
        ball.setPosition(basePosition.x, basePosition.y + 0.01 + baseHeight / 2 + sphereRadius, 0);
        ball.movementSpeed = 0;
    }
}

function incrementCollisionCount(){
    countTiles++;
}

function checkWinGame() {
    let total = numRows * rowSize;

    if(countTiles === total){
        pauseGame(true);
    }
}

function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onMouseClick(event){
    if(event.button === 0 && gameStarted === false){
        ball.setMovement(new THREE.Vector3(0,1,0), 0.2)
        gameStarted = true;
    }
}

function moveBaseToRaycasterXPosition(scene, camera) {
    camera.updateMatrixWorld();
    raycaster.setFromCamera(mouse, camera);
    let v = new THREE.Vector3()

    var intersects = raycaster.intersectObject(backgroundPlane);

    if (intersects.length > 0) {
        let x = intersects[0].point.x;
        base.setPosition(x, 2.0, 0.0)
        if (x <= 0.50 + baseWidth/2) {
            //todo: tirar números mágicos
            base.setPosition(0.50 + baseWidth/2, 2.0, 0.0)
            //ball.setPosition(0.50 + baseWidth/2, 2.0, 0.0)
        } else if (x >= 8 - 0.5 - baseWidth/2) {
            base.setPosition(8 - 0.5 - baseWidth/2, 2.0, 0.0)
        }

    }
}

function sphereFollowBase(){
    let posVector = base.getPosition();
    ball.setPosition(posVector.x, posVector.y + baseHeight/2 + sphereRadius + 0.01, 0.0)
    ball.update()
}

function createBackgroundPlane() {
    let planeGeometry = new THREE.PlaneGeometry(8, 16, 20, 20);
    let planeMaterial = new THREE.MeshLambertMaterial({
        color: "rgb(0,255,255)",
    });
    planeMaterial.side = THREE.DoubleSide;
    planeMaterial.transparent = true;
    planeMaterial.opacity = 1.0;

    let backgroundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    backgroundPlane.position.set(4, 8, 0);
    return backgroundPlane;
}

function renderTiles() {
    let offsetx = 1.0;
    let offsety = 0.5;

    for (let i = 0; i < numRows; i++) {
        let row = [];
        for (let j = 0; j < rowSize; j++) {
            let tile = new Tile(tileWidth, tileHeight, 0.5, tileWallStartX + tileWidth / 2 + j * tileWidth, tileWallStarty + tileHeight / 2 + i * tileHeight, 0, generateColor())
            tile.setOnCollide(incrementCollisionCount)
            tile.scene = scene;
            scene.add(tile.getObject() );
            //scene.add(tile.getHelper());
            row.push(tile)
            collisionManager.registerCollidable(tile)
        }
        tileMatrix.push(row)
    }
}

function updatePositionMessage(text) {
    var str = text;
    positionMessage.changeMessage(str);
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

}

renderTiles();
createBackgroundPlane();
render();

function render() {
    keyboardUpdate();
    if(!gameStarted){
        moveBaseToRaycasterXPosition(scene, camera);
        sphereFollowBase();
        ball.update();
        base.update();
    }else if(!gamePaused){
        //updatePositionMessage();
        ball.update();
        moveBaseToRaycasterXPosition(scene, camera);
        base.update();
        collisionManager.checkCollisions();
        checkWinGame();
        checkGameOver()
    }


    requestAnimationFrame(render);
    renderer.render(scene, camera); // Render scene
}
