import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer,
    initCamera,
    initDefaultBasicLight,
    setDefaultMaterial,
    InfoBox,
    onWindowResize,
    createGroundPlaneXZ} from "../libs/util/util.js";

let scene, renderer, camera, material, light, orbit; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );
window.addEventListener('mousemove', onMouseMove);

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// create the ground plane
let plane = createGroundPlaneXZ(20, 20)
scene.add(plane);

// create objects
let leftBoxGeometry = new THREE.BoxGeometry(0.5, 16, 0.5);
let rightBoxGeometry = new THREE.BoxGeometry(0.5, 16, 0.5);
let topBoxGeometry = new THREE.BoxGeometry(8, 0.5, 0.5);
let baseGeometry = new THREE.BoxGeometry(2, 0.5, 0.5);
let sphereGeometry = new THREE.SphereGeometry(0.2, 32, 16)

let leftBox = new THREE.Mesh(leftBoxGeometry, material);
let rightBox = new THREE.Mesh(rightBoxGeometry, material);
let topBox = new THREE.Mesh(topBoxGeometry, material);
let base = new THREE.Mesh(baseGeometry, material);
let sphereBox = new THREE.Mesh(sphereGeometry, material)

// position the cube
leftBox.position.set(0.25, 8.0, 0.0);
rightBox.position.set(7.75, 8.0, 0.0);
topBox.position.set(4.0, 16, 0.0);
base.position.set(3.0, 2, 0);
sphereBox.position.set(1.0, 5, 0);
// add the cube to the scene
scene.add(leftBox);
scene.add(rightBox);
scene.add(topBox);
scene.add(sphereBox)
scene.add(base);

// Use this to show information onscreen
let controls = new InfoBox();
controls.add("Basic Scene");
controls.addParagraph();
controls.add("Use mouse to interact:");
controls.add("* Left button to rotate");
controls.add("* Right button to translate (pan)");
controls.add("* Scroll to zoom in/out.");
controls.show();

let tileMatrix=[];
let rowSize = 7;
let numRows = 5;
for (let i=0; i<numRows; i++){
    tileMatrix.push(new Array(rowSize).fill(1))
}

tileMatrix[0][5] =0;
tileMatrix[1][2] =0;
//tileMatrix[1][3] =0;
tileMatrix[0][6] =0;
console.log(tileMatrix)


function generatedColor(){
}

function createTile(x, y, z, color){
    // create box
    let boxGeometry = new THREE.BoxGeometry(1, 0.5, 0.5);
    let box = new THREE.Mesh(boxGeometry, setDefaultMaterial(color));

    // position the box
    box.position.set(x, y, z);

    // add the cube to the scene
    scene.add(box);
}

function colorGenerated(){
    let colorPalette = ["rgb(0,255,100)", "rgb(255,0,255)", "rgb(255,255, 0)", "rgb(255,0,0)"]
    return colorPalette[Math.floor(Math.random() * (colorPalette.length))]
}

function renderTiles(){
    let offsetx = 1.0;
    let offsety=0.5;

    for(let i=0; i<numRows; i++){
        for(let j=0; j<rowSize; j++){
            if(tileMatrix[i][j] == 1){
                createTile(1+j*offsetx, 12+i*offsety, 0, colorGenerated())
            }
        }
    }
}

renderTiles();
function onMouseMove(event)
{
    //leftBox.changeMessage("Intersection: None");
    //intersectionSphere.visible = false;
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    let pointer = new THREE.Vector2();
    pointer.x =  (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    base.position.set(pointer.x, 2.0, 0.0);
    //console.log(pointer)
};


function createBackgroundPlane(){
    let planeGeometry = new THREE.PlaneGeometry(8, 16, 20, 20);
    let planeMaterial = new THREE.MeshLambertMaterial({ color: "rgb(0,255,255)" });
    planeMaterial.side = THREE.DoubleSide;
    planeMaterial.transparent = true;
    planeMaterial.opacity = 1.0;

    let backgroundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    backgroundPlane.position.set(4, 8, 0);
    scene.add(backgroundPlane);
}

createBackgroundPlane();
render();
function render()
{
    requestAnimationFrame(render);
    renderer.render(scene, camera) // Render scene
}