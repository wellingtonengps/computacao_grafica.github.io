import * as THREE from "three";
import {
    getFilename, getMaxSize,
    SecondaryBox,
} from "../libs/util/util.js";
import {Ball, Base, Wall, Tile, PowerUpTile, Life} from "./components.js";
import {CollisionManager} from "./collisionManager.js";
import {generateColor, getColumns, getRows, getTotalTiles, loadGLTFFile} from "./utils.js";
import {CSG} from "../libs/other/CSGMesh.js";
import {GameState} from "./gameState.js";
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js';
import {OBJLoader} from '../build/jsm/loaders/OBJLoader.js';
import {MTLLoader} from '../build/jsm/loaders/MTLLoader.js';


class Level {

    rowSize;
    numRows;

    baseStartPos;
    ball;
    base;
    totalTiles;
    totalLives = 5;
    tileMatrix = [];
    lifeVector = [];
    _camera;
    collisionManager = new CollisionManager();
    scene
    raycaster = new THREE.Raycaster()
    controller;
    updates = []
    ballVector = []
    _ballSpeed = 0;
    blockBeforePowerUp = 0;
    timer;
    powerUpGenerated = false;
    powerUpIIOn = false;
    powerUpIOn = false;

    startTimer(){

    }


    constructor(scene) {
        this.scene = scene;
        this.hits = 0;


    }

    initCamera() {
        let aspect = 16 / 8;
        let fov = 18;

        let camera = new THREE.PerspectiveCamera(fov, aspect, 0.5, 100);


        camera.position.set(4.625, -20, 25)
        this._camera = camera;

        camera.lookAt(4.625, 90, 1);
        camera.updateProjectionMatrix();
    }



    resetCamera() {

        this._camera.position.set(4.625, 8, 19.5)
        this._camera.lookAt(4.625, 8, 0);
        this._camera.updateProjectionMatrix();
    }

    initLight() {
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
        for (let i = 0; i < this.ballVector.length; i++) {
            this.ballVector[i].movementSpeed = this._ballSpeed;
        }
    }

    shootBall(direction) {
        this.ballVector[0].setMovement(direction, this._ballSpeed);

    }

    get camera() {
        return this._camera;
    }

    set camera(value) {
        this._camera = value;
    }

