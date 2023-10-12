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


let camera = new THREE.OrthographicCamera(-orthoSize * aspect / 2, orthoSize * aspect / 2, // left, right
    orthoSize / 2, -orthoSize / 2,                  // top, bottom
    near, far);
camera.position.set(4, 8, 8.25)

let material = setDefaultMaterial(); // create a basic material
let light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
camera.lookAt(4, 8, 0);
camera.updateProjectionMatrix();

// Listen window size changes
window.addEventListener(
    "resize",
    function () {
        onWindowResize(camera, renderer);
    },
    false
);

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

window.addEventListener("mousemove", onMouseMove);
window.addEventListener("click", onMouseClick);


// create objects
let backgroundPlane = createBackgroundPlane();
scene.add(backgroundPlane);

let baseGeometry = new THREE.BoxGeometry(baseWidth, 0.5, 0.5);
let sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 16);

//// ----------------------- ////
let wallTop = new Wall(8, 0.5, 0.5, 4.0, 15.75, 0.0)
wallTop.surfaceNormal = new THREE.Vector3(0, -1, 0);
let wallLeft = new Wall(0.5, 16, 0.5, 0.25, 8.0, 0.0);
wallLeft.surfaceNormal = new THREE.Vector3(-1,0,0)
let wallRight = new Wall(0.5, 16, 0.5, 7.75, 8.0, 0.0);
wallRight.surfaceNormal = new THREE.Vector3(1,0,0)

scene.add(wallLeft.getObject());
scene.add(wallRight.getObject());
scene.add(wallTop.getObject());
scene.add(wallRight.getHelper())
scene.add(wallLeft.getHelper())
scene.add(wallTop.getHelper())

let sphereBox = new THREE.Mesh(sphereGeometry, material);
let base = new Base(baseHeight, baseWidth, 0.5, baseStartPos.x, baseStartPos.y, baseStartPos.z)
scene.add(base.getObject())


collisionManager.registerCollidable(wallLeft)
collisionManager.registerCollidable(wallTop)
collisionManager.registerCollidable(wallRight)
collisionManager.registerCollidable(base)

let ball = new Ball(sphereRadius, baseStartPos.x, baseStartPos.y + 0.01 + baseHeight / 2 + sphereRadius, 0)
ball.scene = scene;
scene.add(ball.getObject());
scene.add(ball.getHelper())
ball.setMovement(new THREE.Vector3(0,0,0), 0);


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

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

var positionMessage = new SecondaryBox("");
positionMessage.changeStyle("rgba(0,0,0,0)", "lightgray", "16px", "ubuntu");

let sphereMovement = new Movement(0.05, new THREE.Vector3(0.0, 0.0, 0.0));


collisionManager.registerCollider(ball)



