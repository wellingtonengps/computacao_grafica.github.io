import * as THREE from "three";
import {OrbitControls} from "../build/jsm/controls/OrbitControls.js";
import {
    initRenderer,
    initDefaultBasicLight,
    setDefaultMaterial,
    SecondaryBox,
} from "../libs/util/util.js";
import KeyboardState from "../libs/util/KeyboardState.js";
import {Ball, Base, Wall, Tile, PowerUpTile} from "./components.js";
import {CollisionManager} from "./collisionManager.js";
import {generateColor, getColumns, getColumnsRows, getRows} from "./utils.js";
import {CSG} from "../libs/other/CSGMesh.js";
//import scene from "../build/jsm/offscreen/scene";

class Level{

    //create tiles
    rowSize = 7;
    numRows = 5

    baseStartPos;
    sphereRadius;
    baseHeight;
    baseWidth;

    _countTiles = 0;
    ball;
    base;
    tileMatrix = [];
    _camera;
    collisionManager = new CollisionManager();
    scene
    raycaster = new THREE.Raycaster()
    controller;


    constructor(scene) {
        this.scene = scene;
    }

    initCamera(){
        //Camera variables
        let orthoSize = 16;
        let w = window.innerWidth;
        let h = window.innerHeight
        let aspect = w/h;
        let near = 0.1;
        let far = 1000;

        let camera = new THREE.OrthographicCamera(-orthoSize * aspect / 2, orthoSize * aspect / 2, // left, right
            orthoSize / 2, -orthoSize / 2,                  // top, bottom
            near, far);
        camera.position.set(4, 8, 8.25)
        this._camera = camera;
        //this.controller = new Controller(camera);
        //this.controller.registerListeners();

         // Create a basic light to illuminate the scene
        camera.lookAt(4, 8, 0);
        camera.updateProjectionMatrix();
    }

    initLight(){
        let light = initDefaultBasicLight(this.scene);
    }


    get camera() {
        return this._camera;
    }

    set camera(value) {
        this._camera = value;
    }

    resetTiles(){
        for (let i = 0; i < this.numRows; i++) {
            for (let j = 0; j < this.rowSize; j++) {
                this.tileMatrix[i][j].getObject().visible=true;
                this.tileMatrix[i][j].active=true;
            }
        }
    }

    incrementCollisionCount(){
        this._countTiles++;
    }

    renderTiles(numRows, rowSize, tileWidth, tileHeight, tileWallStartX, tileWallStartY) {
        //let offsetx = 1.0;
        //let offsety = 0.5;

        for (let i = 0; i < numRows; i++) {
            let row = [];
            for (let j = 0; j < rowSize; j++) {
                let tile = new Tile(tileWidth, tileHeight, 0.5, tileWallStartX + tileWidth / 2 + j * tileWidth, tileWallStartY + tileHeight / 2 + i * tileHeight, 0, generateColor())
                tile.setOnCollide(this.incrementCollisionCount)
                tile.scene = this.scene;
                this.scene.add(tile.getObject());
                //scene.add(tile.getHelper());
                row.push(tile)
                this.collisionManager.registerCollidable(tile)
            }
            this.tileMatrix.push(row)
        }
    }

    getTotalTiles(){
        return this.rowSize * this.numRows;
    }

    initTileMatrix(){
        // variables for create tile matrix;
        let tileWallStartX = 0.5;
        let tileWallStartY = 12;
        let tileWidth = 1.0;
        let tileHeight = 0.5;

        this.renderTiles(this.numRows, this.rowSize, tileWidth, tileHeight, tileWallStartX, tileWallStartY, this.scene);
        this.resetTiles(this.numRows, this.rowSize);
    }

    initGameScene(){
        let sphereRadius = 0.2;
        this.baseStartPos = new THREE.Vector3(4.0, 2.0, 0.0)
        let baseHeight = 0.5;
        let baseWidth = 1.0;

        let wallTop = new Wall(8, 0.5, 0.5, 4.0, 15.75, 0.0);
        let wallLeft = new Wall(0.5, 16, 0.5, 0.25, 8.0, 0.0);
        let wallRight = new Wall(0.5, 16, 0.5, 7.75, 8.0, 0.0);
        let base = new Base(baseHeight, baseWidth, 0.5, this.baseStartPos.x, this.baseStartPos.y, this.baseStartPos.z)
        let ball = new Ball(sphereRadius, this.baseStartPos.x, this.baseStartPos.y + 0.01 + baseHeight / 2 + sphereRadius, 0);

        this.ball = ball;
        this.base = base;

        wallTop.surfaceNormal = new THREE.Vector3(0, -1, 0);
        wallLeft.surfaceNormal = new THREE.Vector3(-1,0,0);
        wallRight.surfaceNormal = new THREE.Vector3(1,0,0)

        // add objects scene
        //scene.add(this.createBackgroundPlane());
        this.scene.add(wallLeft.getObject());
        this.scene.add(wallRight.getObject());
        this.scene.add(wallTop.getObject());
        this.scene.add(base.getObject());
        ball.scene = this.scene;
        this.scene.add(ball.getObject());

        // movimento inicial
        ball.setMovement(new THREE.Vector3(0,0,0), 0);

        //register collidable
        this.collisionManager.registerCollidable(wallLeft)
        this.collisionManager.registerCollidable(wallTop)
        this.collisionManager.registerCollidable(wallRight)
        this.collisionManager.registerCollidable(base)
        this.collisionManager.registerCollider(ball)

    }

