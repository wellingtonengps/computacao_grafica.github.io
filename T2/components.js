import * as THREE from "three";
import {
    initRenderer,
    initDefaultBasicLight,
    setDefaultMaterial,
    SecondaryBox,
} from "../libs/util/util.js";
import {GameState} from "./gameState.js";



let material = setDefaultMaterial();

// constructor
// getBoundingBox()
// collide()

class Component {
    boundingBox = null;
    object = null;
    _id = null;
    _surfaceNormal = null;
    active = true;
    _scene = null;
    _lastColided = null;

    constructor() {
        this._id = GameState.getNextUID();
    };

    getBoundingBox() {
        return this.boundingBox;
    };

    getObject() {
        return this.object;
    }

    update() {
        this.boundingBox.setFromObject(this.object);
    };

    getRayIntersectionPoint(object){
        let raycaster = new THREE.Raycaster();
        let direction = object.getPosition().sub(this.getPosition()).normalize()
        raycaster.set(this.getPosition(), direction);
        let intersects = raycaster.intersectObject(object.getObject());
        //console.log(intersects[0])
        return intersects[0].point
    }
    collide(object) {
        this.lastColided = object.id;
        console.log(this._id + " colide com " + object.id )
        /*let raycaster = new THREE.Raycaster();
        let direction = this.getPosition().sub(object.getPosition()).normalize()
        raycaster.set(object.getPosition(), direction);
        let intersects = raycaster.intersectObject(this.getObject());
        console.log(intersects[0].point)*/

        if(this.scene){
            const material = new THREE.LineBasicMaterial({
                color: "rgb(255,255,255)",
                linewidth: 2
            });

            const points = [];
            points.push(object.getPosition().add(new THREE.Vector3(0,0,2)));
            points.push(this.getPosition().add(new THREE.Vector3(0,0,2)));
            //points.push(new THREE.Vector3(5,5,5));

            console.log(object.getPosition())

            const geometry = new THREE.BufferGeometry().setFromPoints( points );

            const line = new THREE.Line( geometry, material );
            this._scene.add( line );
            //this._scene.updateMatrixWorld()
        }

    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }


    get lastColided() {
        return this._lastColided;
    }

    set lastColided(value) {
        this._lastColided = value;
    }

    get scene() {
        return this._scene;
    }

    set scene(value) {
        this._scene = value;
    }

    get surfaceNormal() {
        return this._surfaceNormal;
    }

    set surfaceNormal(value) {
        this._surfaceNormal = value;
    }

    setPosition(x, y, z){
        this.object.position.set(x, y, z);
        this.object.updateMatrixWorld();
    }

    getPosition(){
        let pos = new THREE.Vector3();
        this.object.getWorldPosition(pos);
        return pos;
    }

    getSurfaceNormalByPoint(point){}
}

class Wall extends Component {

    constructor(height, width, depth, x, y, z) {
        super();
        let material = setDefaultMaterial();
        let boxGeometry = new THREE.BoxGeometry(height, width, depth);
        let box = new THREE.Mesh(boxGeometry, material);
        box.position.set(x, y, z);
        let bbBox = new THREE.Box3().setFromObject(box);
        bbBox.setFromObject(box);

        this.boundingBox = bbBox;
        this.object = box;
        this.surfaceNormal = new THREE.Vector3(0, -1, 0);
        this.helper = new THREE.Box3Helper(this.boundingBox, 'white' );
    }

    getHelper(){
        return this.helper;
    }
    update() {
        super.update();
    }

    getSurfaceNormalByPoint(point) {
        super.getSurfaceNormalByPoint(point);
        return this.surfaceNormal;
    }
}

class Tile extends Component {

    active = true;
    _hits = 0;

    constructor(width, height, depth, x, y, z, color) {
        super();
        let boxGeometry = new THREE.BoxGeometry(width, height, depth);
        let box = new THREE.Mesh(boxGeometry, setDefaultMaterial(color));
        let bbBox = new THREE.Box3().setFromObject(box);
        box.position.set(x, y, z)
        bbBox.setFromObject(box);


        this.boundingBox = bbBox;
        this.object = box;
        this.surfaceNormal = new THREE.Vector3(0, -1, 0);
        this.helper = new THREE.Box3Helper(this.boundingBox, 'white' );
    }

    getHelper() {
        return this.helper;
    }

    get active() {
        return this.active;
    }

    set active(value) {
        this.active = value;
    }

    get hits() {
        return this._hits;
    }

    set hits(value) {
        this._hits = value;
    }

    update() {
        super.update();
    }