function renderTiles() {
    let offsetx = 1.0;
    let offsety = 0.5;

     for (let i = 0; i < numRows; i++) {
         let row = [];
         for (let j = 0; j < rowSize; j++) {
             let tile = new Tile(tileWidth, tileHeight, 0.5, tileWallStartX + tileWidth / 2 + j * tileWidth, tileWallStarty + tileHeight / 2 + i * tileHeight, 0, generateColor())
             tile.scene = scene;
             scene.add(tile.getObject() );
             scene.add(tile.getHelper());
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


function createTile(x, y, z, color) {
    // create tile
    let boxGeometry = new THREE.BoxGeometry(1, 0.5, 0.5);
    let tile = new THREE.Mesh(boxGeometry, setDefaultMaterial(color));

    // position the tile
    tile.position.set(x, y, z);

    return tile;
}

/*
function keyboardUpdate() {

    keyboard.update();
    if (keyboard.down("R")) {
        gamePaused = true;
        gameStarted = false;
        restartGame();
    } else if (keyboard.down("space")) {

        if(gameStarted){
            gamePaused = !gamePaused;
        }

    } else if (keyboard.down("enter")){
        toggleFullScreenMode();
    }

}*/

function keyboardUpdate() {

    keyboard.update();
    if (keyboard.down("R")) {
        //gamePaused = true;rrrrrrrrrrr
        //gameStarted = false;
        restartGame();

    } else if (keyboard.down("space")) {
        pauseGame(!gamePaused);
/*
        if(gameStarted){
            gamePaused = !gamePaused;
        }
*/
    } else if (keyboard.down("enter")){
        toggleFullScreenMode();
    }

}


function toggleFullScreenMode(){
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}



function checkCollisions(object) {
    let collisionBase = bbBase.intersectsBox(object);
    //let collisionLeft = bbLeftBox.intersectsBox(object);
    //let collisionRight = bbRightBox.intersectsBox(object);
    //let collisionTop = bbTopBox.intersectsBox(object);


    if (collisionBase) {

        let vet1 = new THREE.Vector3(0.87, 0.5, 0);
        let vet2 = new THREE.Vector3(0.5, 0.87, 0);
        let vet3 = new THREE.Vector3(0, 1, 0);
        let vet4 = new THREE.Vector3(-0.5, 0.87, 0);
        let vet5 = new THREE.Vector3(-0.87, 0.5, 0);

        let spherePos = new THREE.Vector3();
        sphereBox.getWorldPosition(spherePos);
        let basePos = new THREE.Vector3();
        base.getWorldPosition(basePos);

        let relativePosX = spherePos.x - basePos.x;
        let normal;
        let limit =  Math.PI/2;

        if (relativePosX <= -1.0 - sphereRadius) {
            normal = new THREE.Vector3(-1, 0, 0)
            limit = null;

        } else if (relativePosX <= -0.6) {
            normal = vet5;
        } else if (relativePosX <= -0.2) {
            normal = vet4;

        } else if (relativePosX <= 0.2) {
            normal = vet3;

        } else if (relativePosX <= 0.6) {
            normal = vet2;

        } else if (relativePosX < 1.0) {
            normal = vet1;

        } else if (relativePosX => 1.0 + sphereRadius) {
            normal = new THREE.Vector3(1, 0, 0)
            limit = null;
        }
        reflectSphere(normal, limit);
    } else if (collisionLeft) {
        reflectSphere(new THREE.Vector3(1, 0, 0));
    } else if (collisionRight) {
        reflectSphere(new THREE.Vector3(-1, 0, 0));
    } else if (collisionTop) {
        reflectSphere(new THREE.Vector3(0, -1, 0));
    }
}



function resetTiles(){
    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < rowSize; j++) {
            tileMatrix[i][j].object.visible=true;
            tileMatrix[i][j].active=true;

        }
    }
}

function restartGame() {

    //pauseGame(!gamePaused);
    startGame(false);
    //base.matrixAutoUpdate = true;
    //sphereBox.matrixAutoUpdate = true;
    //base.setPosition(0, 0, 0);
    base.setPosition(baseStartPos.x, baseStartPos.y, baseStartPos.z);
    ball.setPosition(baseStartPos.x, baseStartPos.y + 0.01 + baseHeight / 2 + sphereRadius, 0);
    sphereMovement.vector = new THREE.Vector3(0, 0, 0);
    countTiles = 0;
    resetTiles();
    //updateHelpers();
}


function pauseGame(status){
    gamePaused = status;
}

function startGame(status) {
    gameStarted = status;
}


function getTileByPosition(x, y) {
    let coll = Math.floor((x - tileWallStartX) / tileWidth);
    let row = Math.floor((y - tileWallStarty) / tileHeight);

    return [coll, row];
}

// Game logic
function checkGameOver(){
    let spherePos = new THREE.Vector3();
    sphereBox.getWorldPosition(spherePos);
    let sphereY = spherePos.y;

    if(sphereY <= 0){
        gameStarted = false;
        sphereMovement.vector = new THREE.Vector3(0, 0, 0);
    }
}

function checkWinGame() {
    let total = numRows * rowSize;

    if(countTiles === total){
        gamePaused = true;
    }
}

function checkTileCollision() {
    let spherePos = new THREE.Vector3();
    sphereBox.getWorldPosition(spherePos);
    let sphereX = spherePos.x;
    let sphereY = spherePos.y;

    if (
        sphereY >= tileWallStarty - sphereRadius &&
        sphereY <= tileWallStarty + tileHeight * numRows - sphereRadius &&
        sphereX >= tileWallStartX - sphereRadius &&
        sphereX <= tileWallStartX + tileWidth * rowSize - sphereRadius
    ) {
        let tilePosInMatrix = getTileByPosition(sphereX + sphereRadius, sphereY + sphereRadius);
        let collidedTile = tileMatrix[tilePosInMatrix[1]][tilePosInMatrix[0]];

        let tilePosWorld = new THREE.Vector3();
        collidedTile.object.getWorldPosition(tilePosWorld);

        if (collidedTile.active) {
            collidedTile.active = false;
            collidedTile.object.visible = false;
            // Increment count
            countTiles++

            if(sphereY < tilePosWorld.y - tileHeight/2){
                reflectSphere(new THREE.Vector3(0, -1, 0), null);
            } if(sphereY > tilePosWorld.y + tileHeight/2){
                reflectSphere(new THREE.Vector3(0, 1, 0), null);
            }
            else if (sphereX < tilePosWorld.x - tileWidth/2){
                reflectSphere(new THREE.Vector3(-1, 0, 0), null);
            }
            else if (sphereX > tilePosWorld.x + tileWidth/2){
                reflectSphere(new THREE.Vector3(1, 0, 0), null);
            }

        }

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

//Movimentation
function moveBaseToRaycasterXPosition(scene, camera) {
    camera.updateMatrixWorld();
    raycaster.setFromCamera(mouse, camera);
    let v = new THREE.Vector3()

    var intersects = raycaster.intersectObject(backgroundPlane);

    if (intersects.length > 0) {
        let x = intersects[0].point.x;
        base.setPosition(x, 2.0, 0.0)
        //ball.setPosition(x, 2.0, 0.0)
        if (x <= 0.50 + baseWidth/2) {
            //todo: tirar números mágicos
            base.setPosition(0.50 + baseWidth/2, 2.0, 0.0)
            //ball.setPosition(0.50 + baseWidth/2, 2.0, 0.0)
        } else if (x >= 8 - 0.5 - 1) {
            base.setPosition(8 - 0.5 - baseWidth/2, 2.0, 0.0)
            //base.setPosition(8 - 0.5 - baseWidth/2, 2.0, 0.0)
        }

    }
}
function Movement(speed, direction) {
    this.speed = speed;
    this.vector = direction;
}
function moveSphere() {

    let posVector = new THREE.Vector3();
    sphereBox.getWorldPosition(posVector);
    let sphereX = posVector.x;
    let sphereY = posVector.y;

    const xAmount = (sphereMovement.speed) * sphereMovement.vector.x;
    const yAmount = (sphereMovement.speed) * sphereMovement.vector.y;

    sphereBox.matrixAutoUpdate = false;

    var mat4 = new THREE.Matrix4();
    sphereBox.matrix.identity(); // reset matrix

    sphereBox.matrix.multiply(
        mat4.makeTranslation(sphereX + xAmount, sphereY + yAmount, 0.0)
    );


}
function reflectSphere(normal, limit) {
    let newDirection = sphereMovement.vector.reflect(normal);

    let j = new THREE.Vector3(0, 1, 0);
    let angleToJ = newDirection.angleTo(j);
    let rotationAmount = angleToJ - limit +Math.PI/10;
    let xDirection = newDirection.x < 0? -1 : 1;


    if (limit != null && angleToJ >= limit) {
          newDirection = newDirection.applyAxisAngle(new THREE.Vector3(0, 0, 1), xDirection* rotationAmount);
    }

    sphereMovement.vector = newDirection;
    ball.setMovement(sphereMovement.vector, sphereMovement.speed)
}
function radToDeg(rad) {
    return rad * (180.0 / Math.PI);
}
function sphereFollowBase(){
    let posVector = base.getPosition();
    //base.getObject().matrixAutoUpdate=true;


    ball.setPosition(posVector.x, posVector.y + baseHeight/2 + sphereRadius + 0.01, 0.0)
    ball.update()

    console.log(posVector)
    console.log(ball.getPosition())


}

/*let boxGeometry = new THREE.BoxGeometry(5, 3, 3);
let box = new THREE.Mesh(boxGeometry, new THREE.MeshLambertMaterial({color:"rgb(255,0,221)"}));
box.rotateY(10)
box.rotateZ(10)
box.position.set(5, 5, 5)

let bbBox = new THREE.Box3().setFromObject(box);
bbBox.setFromObject(box);
let helper = new THREE.Box3Helper(bbBox, 'white' );


scene.add(box)
scene.add(helper)*/
renderTiles();
createBackgroundPlane();
/*
function animate() {
    requestAnimationFrame( animate );
   // updatePlayer();
    render();
}
*/
render();


function render() {
    keyboardUpdate();


    if(gamePaused){

    }else {
        //updatePositionMessage();
        ball.update();
        collisionManager.checkCollisions();
        moveBaseToRaycasterXPosition(scene, camera);
        checkWinGame();
    }


    /*
    if (!gamePaused) {
        updatePositionMessage();
        ball.update();
        collisionManager.checkCollisions();
        moveBaseToRaycasterXPosition(scene, camera);
        checkWinGame();
    }*/

    if(!gameStarted){

        moveBaseToRaycasterXPosition(scene, camera);
        sphereFollowBase();
    }

    requestAnimationFrame(render);
    renderer.render(scene, camera); // Render scene
}
