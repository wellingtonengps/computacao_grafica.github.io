import * as THREE from  'three';
import GUI from '../libs/util/dat.gui.module.js'
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import {InfoBox,
        createGroundPlane,
        createLightSphere,        
        onWindowResize} from "../libs/util/util.js";
import {CSG} from "../libs/other/CSGMesh.js";

var scene = new THREE.Scene();    // Create main scene

 // Use this to show information onscreen


var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0.0, 1.8, 2.5);

// Set all renderers
let renderer = new THREE.WebGLRenderer();
  document.getElementById("webgl-output").appendChild( renderer.domElement );  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type  = THREE.VSMShadowMap; // default

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

//---------------------------------------------------------
// Default light position
var lightPosition = new THREE.Vector3(2.0, 1.2, 0.0);


var ambientLight = new THREE.AmbientLight("rgb(60,60,60)");
scene.add( ambientLight );

//---------------------------------------------------------
// Create and set the spotlight
var dirLight = new THREE.DirectionalLight("rgb(255,255,255)");
  dirLight.position.copy(lightPosition);
  dirLight.castShadow = true;
  // Shadow Parameters
  dirLight.shadow.mapSize.width = 256;
  dirLight.shadow.mapSize.height = 256;
  dirLight.shadow.camera.near = .1;
  dirLight.shadow.camera.far = 6;
  dirLight.shadow.camera.left = -2.5;
  dirLight.shadow.camera.right = 2.5;
  dirLight.shadow.camera.bottom = -2.5;
  dirLight.shadow.camera.top = 2.5;
  dirLight.shadow.bias = -0.0005;  

  // No effect on Basic and PCFSoft
  dirLight.shadow.radius = 4;

  // Just for VSM - to be added in threejs.r132
  //dirLight.shadow.blurSamples = 2;
scene.add(dirLight);

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls(camera, renderer.domElement );

// Create helper for the spotlight shadow

createScene();
render();

//-----------------------------------------------------------------------------
function createScene()
{
  var groundPlane = createGroundPlane(5, 5); 
    groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
  scene.add(groundPlane);

  // Create object

  var obj = createCSGBase(2, 0.5, 0.5);
    obj.castShadow = true;
    obj.position.set(0.0, 1, 0.0);
  scene.add(obj);
}



function createCSGBase(width, height, depth){
  let mat = new THREE.MeshLambertMaterial({color: 'red'});
  let cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(width, width, depth))
  let cylinderMesh = new THREE.Mesh( new THREE.CylinderGeometry(width/2, width/2, depth, 20))

  cubeMesh.position.set(0, -height -(width/2 - height + height/2), 0)
  cubeMesh.matrixAutoUpdate = false;
  cubeMesh.updateMatrix();

  cylinderMesh.position.set(0, -(width/2 - height + height/2), 0)
  cylinderMesh.rotateX(Math.PI/2)
  cylinderMesh.matrixAutoUpdate = false;
  cylinderMesh.updateMatrix();

  let outerCyCSG = CSG.fromMesh(cylinderMesh)
  let cubeCSG = CSG.fromMesh(cubeMesh);

  let csgBase = outerCyCSG.subtract(cubeCSG)

  let base = CSG.toMesh(csgBase, new THREE.Matrix4())
  base.material = new THREE.MeshLambertMaterial({color: 'yellow'})
  //base.position.set(1, 10, 0)
  //this.base.object = base;
  // scene.add(base)

  return base;
}

function render()
{
  trackballControls.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}