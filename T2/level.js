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

class Level{

    countTiles = 0;
    ball;
    base;
    tileMatrix = [];
    camera;
    collisionManager = new CollisionManager();


    initCamera(scene){
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
        this.camera = camera;

        let light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
        camera.lookAt(4, 8, 0);
        camera.updateProjectionMatrix();
    }

    resetTiles(numRows, rowSize){
        for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < rowSize; j++) {
                this.tileMatrix[i][j].getObject().visible=true;
                this.tileMatrix[i][j].active=true;

            }
        }
    }

    incrementCollisionCount(){
        this.countTiles++;
    }

    renderTiles(numRows, rowSize, tileWidth, tileHeight, tileWallStartX, tileWallStartY, scene) {
        //let offsetx = 1.0;
        //let offsety = 0.5;

        for (let i = 0; i < numRows; i++) {
            let row = [];
            for (let j = 0; j < rowSize; j++) {
                let tile = new Tile(tileWidth, tileHeight, 0.5, tileWallStartX + tileWidth / 2 + j * tileWidth, tileWallStartY + tileHeight / 2 + i * tileHeight, 0, generateColor())
                tile.setOnCollide(this.incrementCollisionCount)
                tile.scene = scene;
                scene.add(tile.getObject() );
                //scene.add(tile.getHelper());
                row.push(tile)
                this.collisionManager.registerCollidable(tile)
            }
            this.tileMatrix.push(row)
        }
    }

    initTileMatrix(scene){
        // variables for create tile matrix
        let rowSize = 7;
        let numRows = 5;
        let tileWallStartX = 0.5;
        let tileWallStartY = 12;
        let tileWidth = 1.0;
        let tileHeight = 0.5;

        this.resetTiles(numRows, rowSize);
        this.renderTiles(numRows, rowSize, tileWidth, tileHeight, tileWallStartX, tileWallStartY, scene);
    }

    initGameScene(scene){
        let sphereRadius = 0.2;
        let baseStartPos = new THREE.Vector3(4.0, 2.0, 0.0)
        let baseHeight = 0.5;
        let baseWidth = 1.0;

        let wallTop = new Wall(8, 0.5, 0.5, 4.0, 15.75, 0.0);
        let wallLeft = new Wall(0.5, 16, 0.5, 0.25, 8.0, 0.0);
        let wallRight = new Wall(0.5, 16, 0.5, 7.75, 8.0, 0.0);
        let base = new Base(baseHeight, baseWidth, 0.5, baseStartPos.x, baseStartPos.y, baseStartPos.z)
        let ball = new Ball(sphereRadius, baseStartPos.x, baseStartPos.y + 0.01 + baseHeight / 2 + sphereRadius, 0);

        this.ball = ball;
        this.base = base;

        wallTop.surfaceNormal = new THREE.Vector3(0, -1, 0);
        wallLeft.surfaceNormal = new THREE.Vector3(-1,0,0);
        wallRight.surfaceNormal = new THREE.Vector3(1,0,0)

        // add objects scene
        scene.add(this.createBackgroundPlane());
        scene.add(wallLeft.getObject());
        scene.add(wallRight.getObject());
        scene.add(wallTop.getObject());
        scene.add(base.getObject());
        ball.scene = scene;
        scene.add(ball.getObject());

        // movimento inicial
        ball.setMovement(new THREE.Vector3(0,0,0), 0);

        //register collidable
        this.collisionManager.registerCollidable(wallLeft)
        this.collisionManager.registerCollidable(wallTop)
        this.collisionManager.registerCollidable(wallRight)
        this.collisionManager.registerCollidable(base)
        this.collisionManager.registerCollider(ball)

    }

    createBackgroundPlane() {
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

    createObjects(scene){
        let collisionManager = new CollisionManager();
        let countTiles= 0;
        let raycaster = new THREE.Raycaster();
        let mouse = new THREE.Vector2();

        // create objects
        let backgroundPlane = createBackgroundPlane();

        var positionMessage = new SecondaryBox("");
        positionMessage.changeStyle("rgba(0,0,0,0)", "lightgray", "16px", "ubuntu");


    }


}