    createBackgroundPlane(scene) {
        let planeGeometry = new THREE.PlaneGeometry(8, 16, 20, 20);
        let planeMaterial = new THREE.MeshLambertMaterial({
            color: "rgb(0,255,255)",
        });
        planeMaterial.side = THREE.DoubleSide;
        planeMaterial.transparent = true;
        planeMaterial.opacity = 1.0;

        let backgroundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        backgroundPlane.position.set(4, 8, 0);
        this.backgroundPlane = backgroundPlane;
        scene.add(backgroundPlane)

        return backgroundPlane;
    }

    moveBaseToRaycasterXPosition() {
        let mouseIntersect = this.controller.mousePointsTo(this.backgroundPlane)
        let baseWidth = this.base.width;

        if (mouseIntersect != null) {
            let x = mouseIntersect.x;
            this.base.setPosition(x, 2.0, 0.0)
            if (x <= 0.50 + baseWidth/2) {
                //todo: tirar números mágicos
                this.base.setPosition(0.50 + baseWidth/2, 2.0, 0.0)
                //ball.setPosition(0.50 + baseWidth/2, 2.0, 0.0)
            } else if (x >= 8 - 0.5 - baseWidth/2) {
                this.base.setPosition(8 - 0.5 - baseWidth/2, 2.0, 0.0)
            }
        }
    }

    createObjects(scene){
        let collisionManager = new CollisionManager();
        let countTiles= 0;
        let raycaster = new THREE.Raycaster();
        let mouse = new THREE.Vector2();

        // create objects
        //let backgroundPlane = this.createBackgroundPlane();

        var positionMessage = new SecondaryBox("");
        positionMessage.changeStyle("rgba(0,0,0,0)", "lightgray", "16px", "ubuntu");

    }


    get countTiles() {
        return this._countTiles;
    }

    restartLevel() {
        this.base.setPosition(this.baseStartPos.x, this.baseStartPos.y, this.baseStartPos.z);
        this.ball.setPosition(this.baseStartPos.x, this.baseStartPos.y + 0.01 + this.base.height / 2 + this.ball.radius, 0);
        this.ball.movementSpeed = 0;
        this.countTiles = 0;
        this.resetTiles();
    }

    set countTiles(value) {
        this._countTiles = value;
    }
}

class Level1 extends Level{}

class Level2 extends Level{
    initCamera(){
        let orthoSize = 16;
        let w = window.innerWidth;
        let h = window.innerHeight

        let aspect = 16/8;
        let fov = 90;

        let camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 20);


        camera.position.set(4.625, 8, 8.25)
        this._camera = camera;

