import {getFilename, getMaxSize} from "../libs/util/util.js";
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js';
import {OBJLoader} from '../build/jsm/loaders/OBJLoader.js';
import {MTLLoader} from '../build/jsm/loaders/MTLLoader.js';
import * as THREE from "three";

function generateColor() {
    let colorPalette = [
        "rgb(0,255,100)",
        "rgb(255,0,255)",
        "rgb(255,255, 0)",
        "rgb(255,0,0)",
    ];
    return colorPalette[Math.floor(Math.random() * colorPalette.length)];
}

function getColor(num) {
    let colorPalette = new Map([
        [2, "rgb(96,96,96)"],
        [4, "rgb(128, 208, 16)"],
        [5, "rgb(252, 116, 180)"],
        [6, "rgb(248, 150, 55)"],
        [7, "rgb(214, 39, 0)"],
        [8, "rgb(0, 112, 236)"],
        //[9, "rgb(255,106,0)"],
        //[10, "rgb(0,255,225)"],
        [11, "rgb(255,255,255)"]
    ]);

    return colorPalette.get(num)
}


function getColumns(matrix){
    return matrix[0].length;
}

function getRows(matrix){
    return matrix.length;
}

function getTotalTails(matrix) {
    let count = 0;

    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] !== 0) {
                count++;
            }
        }
    }

    return count;
}

function readLevel(path, level, callback) {
    fetch(path)
        .then(response => response.json())
        .then(data => {
            callback(data[level - 1].matrix);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function loadGLTFFile(modelPath, modelName, desiredScale, angle, visibility, object)
{
    var loader = new GLTFLoader( );
    let returnObj ={a:(obj)=> console.log(obj)};
    loader.load( modelPath + modelName + '.glb', function ( gltf ) {
        var obj = gltf.scene;
        obj.visible = visibility;
        obj.name = getFilename(modelName);
        obj.traverse( function (child)
        {
            if( child.isMesh ) child.castShadow = true;
            if( child.material ) child.material.side = THREE.DoubleSide;
        });

        var obj = normalizeAndRescale(obj, desiredScale);
        var obj = fixPosition(obj);
        obj.position.set(0,-0.25,0,)
        obj.rotateY(THREE.MathUtils.degToRad(angle));

        object.add(obj)
        //assetManager[modelName] = obj;
    });

}


function normalizeAndRescale(obj, newScale)
{
    var scale = getMaxSize(obj); // Available in 'utils.js'
    obj.scale.set(newScale * (1.0/scale),
        newScale * (1.0/scale),
        newScale * (1.0/scale));
    return obj;
}

function fixPosition(obj)
{
    // Fix position of the object over the ground plane
    var box = new THREE.Box3().setFromObject( obj );
    if(box.min.y > 0)
        obj.translateY(-box.min.y);
    else
        obj.translateY(-1*box.min.y);
    return obj;
}


function loadOBJFile(modelPath, modelName, desiredScale, angle, visibility, scene)
{
    var mtlLoader = new MTLLoader( );
    mtlLoader.setPath( modelPath );
    mtlLoader.load( modelName + '.mtl', function ( materials ) {
        materials.preload();

        var objLoader = new OBJLoader( );
        objLoader.setMaterials(materials);
        objLoader.setPath(modelPath);
        objLoader.load( modelName + ".obj", function ( obj ) {
            obj.visible = visibility;
            obj.name = modelName;
            // Set 'castShadow' property for each children of the group
            obj.traverse( function (child)
            {
                if( child.isMesh ) child.castShadow = true;
                if( child.material ) child.material.side = THREE.DoubleSide;
            });

            var obj = normalizeAndRescale(obj, desiredScale);
            var obj = fixPosition(obj);
            obj.rotateY(THREE.MathUtils.degToRad(angle));

            scene.add ( obj );
           // assetManager[modelName] = obj;
        });
    });
}


export {generateColor, readLevel, getColumns, getRows, getColor, getTotalTails, loadGLTFFile}