    resetTiles(numRows, rowSize) {
        for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < rowSize; j++) {
                if (this.tileMatrix[i][j] !== null) {
                    this.tileMatrix[i][j].getObject().visible = true;
                    this.tileMatrix[i][j].active = true;
                    this.tileMatrix[i][j].hits = 0;

                }
            }
        }
    }

    incrementDestroyedTileCount(object) {
        this.hits = this.hits + 1;
        console.log(this.hits)
        let tileWidth = 0.75;
        let tileHeight = 0.40;
        let rand =  Math.floor(Math.random() * 2);

        if (!this.powerUpIIOn && !this.powerUpIOn) {
            this.blockBeforePowerUp++;
            console.log("blockBeforePowerUp: " + this.blockBeforePowerUp)
        }

        if (this.blockBeforePowerUp === 10 && !this.powerUpIIOn && !this.powerUpIOn) {
            this.blockBeforePowerUp = 0;
            let pos = object.getPosition()
            let tile ;
            this.powerUpGenerated = true;

            if(rand === 0){
                tile = new PowerUpTile(tileWidth/2, tileHeight/2, 0.5, pos.x, pos.y, 0, generateColor(), 0)
                tile.onCollect = this.powerUpI.bind(this);
            }else if (rand === 1){
                tile = new PowerUpTile(tileWidth/2, tileHeight/2, 0.5, pos.x, pos.y, 0, generateColor(), 1)
                tile.onCollect = this.powerUpII.bind(this);
            }

            tile.onDestroy = this.onPowerUpDestroy.bind(this);

            tile.scene = this.scene;
            this.scene.add(tile.getObject());
            this.updates.push(tile);
            this.collisionManager.registerCollidable(tile);
            this.collisionManager.registerCollider(tile);

        }
    }

    addBall(){
        let sphereRadius = 0.2;
        this.baseStartPos = new THREE.Vector3(4.0, 2.0, 0.0)
        let baseHeight = 0.5;
        let pos = this.ballVector[0].getPosition();
        let ball = new Ball(sphereRadius, pos.x, pos.y + 0.01 + baseHeight / 2 + sphereRadius, 0);
        ball.setMovement(new THREE.Vector3(0, 1, 0), this.ball.movementSpeed);
        ball.scene = this.scene;
        this.ballVector.push(ball);
        this.scene.add(ball.getObject());
        this.collisionManager.registerCollider(ball)
    }

    powerUpI(object) {
       // let rand =  Math.floor(Math.random() * 2);
        object.deleteObject();
        this.powerUpIOn = true;


        // if(rand ===0){
            if(this.ballVector.length === 2){
                this.addBall();
            }else if(this.ballVector.length===1){
                this.addBall();
                this.addBall();
            }

       // }else{

       // }

    }

    powerUpII(object) {
        this.powerUpIIOn = true;
        while(this.ballVector.length > 1){
            this.ballVector.pop().deleteObject();
        }

        this.ballVector[0].state = Ball.STATE_UNSTOPPABLE;
        this.timer = window.setInterval((e)=>{
            this.ballVector[0].state = Ball.STATE_NORMAL;
            window.clearInterval(this.timer)
            this.powerUpIIOn = false;
        }, 7000);
    }

    onPowerUpDestroy(){
        this.powerUpGenerated = false;
    }

    decrementLife(){
        this.totalLives--;
        let obj = this.lifeVector.pop();
        this.scene.remove(obj.getObject())

        console.log("life: " + this.lifeVector.length)
    }

    renderLife(lives){
        for (let i = 0; i < lives; i++) {
            let sphereRadius = 0.2;
            let life = new Life(sphereRadius, 5.0 + (i * 0.7), 15.4, 1);
            this.lifeVector.push(life);
        }

        for (let i = 0; i < this.lifeVector.length; i++) {
            this.scene.add(this.lifeVector[i].getObject());
        }
    }

    renderTiles(numRows, rowSize, tileWidth, tileHeight, tileWallStartX, tileWallStartY, matrix) {

        for (let i = 0; i < numRows; i++) {
            let row = [];
            for (let j = 0; j < rowSize; j++) {
                let tileX = tileWallStartX + tileWidth / 2 + j * tileWidth;
                let tileY = tileWallStartY + tileHeight / 2 - i * tileHeight;

                if (matrix[i][j] >= 1) {
                    let tile = new Tile(tileWidth, tileHeight, 0.5, tileX, tileY, 0, generateColor(), matrix[i][j])
                    tile.setOnDestroy(this.incrementDestroyedTileCount.bind(this))
                    tile.scene = this.scene;
                    row.push(tile);
                    this.collisionManager.registerCollidable(tile);
                } else if (matrix[i][j] === 0) {
                    row.push(null);
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

    updateObjects() {
        for (let i = 0; i < this.updates.length; i++) {
            this.updates[i].update();
        }

        for (let i = 0; i < this.ballVector.length; i++) {
            this.ballVector[i].update();

            if (this.ballVector[i].getPosition().y <= 0) {
                this.ballVector[i].deleteObject();
                this.ballVector.splice(i, 1);
            }
        }

        if (this.ballVector.length === 0) {
            this.decrementLife();
            this.onLifeOver();
        }

        if (this.totalLives === 0) {
            this.onGameOver();
        }

        if(this.ballVector.length <= 2){
            this.powerUpIOn = false;
        }

        if (this.hits === this.totalTiles) {
            console.log("total:" + this.totalTiles)
            this.onWinGame();
        }

        this.base.update();
    }

    initTileMatrix(matrix) {

        let tileWallStartX = 0.5;
        let tileWallStartY = 14;
        let tileWidth = 0.75;
        let tileHeight = 0.40;
        this.rowSize = getColumns(matrix);
        this.numRows = getRows(matrix);
        this.totalTiles = getTotalTiles(matrix);


        this.renderTiles(this.numRows, this.rowSize, tileWidth, tileHeight, tileWallStartX, tileWallStartY, matrix);
        this.resetTiles(this.numRows, this.rowSize);
    }

    initLife(lives){
        this.renderLife(lives);
    }

    sphereFollowBase() {
        let posVector = this.base.getPosition();
        this.ballVector[0].setPosition(posVector.x, posVector.y + this.base.height / 2 + this.ball.radius + 0.01, 0.0)
        this.ballVector[0].update()
    }

    initGameScene() {
        let sphereRadius = 0.2;
        this.baseStartPos = new THREE.Vector3(4.0, 2.0, 0.0)
        let baseHeight = 0.35;
        let baseWidth = 4.0;

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
        wallLeft.surfaceNormal = new THREE.Vector3(-1, 0, 0);
        wallRight.surfaceNormal = new THREE.Vector3(1, 0, 0)

        this.scene.add(wallLeft.getObject());
        this.scene.add(wallRight.getObject());
        this.scene.add(wallTop.getObject());
        this.scene.add(base.getObject());

        ball.scene = this.scene;
        this.scene.add(ball.getObject());
        this.ballVector.push(ball)

        ball.setMovement(new THREE.Vector3(0, 0, 0), 0);

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
        planeMaterial.opacity = 0.0;

        let backgroundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        backgroundPlane.position.set(4.625, 8, -0.5);
        this.backgroundPlane = backgroundPlane;
        backgroundPlane.receiveShadow = true;
        scene.add(backgroundPlane)

        return backgroundPlane;
    }

    createCSGBase(scene) {
        let mat = new THREE.MeshPhongMaterial({color: 'red', shininess: 500});
        let cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1))
        let cylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 20))

        cubeMesh.position.set(5, 1.5, 2)
        cubeMesh.matrixAutoUpdate = false;
        cubeMesh.updateMatrix();

        cylinderMesh.position.set(5, 2, 2)
        cylinderMesh.rotateX(Math.PI / 2)
        cylinderMesh.matrixAutoUpdate = false;
        cylinderMesh.updateMatrix();

        let outerCyCSG = CSG.fromMesh(cylinderMesh)
        let cubeCSG = CSG.fromMesh(cubeMesh);

        let csgBase = outerCyCSG.subtract(cubeCSG)

        let base = CSG.toMesh(csgBase, new THREE.Matrix4())
        base.material = new THREE.MeshPhongMaterial({color: 'yellow', shininess: 500})

        return base;
    }

    get countTiles() {
        return this._countTiles;
    }

    setOnGameOver(func) {
        this.onGameOver = func;
    }

    setOnLifeOver(func) {
        this.onLifeOver = func;
    }

    setOnWinGame(func) {
        this.onWinGame = func;
    }

    resetBall() {
        let baseHeight = 0.5;
        let sphereRadius = 0.2;

        for (let i = 0; i < this.ballVector.length; i++) {
            this.ballVector[i].getObject().geometry.dispose();
            this.ballVector[i].getObject().material.dispose();
            this.ballVector[i].getObject().visible = false;
            this.ballVector[i].getObject().active = false;
        }
        this.ballVector = []
        let basePosition = this.base.getPosition();
        let ball = new Ball(sphereRadius, basePosition.x, basePosition.y + 0.01 + baseHeight / 2 + sphereRadius, 0);
        this.scene.add(ball.getObject());
        this.ballVector.push(ball);
        this.collisionManager.registerCollider(ball);

        this.ballVector[0].setMovement(new THREE.Vector3(0, 0, 0), 0);
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

export {Level}