        camera.lookAt(4.625, 8, 0);
        camera.updateProjectionMatrix();
    }

    initLight(){
        //let light = initDefaultBasicLight(this.scene);
        let ambientColor = "rgb(80,80,80)"
        let ambientLight = new THREE.AmbientLight(ambientColor);
        this.scene.add(ambientLight);


        let position = new THREE.Vector3(2, 12, 12);
        let position2 = new THREE.Vector3(0, 0, 0);
        let lightColor = "rgb(255, 255, 255)";
        let dirLight = new THREE.DirectionalLight(lightColor, 0.7);
            dirLight.target.position.copy(position2);
            dirLight.position.copy(position);
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;
            dirLight.shadow.camera.near = .0;
            dirLight.shadow.camera.far = 40;
            dirLight.shadow.camera.left = -20;
            dirLight.shadow.camera.right = 20;
            dirLight.shadow.camera.top = 20;
            dirLight.shadow.camera.bottom = -20;

            this.scene.add(dirLight);
    }


    get camera() {
        return this._camera;
    }

    set camera(value) {
        this._camera = value;
    }

    /*
    resetTiles(){
        for (let i = 0; i < this.numRows; i++) {
            for (let j = 0; j < this.rowSize; j++) {
                this.tileMatrix[i][j].getObject().visible=true;
                this.tileMatrix[i][j].active=true;
            }
        }
    }*/


   resetTiles(numRows, rowSize){
       for (let i = 0; i < numRows; i++) {
           for (let j = 0; j < rowSize; j++) {
               if(this.tileMatrix[i][j] !== null){
                   this.tileMatrix[i][j].getObject().visible=true;
                   this.tileMatrix[i][j].active=true;
               }
           }
       }
   }

    incrementCollisionCount(){
        this._countTiles++;
    }

    /*
    renderTiles(numRows, rowSize, tileWidth, tileHeight, tileWallStartX, tileWallStartY) {
        //let offsetx = 1.0;
        //let offsety = 0.5;

        for (let i = 0; i < numRows; i++) {
            let row = [];
            for (let j = 0; j < rowSize; j++) {
                let tile = new Tile(tileWidth, tileHeight, 0.5, tileWallStartX + tileWidth / 2 + j * tileWidth, tileWallStartY + tileHeight / 2 + i * tileHeight, 0, generateColor())
                tile.setOnCollide(this.incrementCollisionCount)
                tile.scene = this.scene;
                this.scene.add(tile.getObject());
                //scene.add(tile.getHelper());
                row.push(tile)
                this.collisionManager.registerCollidable(tile)
            }
            this.tileMatrix.push(row)
        }
    }*/

    renderTiles(numRows, rowSize, tileWidth, tileHeight, tileWallStartX, tileWallStartY, matrix) {
        //let offsetx = 1.0;
        //let offsety = 0.5;



        for (let i = 0; i < numRows; i++) {
            let row = [];
            for (let j = 0; j < rowSize; j++) {
                let tileX = tileWallStartX + tileWidth / 2 + j * tileWidth;
                let tileY = tileWallStartY + tileHeight / 2 - i * tileHeight;

                if(matrix[i][j] >= 1) {
                    //todo: mudei aqui para inverter
                    let tile = new Tile(tileWidth, tileHeight, 0.5, tileX , tileY, 0, generateColor(), matrix[i][j])
                    tile.setOnCollide(this.incrementCollisionCount)
                    tile.scene = this.scene;
                    row.push(tile);
                    this.collisionManager.registerCollidable(tile);
                }else if(matrix[i][j] === 0){
                    row.push(null);
                }else if(matrix[i][j] === -1){
                    let tile = new PowerUpTile(tileWidth, tileHeight, 0.5,  tileX , tileY, 0, generateColor(), 1)
                    tile.setOnCollide(this.incrementCollisionCount)
                    tile.scene = this.scene;
                    //scene.add(tile.getHelper());
                    row.push(tile);
                    this.collisionManager.registerCollidable(tile);
                }
            }
            this.tileMatrix.push(row)
        }



        for (let i = numRows - 1; i >= 0; i--) {
            for (let j = rowSize - 1; j >= 0; j--) {
                if (this.tileMatrix[i][j] !== null) {
                    this.scene.add(this.tileMatrix[i][j].getObject());
                }
            }
        }


    }

    getTotalTiles(){
        return this.rowSize * this.numRows;
    }

    initTileMatrix(matrix){
        // variables for create tile matrix;
        let tileWallStartX = 0.5;
        //todo: mudei aqui
        //let tileWallStartY = 12;
        let tileWallStartY = 14;
        let tileWidth = 0.75;
        let tileHeight = 0.40;
        let rowSize = getColumns(matrix);
        let numRows = getRows(matrix);

        this.renderTiles(numRows, rowSize, tileWidth, tileHeight, tileWallStartX, tileWallStartY, matrix);
        this.resetTiles(numRows, rowSize);
    }

    initGameScene(){
        let sphereRadius = 0.2;
        this.baseStartPos = new THREE.Vector3(4.0, 2.0, 0.0)
        let baseHeight = 0.5;
        let baseWidth = 2.0;

        let wallTop = new Wall(9.25, 0.5, 0.5, 4.625, 15.75, 0.0);
        let wallLeft = new Wall(0.5, 16, 0.5, 0.25, 8.0, 0.0);
        let wallRight = new Wall(0.5, 16, 0.5, 9.00, 8.0, 0.0);
        let base = new Base(baseHeight, baseWidth, 0.5, this.baseStartPos.x, this.baseStartPos.y, this.baseStartPos.z)
        let ball = new Ball(sphereRadius, this.baseStartPos.x, this.baseStartPos.y + 0.01 + baseHeight / 2 + sphereRadius, 0);

        this.ball = ball;
        this.base = base;

        wallTop.surfaceNormal = new THREE.Vector3(0, -1, 0);
        wallLeft.surfaceNormal = new THREE.Vector3(-1,0,0);
        wallRight.surfaceNormal = new THREE.Vector3(1,0,0)

        // add objects scene
        //scene.add(this.createBackgroundPlane());
        this.scene.add(wallLeft.getObject());
        this.scene.add(wallRight.getObject());
        this.scene.add(wallTop.getObject());
        this.scene.add(base.getObject());
        ball.scene = this.scene;
        this.scene.add(ball.getObject());
        this.scene.add(base.getHelper())

        // movimento inicial
        ball.setMovement(new THREE.Vector3(0,0,0), 0);

        //register collidable
        this.collisionManager.registerCollidable(wallLeft)
        this.collisionManager.registerCollidable(wallTop)
        this.collisionManager.registerCollidable(wallRight)
        this.collisionManager.registerCollidable(base)
        this.collisionManager.registerCollider(ball)

        this.createCSGBase(this.scene)

    }

    createBackgroundPlane(scene) {
        let planeGeometry = new THREE.PlaneGeometry(9.25, 16.00, 20, 20);
        let planeMaterial = new THREE.MeshLambertMaterial({
            color: "rgb(136,136,136)",
        });
        planeMaterial.side = THREE.DoubleSide;
        planeMaterial.transparent = true;
        planeMaterial.opacity = 1.0;

        let backgroundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        backgroundPlane.position.set(4.625, 8, -0.5);
        this.backgroundPlane = backgroundPlane;
        backgroundPlane.receiveShadow = true;
        scene.add(backgroundPlane)

        return backgroundPlane;
    }

    moveBaseToRaycasterXPosition() {
        let mouseIntersect = this.controller.mousePointsTo(this.backgroundPlane)
        let baseWidth = this.base.width;

        if (mouseIntersect != null) {
            let x = mouseIntersect.x;
            this.base.setPosition(x, 2.0, 0.0)
            if (x <= 0.50 + baseWidth/2) {
                //todo: tirar números mágicos
                this.base.setPosition(0.50 + baseWidth/2, 2.0, 0.0)
                //ball.setPosition(0.50 + baseWidth/2, 2.0, 0.0)
            } else if (x >= 8 - 0.5 - baseWidth/2) {
                this.base.setPosition(8 - 0.5 - baseWidth/2, 2.0, 0.0)
            }
        }
    }

    createObjects(scene){
        let collisionManager = new CollisionManager();
        let countTiles= 0;
        let raycaster = new THREE.Raycaster();
        let mouse = new THREE.Vector2();

        // create objects
        //let backgroundPlane = this.createBackgroundPlane();

        var positionMessage = new SecondaryBox("");
        positionMessage.changeStyle("rgba(0,0,0,0)", "lightgray", "16px", "ubuntu");

    }

    createCSGBase(scene){
        let mat = new THREE.MeshPhongMaterial({color: 'red', shininess:500});
        let cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1))
        let cylinderMesh = new THREE.Mesh( new THREE.CylinderGeometry(0.5, 0.5, 1, 20))

        cubeMesh.position.set(5, 1.5, 2)
        cubeMesh.matrixAutoUpdate = false;
        cubeMesh.updateMatrix();

        cylinderMesh.position.set(5, 2, 2)
        cylinderMesh.rotateX(Math.PI/2)
        cylinderMesh.matrixAutoUpdate = false;
        cylinderMesh.updateMatrix();

        let outerCyCSG = CSG.fromMesh(cylinderMesh)
        let cubeCSG = CSG.fromMesh(cubeMesh);

        let csgBase = outerCyCSG.subtract(cubeCSG)

        let base = CSG.toMesh(csgBase, new THREE.Matrix4())
        base.material = new THREE.MeshPhongMaterial({color: 'yellow', shininess:500})
       // base.position.set(1, 4, 0)
        //this.base.object = base;

       // scene.add(base)

        return base;
    }
    get countTiles() {
        return this._countTiles;
    }

    restartLevel() {
        this.base.setPosition(this.baseStartPos.x, this.baseStartPos.y, this.baseStartPos.z);
        this.ball.setPosition(this.baseStartPos.x, this.baseStartPos.y + 0.01 + this.base.height / 2 + this.ball.radius, 0);
        this.ball.movementSpeed = 0;
        this.countTiles = 0;
        this.resetTiles();
    }

    set countTiles(value) {
        this._countTiles = value;
    }

}



class Controller{
    mouse;
    raycaster = new THREE.Raycaster();
    onMouseClick;
    camera;


    constructor(camera) {
        this.camera = camera;
        this.mouse = new THREE.Vector2(0,0);
    }

    registerListeners(){
        window.addEventListener("mousemove", this.onMouseMove);
    }

    onMouseMove(event) {
        event.preventDefault();
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    setOnMouseClick(func){
        this.onMouseClick = func;
        window.addEventListener("click", this.onMouseClick);

    }


    mousePointsTo(plane) {
        this.camera.updateMatrixWorld();
        this.raycaster.setFromCamera(this.mouse, this.camera);
        var intersects = this.raycaster.intersectObject(plane);

        if (intersects.length > 0) {
            return intersects[0].point;

        }

        return null;
    }

}

export {Level, Level1, Level2, Controller}