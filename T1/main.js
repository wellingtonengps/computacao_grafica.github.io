import * as THREE from "three";
import { OrbitControls } from "../build/jsm/controls/OrbitControls.js";
import {
  initRenderer,
  initCamera,
  initDefaultBasicLight,
  setDefaultMaterial,
  InfoBox,
  onWindowResize,
  createGroundPlaneXZ,
  SecondaryBox,
} from "../libs/util/util.js";
import KeyboardState from "../libs/util/KeyboardState.js";

let scene, renderer, camera, material, light, orbit; // Initial variables
let gamePaused = true;
var keyboard = new KeyboardState();
scene = new THREE.Scene(); // Create main scene
renderer = initRenderer(); // Init a basic renderer
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000); // Init camera in this position
camera.position.set(4, 8, 8.25)
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls(camera, renderer.domElement); // Enable mouse rotation, pan, zoom etc.
camera.lookAt(4, 8, 0);
camera.fov = 90;
camera.updateProjectionMatrix();

// Listen window size changes
window.addEventListener(
  "resize",
  function () {
    onWindowResize(camera, renderer);
  },
  false
);
window.addEventListener("mousemove", onMouseMove);

let tileMatrix = [];
let rowSize = 7;
let numRows = 5;
let tileWallStartX = 0.5 ;
let tileWallStarty = 12;
let tileWidth = 1.0;
let tileHeight = 0.5;
let sphereRadius = 0.2;
let baseStartPos = new THREE.Vector3(4.0,2.0,0.0)
let baseHeight = 0.5;

/*
let asset = {
  object: null,
  bb: new THREE.Box3()
}

let assetHelper = createBBHelper(asset.bb, 'yellow')
*/

function createBBHelper(bb, color)
{
  // Create a bounding box helper
  let helper = new THREE.Box3Helper( bb, color );
  scene.add( helper );
  return helper;
}

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper(12);
scene.add(axesHelper);

// create the ground plane
let plane = createGroundPlaneXZ(20, 20);
scene.add(plane);

// create objects
let backgroundPlane =  createBackgroundPlane();
scene.add(backgroundPlane);
let leftBoxGeometry = new THREE.BoxGeometry(0.5, 16, 0.5);
let rightBoxGeometry = new THREE.BoxGeometry(0.5, 16, 0.5);
let topBoxGeometry = new THREE.BoxGeometry(8, 0.5, 0.5);
let baseGeometry = new THREE.BoxGeometry(2, 0.5, 0.5);
let sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 16);

let leftBox = new THREE.Mesh(leftBoxGeometry, material);
let rightBox = new THREE.Mesh(rightBoxGeometry, material);
let topBox = new THREE.Mesh(topBoxGeometry, material);
let base = new THREE.Mesh(baseGeometry, material);
let sphereBox = new THREE.Mesh(sphereGeometry, material);

let bbLeftBox = new THREE.Box3().setFromObject(leftBox);
createBBHelper(bbLeftBox,'white');

let bbRightBox = new THREE.Box3().setFromObject(rightBox);
createBBHelper(bbRightBox,'white');

let bbTopBox = new THREE.Box3().setFromObject(topBox);
createBBHelper(bbTopBox,'white');

let bbBase = new THREE.Box3().setFromObject(base);
createBBHelper(bbBase,'white');

let bbSphere = new THREE.Box3().setFromObject(sphereBox);
createBBHelper(bbSphere,'white');

function keyboardUpdate() {

  keyboard.update();
  // Keyboard.down - execute only once per key pressed
  if ( keyboard.down("R") ){
    console.log("R")
    gamePaused = true;
    restartGame();
  }

  else if(keyboard.down("space")){
    gamePaused = !gamePaused;
  }


}

