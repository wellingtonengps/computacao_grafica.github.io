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
import {generateColor, getColumns, getColumnsRows, getRows, getTotalTails, lerArquivoJSON} from "./utils.js";
import {CSG} from "../libs/other/CSGMesh.js";
import {GameState} from "./gameState.js";

//import scene from "../build/jsm/offscreen/scene";

class Level {

    rowSize;
    numRows;

    baseStartPos;
    sphereRadius;
    baseHeight;
    baseWidth;


    ball;
    base;
    totalTiles;
    tileMatrix = [];
    _camera;
    collisionManager = new CollisionManager();
    scene
    raycaster = new THREE.Raycaster()
    controller;
    updates = []
    ballVector = []
    _ballSpeed = 0;

    constructor(scene) {
        this.scene = scene;
        this.hits = 0;
    }
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
        let ambientLight = new THREE.AmbientLight(ambientColor, 0.7);
        this.scene.add(ambientLight);


        let position = new THREE.Vector3(2, 12, 12);
        let position2 = new THREE.Vector3(0, 0, 0);
        let lightColor = "rgb(255, 255, 255)";
        let dirLight = new THREE.DirectionalLight(lightColor, 0.65);
            dirLight.target.position.copy(position2);
            dirLight.position.copy(position);
            dirLight.castShadow = true;
            dirLight.shadow.radius = 4;
            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;
            dirLight.shadow.camera.near = 0.0;
            dirLight.shadow.camera.far = 40;
            dirLight.shadow.camera.left = -20;
            dirLight.shadow.camera.right = 20;
            dirLight.shadow.camera.top = 20;
            dirLight.shadow.camera.bottom = -20;