    collide(object) {


        console.log(this.active)
        if(this.active===true){


            super.collide(object);
            this.active = false;
            this.object.visible = false;
        }
    }

    getSurfaceNormalByPoint(point) {
        //super.getSurfaceNormalByPoint(point);
        return this.surfaceNormal;
    }

}

function Movement(speed, direction) {
    this.speed = speed;
    this.vector = direction;
}

class Ball extends Component {

    constructor(radius, x, y, z) {
        super();
        //let sphereRadius = 0.2;
        let material = setDefaultMaterial();
        let sphereGeometry = new THREE.SphereGeometry(radius, 32, 16);
        let sphereBox = new THREE.Mesh(sphereGeometry, material);
        let bbSphere = new THREE.Box3().setFromObject(sphereBox);
        sphereBox.position.set(x, y, z);
        bbSphere.setFromObject(sphereBox);
        this.boundingBox = bbSphere;
        this.object = sphereBox;
        this.helper = new THREE.Box3Helper(this.boundingBox, 'white' );
    }

    getHelper() {
        return this.helper;
    }

    setMovement(movementDir, movementSpeed) {
        this.movementDirection = movementDir;
        this.movementSpeed = movementSpeed;
    }

    update() {
        super.update();
        this.moveSphere();
        this.boundingBox.setFromObject(this.object);
        //console.log("ball update " + this.movementSpeed)
        //console.log(this.movementDirection)
    }

    moveSphere() {
        let posVector = new THREE.Vector3();
        this.object.getWorldPosition(posVector);
        let sphereX = posVector.x;
        let sphereY = posVector.y;

        const xAmount = (this.movementSpeed) * this.movementDirection.x;
        const yAmount = (this.movementSpeed) * this.movementDirection.y;

        this.object.matrixAutoUpdate = false;

        let mat4 = new THREE.Matrix4();
        this.object.matrix.identity(); // reset matrix

        this.object.matrix.multiply(
            mat4.makeTranslation(sphereX + xAmount, sphereY + yAmount, 0.0)
        );

        this.object.updateMatrixWorld();
    }

    collide(object) {
        if(object.active && this.lastColided != object.id){
            super.collide(object);
            let rayIntersectionPoint = this.getRayIntersectionPoint(object);
            let normal = object.getSurfaceNormalByPoint(rayIntersectionPoint);
            this.reflect(normal);
        }
        //object.surfaceNormal
    }

    reflect(normal) {
        let newDirection = this.movementDirection.reflect(normal);
        //let limit = Math.PI/2;
        let limit = null;
        let j = new THREE.Vector3(0, 1, 0);
        let angleToJ = newDirection.angleTo(j);
        let rotationAmount = angleToJ - limit +Math.PI/10;
        let xDirection = newDirection.x < 0? -1 : 1;


        if (limit != null && angleToJ >= limit) {
            newDirection = newDirection.applyAxisAngle(new THREE.Vector3(0, 0, 1), xDirection* rotationAmount);
        }

        this.setMovement(newDirection, this.movementSpeed)
    }


}

class Base extends Component{
    constructor(height, width, depth, x, y, z) {
        super();
        this.height = height;
        this.width = width;
        this.depth = depth;
        let baseGeometry = new THREE.BoxGeometry(width, height, depth);
        let base = new THREE.Mesh(baseGeometry, material);
        let bbBase = new THREE.Box3().setFromObject(base);
        this.object = base;
        this.boundingBox = bbBase;
        base.position.set(x, y, z);
        bbBase.setFromObject(this.object)
        this.surfaceNormal =  new THREE.Vector3(0, 1, 0);
    }

    update() {
        super.update();
        this.boundingBox.setFromObject(this.object)

    }

    setPosition(x, y, z) {
        super.setPosition(x, y, z);
        this.update();
    }

    collide(object) {
        super.collide(object);
    }

    getSurfaceNormalByPoint(point) {
        super.getSurfaceNormalByPoint(point);
        let relativeX = point.x - (this.getPosition().x - this.width/2)
        let relativeY = point.y - (this.getPosition().y - this.height/2)

       // return new THREE.Vector3(0, 1, 0);
        if(relativeX>=this.width/2){
            return new THREE.Vector3(0.5, 0.87, 0);
        }
        else {
            return new THREE.Vector3(-0.5, 0.87, 0);
        }

    }

    /*getPosition(){
        let pos = new THREE.Vector3();
        this.object.getWorldPosition(pos);
        return pos;
    }*/
}


export {Ball, Wall, Tile, Base}