function checkCollisions(object)
{
  let collisionBase = bbBase.intersectsBox(object);
  let collisionLeft = bbLeftBox.intersectsBox(object);
  let collisionRight = bbRightBox.intersectsBox(object);
  let collisionTop = bbTopBox.intersectsBox(object);


  if(collisionBase ){

    let vet1 = new THREE.Vector3(0.15, -0.98, 0);
    let vet2 = new THREE.Vector3(-0.95, -0.30, 0);
    let vet3 = new THREE.Vector3(0,1,0);
    let vet4 = new THREE.Vector3(0.95, -0.30, 0);
    let vet5 = new THREE.Vector3(-0.15, -0.98, 0);

    let vet6 = new THREE.Vector3();
    let vet7 = new THREE.Vector3();


    let spherePos = new THREE.Vector3();
    sphereBox.getWorldPosition(spherePos);
    let basePos = new THREE.Vector3();
    base.getWorldPosition(basePos);

    let relativePosX = spherePos.x - basePos.x;
    let normal;

    console.log(relativePosX)

    if(relativePosX <= -1.0){
      normal = new THREE.Vector3(-1, 0, 0)
    }
    else if(relativePosX <=-0.6){
      normal = vet5;
    }else if(relativePosX <= -0.2){
      normal = vet4;
    }else if(relativePosX <= 0.2){
      normal = vet3;
    }else if(relativePosX <= 0.6){
      normal = vet2;
    }else if(relativePosX <= 1.0){
      normal = vet1;
    }
    else if(relativePosX > 1.0){
      normal = new THREE.Vector3(1, 0, 0)

    }


    console.log(relativePosX)
    console.log("Base collision detected")
    reflectSphere(normal);
  }
  else if(collisionLeft){
    console.log("Left collision detected")
    reflectSphere(new THREE.Vector3(1,0,0));
  }
  else if(collisionRight){
    console.log("Right collision detected")
    reflectSphere(new THREE.Vector3(-1,0,0));
  }
  else if(collisionTop){
    console.log("Top collision detected")
    reflectSphere(new THREE.Vector3(0,-1,0));
  }
}

function updateAsset()
{
  bbBase.setFromObject(base);
  bbSphere.setFromObject(sphereBox);
  bbLeftBox.setFromObject(leftBox);
  bbRightBox.setFromObject(rightBox);
  bbTopBox.setFromObject(topBox)
}

// position the cube
leftBox.position.set(0.25, 8.0, 0.0);
rightBox.position.set(7.75, 8.0, 0.0);
topBox.position.set(4.0, 16, 0.0);
base.position.set(baseStartPos.x, baseStartPos.y, baseStartPos.z);
sphereBox.position.set(baseStartPos.x,  baseStartPos.y + 0.01 + baseHeight/2 + sphereRadius, 0);
// add the cube to the scene
scene.add(leftBox);
scene.add(rightBox);
scene.add(topBox);
scene.add(sphereBox);
scene.add(base);

// Use this to show information onscreen
let controls = new InfoBox();
controls.add("Use mouse to interact:");
controls.add("* Left button to rotate");
controls.add("* Right button to translate (pan)");
controls.add("* Scroll to zoom in/out.");
controls.show();

var positionMessage = new SecondaryBox("");
positionMessage.changeStyle("rgba(0,0,0,0)", "lightgray", "16px", "ubuntu");

function updatePositionMessage(text) {
  var str = text;
  positionMessage.changeMessage(str);
}

for (let i = 0; i < numRows; i++) {
  let row = [];
  for (let j = 0; j < rowSize; j++) {
    row.push(new Tile(generateColor()));
  }
  tileMatrix.push(row);
}

//tileMatrix[0][5].active = false;
//tileMatrix[1][2].active = false;
//tileMatrix[1][3].active =false;
//tileMatrix[0][6].active = false;
console.log(tileMatrix);

function Tile(color) {
  this.color = color;
  this.active = true;
  this.object = null;
}
function createTile(x, y, z, color) {
  // create box
  let boxGeometry = new THREE.BoxGeometry(1, 0.5, 0.5);
  let box = new THREE.Mesh(boxGeometry, setDefaultMaterial(color));

  // position the box
  box.position.set(x, y, z);

  // add the cube to the scene
  return box;
  //scene.add(box);
}


function generateColor() {
  let colorPalette = [
    "rgb(0,255,100)",
    "rgb(255,0,255)",
    "rgb(255,255, 0)",
    "rgb(255,0,0)",
  ];
  return colorPalette[Math.floor(Math.random() * colorPalette.length)];
}

function restartGame(){
  base.matrixAutoUpdate = true;
  sphereBox.matrixAutoUpdate=true;
  base.position.set(baseStartPos.x, baseStartPos.y, baseStartPos.z);
  sphereBox.position.set(baseStartPos.x,  baseStartPos.y + baseHeight/2 + sphereRadius, 0);
  sphereMovement.vector = new THREE.Vector3(0,1,0)
  updateAsset();
}