            this.scene.add(dirLight);
    }

    get ballSpeed() {
        return this._ballSpeed;
    }

    set ballSpeed(value) {
        this._ballSpeed = value;
        for(let i=0; i< this.ballVector.length; i++){
            this.ballVector[i].movementSpeed = this._ballSpeed;
        }
    }

    shootBall(direction){
        this.ballVector[0].setMovement(direction, this._ballSpeed);

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
                   this.tileMatrix[i][j].hits = 0;

               }
           }
       }
   }

    incrementDestroyedTileCount(object){
        this.hits = this.hits + 1;
        console.log(this.hits)
        let tileWidth = 0.75;
        let tileHeight = 0.40;

        if(this.hits === 2){
            let pos = object.getPosition()
            let tile = new PowerUpTile(tileWidth, tileHeight, 0.5,  pos.x , pos.y, 0, generateColor(), 1)
            tile.onCollect = this.powerUp.bind(this);
            tile.scene = this.scene;
            this.scene.add(tile.getObject());
            this.updates.push(tile);
            this.collisionManager.registerCollidable(tile);
            this.collisionManager.registerCollider(tile);
        }
    }

    powerUp(object){

       console.log("Collected")
        if(this.ballVector.length ===1){
            let sphereRadius = 0.2;
            this.baseStartPos = new THREE.Vector3(4.0, 2.0, 0.0)
            let baseHeight = 0.5;
            let baseWidth = 2.0;
            let pos = object.getPosition();
            //  this.ball = ball;
            // GameState.ballId = this.ball.id;
            let ball = new Ball(sphereRadius, pos.x, pos.y + 0.01 + baseHeight / 2 + sphereRadius, 0);
            ball.setMovement(new THREE.Vector3(0,1,0), this.ball.movementSpeed);
            ball.scene = this.scene;
            this.ballVector.push(ball);
            this.scene.add(ball.getObject());

            // movimento inicial
            //ball.setMovement(new THREE.Vector3(0.2,0.2,0), 0);

            //register collidable
            this.collisionManager.registerCollider(ball)
        }

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
                    tile.setOnDestroy(this.incrementDestroyedTileCount.bind(this))
                    tile.scene = this.scene;
                    row.push(tile);
                    this.collisionManager.registerCollidable(tile);
                }else if(matrix[i][j] === 0){
                    row.push(null);
                } /*else if(matrix[i][j] === -1){
                    let tile = new PowerUpTile(tileWidth, tileHeight, 0.5,  tileX , tileY, 0, generateColor(), 1)
                    tile.setOnCollide(this.incrementCollisionCount);
                    tile.scene = this.scene;
                    //scene.add(tile.getHelper());
                    row.push(tile);
                    this.updates.push(tile);
                    this.collisionManager.registerCollidable(tile);
                    this.collisionManager.registerCollider(tile);
                }*/
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

    updateObjects(){
        for(let i=0; i< this.updates.length; i++){
            this.updates[i].update();
        }

        for(let i=0; i< this.ballVector.length; i++){
            this.ballVector[i].update();

            //verifica se alguma bola foi perdida. Se sim, deleta da lista e destrói
            if(this.ballVector[i].getPosition().y <= 0){
                this.ballVector[i].deleteObject();
                this.ballVector.splice(i, 1);
            }
        }

        if(this.ballVector.length === 0){
            this.onGameOver();
        }

        if(this.hits === this.totalTiles){
            console.log("total:" + this.totalTiles)
            this.onWinGame();
        }

        this.base.update();
        //this.ball.update();
    }

    /*
    getTotalTiles(){
        return this.rowSize * this.numRows;
    }*/

    initTileMatrix(matrix){
        // variables for create tile matrix;
        let tileWallStartX = 0.5;
        //todo: mudei aqui
        //let tileWallStartY = 12;
        let tileWallStartY = 14;
        let tileWidth = 0.75;
        let tileHeight = 0.40;
        this.rowSize = getColumns(matrix);
        this.numRows = getRows(matrix);
        this.totalTiles = getTotalTails(matrix);


        this.renderTiles(this.numRows, this.rowSize, tileWidth, tileHeight, tileWallStartX, tileWallStartY, matrix);
        this.resetTiles(this.numRows, this.rowSize);
    }

    sphereFollowBase(){
        let posVector = this.base.getPosition();
        this.ballVector[0].setPosition(posVector.x, posVector.y +  this.base.height/2 + this.ball.radius + 0.01, 0.0)
        this.ballVector[0].update()
    }

    initGameScene(){
        let sphereRadius = 0.2;
        this.baseStartPos = new THREE.Vector3(4.0, 2.0, 0.0)
        let baseHeight = 0.5;
        let baseWidth = 2.0;

        let wallTop = new Wall(9.25, 0.5, 0.5, 4.625, 15.75, 0.0);
        let wallLeft = new Wall(0.5, 18, 0.5, 0.25, 8.0, 0.0);
        let wallRight = new Wall(0.5, 18, 0.5, 9.00, 8.0, 0.0);
        let base = new Base(baseHeight, baseWidth, 0.5, this.baseStartPos.x, this.baseStartPos.y, this.baseStartPos.z)
        let ball = new Ball(sphereRadius, this.baseStartPos.x, this.baseStartPos.y + 0.01 + baseHeight / 2 + sphereRadius, 0);

        this.ball = ball;
        this.base = base;
        GameState.ballId = this.ball.id;
        GameState.baseId = this.base.id;

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
        this.ballVector.push(ball)

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
        let planeGeometry = new THREE.PlaneGeometry(9.25, 18.00, 20, 20);
        let planeMaterial = new THREE.MeshLambertMaterial({
            color: "rgb(71, 69, 78)",
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

    setOnGameOver(func){
        this.onGameOver = func;
    }

    setOnWinGame(func){
        this.onWinGame = func;
    }

    resetBall(){
        let baseHeight = 0.5;
        let baseWidth = 2.0;
        let sphereRadius = 0.2;

        for(let i=0; i< this.ballVector.length; i++){
            this.ballVector[i].getObject().geometry.dispose();
            this.ballVector[i].getObject().material.dispose();
            this.ballVector[i].getObject().visible =false;
            this.ballVector[i].getObject().active =false;
        }
        this.ballVector = []
        let basePosition = this.base.getPosition();
        let ball = new Ball(sphereRadius, basePosition.x, basePosition.y + 0.01 + baseHeight / 2 + sphereRadius, 0);
        this.scene.add(ball.getObject());
        this.ballVector.push(ball);
        this.collisionManager.registerCollider(ball);

        //this.ballVector[0].setPosition(basePosition.x, basePosition.y + 0.01 + this.base.height / 2 + this.ball.radius, 0);
        this.ballVector[0].setMovement(new THREE.Vector3(0,0,0), 0);

        //this.ballSpeed = ballSpeed;
    }

    restartLevel() {

        this.base.setPosition(this.baseStartPos.x, this.baseStartPos.y, this.baseStartPos.z);
        this.ball.setPosition(this.baseStartPos.x, this.baseStartPos.y + 0.01 + this.base.height / 2 + this.ball.radius, 0);
        this.ball.movementSpeed = 0;
        this.countTiles = 0;
        this.resetTiles(this.numRows, this.rowSize);
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

export {Level, Controller}