function renderTiles() {
  let offsetx =1.0;
  let offsety = 0.5;

  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < rowSize; j++) {
     // if (tileMatrix[i][j].active) {
        let tile = createTile(tileWallStartX + tileWidth/2+ j * tileWidth, tileWallStarty + tileHeight /2+ i * tileHeight, 0, tileMatrix[i][j].color);
        scene.add(tile);
        tileMatrix[i][j].object = tile;
     // }
    }
  }
}

function getTileByPosition(x, y) {
  let coll = Math.floor((x - tileWallStartX)/ tileWidth);
  let row = Math.floor((y - tileWallStarty ) / tileHeight);

  //console.log("row: " + row + ", " + "col: " + coll);

  return [coll, row];
}

/*
function baseCollision() {
  let posVectorBase = new THREE.Vector3();
  base.getWorldPosition(posVectorBase);

  let posVectorSphere = new THREE.Vector3();
  sphereBox.getWorldPosition(posVectorSphere);

  let baseX = posVectorBase.x;
  let baseY = posVectorBase.y;


  let sphereX = posVectorSphere.x;
  let sphereY = posVectorSphere.y;

  if((sphereY <=  baseY) && ((sphereX >= (baseX - 1)) && sphereX <= (baseX + 1))){
    console.log("bateu");
    reflectSphere(new THREE.Vector3(0, 1, 0));
  }
}*/

function tileCollision() {
  let posVector = new THREE.Vector3();
  sphereBox.getWorldPosition(posVector);
  let sphereX = posVector.x;
  let sphereY = posVector.y;

  //console.log("x :" + sphereX + " y: " + sphereY);
  updatePositionMessage(
    "{" + sphereX.toFixed(2) + ", " + sphereY.toFixed(2) + "}"
  );

  if (
    sphereY >= tileWallStarty -sphereRadius &&
    sphereY <= tileWallStarty + tileHeight* numRows - sphereRadius  &&
    sphereX >= tileWallStartX -sphereRadius &&
    sphereX <= tileWallStartX + tileWidth * rowSize - sphereRadius
  ) {
    //console.log("x :" + sphereX + " y: " + sphereY);
    //console.log(getTileByPosition(sphereX, sphereY));
    let tilePos = getTileByPosition(sphereX + sphereRadius, sphereY + sphereRadius);
    console.log(tilePos[1]+", "+tilePos[0]);

    if(tileMatrix[tilePos[1]][tilePos[0]].active){
      tileMatrix[tilePos[1]][tilePos[0]].active = false;
      tileMatrix[tilePos[1]][tilePos[0]].object.visible = false;
      reflectSphere(new THREE.Vector3(0, -1, 0));
    }

  }
}

renderTiles();

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
function onMouseMove(event) {
  //leftBox.changeMessage("Intersection: None");
  //intersectionSphere.visible = false;
  // calculate pointer position in normalized device coordinates
  // (-1 to +1) for both components
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;



 // let pointer = new THREE.Vector2();
  //pointer.x = (event.clientX / window.innerWidth) * 5 + 1.5;
  //pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  //base.position.set(pointer.x, 2.0, 0.0);
  //console.log(pointer)
}

function moveBaseToRaycasterXPosition(scene, camera) {
  camera.updateMatrixWorld();
  raycaster.setFromCamera(mouse, camera);
  let v = new THREE.Vector3()

  var intersects = raycaster.intersectObject(backgroundPlane);

  if (intersects.length > 0) {
    let x = intersects[0].point.x;
  //  console.log(x)
    base.position.set(x, 2.0, 0.0)
    if(x<= 0.50 + 1){
      //todo: tirar números mágicos
      base.position.set(0.50 + 1, 2.0, 0.0)
    }
    else if(x >= 8 -0.5-1){
      base.position.set(8 -0.5-1, 2.0, 0.0)
    }

  }

}
function Movement(speed, direction) {
  this.speed =speed;
  this.vector = direction;
}

function reflectSphere(normal) {
    //let normal = new THREE.Vector3(0, -1, 0);
    sphereMovement.vector =  sphereMovement.vector.reflect(normal);
}

let sphereMovement =  new Movement(0.2, new THREE.Vector3(0.0, 1, 0.0));

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

createBackgroundPlane();
render();
function render() {
  keyboardUpdate();

  if(!gamePaused){
    updatePositionMessage();
    moveSphere();
    updateAsset();
    checkCollisions(bbSphere);
    tileCollision();
    moveBaseToRaycasterXPosition(scene, camera);
  }
  requestAnimationFrame(render);
  renderer.render(scene, camera); // Render scene
}

//10.5.190.118
