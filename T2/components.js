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
    collidedWith = []

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

        if(intersects.length == 0){
            return new THREE.Vector3(0,0,0)
        }

        //console.log(intersects[0])
        return intersects[0].point
    }
    collide(object) {
        this.collidedWith.push(object)

        this.lastColided = object.id;
        console.log(this._id + " colide com " + object.id )


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
        this.object.matrixAutoUpdate = true;
        this.object.position.set(x, y, z);
        //this.update();
        //this.object.updateMatrixWorld();
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

        box.castShadow = true;
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
    _onCollide = null;

    constructor(width, height, depth, x, y, z, color, maxHits=1) {
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
        this.width = width;
        this.height = height;
        box.castShadow = true;
        this.maxHits = maxHits;
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

    setOnCollide(func){
        this._onCollide  = func;
    }

    collide(object) {
        console.log(this.active)
        if(this.active===true){

            super.collide(object);
            this.hits++;

            if(this.hits ==this.maxHits){
                this.active = false;
                this.object.visible = false;
            }
            else{
                this.getObject().material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
            }


            if(this._onCollide != null){
                this._onCollide()
            }
        }
    }

    getSurfaceNormalByPoint(point) {
        //super.getSurfaceNormalByPoint(point);
        let relativeX = point.x - this.getPosition().x + this.width/2;
        let relativeY = point.y - this.getPosition().y + this.height/2;
        console.log(relativeX)

        if(relativeX <= 0){
            return new THREE.Vector3(-1,0,0);
        }else if(relativeX >=this.width){
            return new THREE.Vector3(1,0,0);
        }else if(relativeY>=this.height){
            return new THREE.Vector3(0,1,0);
        }else if(relativeY<= 0){
            return new THREE.Vector3(0,-1,0);
        }

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
        this.radius = radius;
        this.helper = new THREE.Box3Helper(this.boundingBox, 'white' );
        sphereBox.castShadow = true;
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
        this.reactToCollisions();
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

        //this.object.updateMatrixWorld();
    }

   /* getRayIntersectionPoint(object) {
        //return super.getRayIntersectionPoint(object);

        let raycaster = new THREE.Raycaster();
        let direction = this.movementDirection.normalize()
        raycaster.set(this.getPosition(), direction);
        let intersects = raycaster.intersectObject(object.getObject());

        return intersects[0].point
    }*/

    reactToCollisions(){

        if(this.collidedWith.length > 0){
            let addedNormalVectors = new THREE.Vector3(0,0,0)
            for(let i = 0; i< this.collidedWith.length; i++){
                let object = this.collidedWith[i]
                let rayIntersectionPoint = this.getRayIntersectionPoint(object);
                let normal = object.getSurfaceNormalByPoint(rayIntersectionPoint);
                addedNormalVectors = addedNormalVectors.add(normal);
            }
            addedNormalVectors = addedNormalVectors.normalize();

            let newDirection = this.movementDirection.reflect(addedNormalVectors);
            /*let raycaster = new THREE.Raycaster();
            raycaster.set(this.getPosition(), newDirection.normalize())

            for(let i = 0; i< this.collidedWith.length; i++) {
                if(raycaster.intersectObject(this.collidedWith[i].getObject())){
                    newDirection = addedNormalVectors;
                }
            }*/

            this.movementDirection = newDirection;

            console.log("Normal:")
            console.log(addedNormalVectors)

            this.collidedWith = []
        }

    }

    collide(object) {
        if(object.active && this.lastColided != object.id){
            super.collide(object);
            //let rayIntersectionPoint = this.getRayIntersectionPoint(object);
            //let normal = object.getSurfaceNormalByPoint(rayIntersectionPoint);
           // this.reflect(normal);
            //console.log("Normal:")
            //console.log(normal)
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
        this.helper = new THREE.Box3Helper(this.boundingBox, 'white' );

        base.castShadow = true
    }

    update() {
        super.update();
        this.boundingBox.setFromObject(this.object)
    }

    /*
    setPosition(x, y, z) {
        super.setPosition(x, y, z);
        this.update();
    }*/

    collide(object) {
        super.collide(object);
    }

    getHelper(){
        return this.helper;
    }

    getSurfaceNormalByPoint(point) {
        super.getSurfaceNormalByPoint(point);
        let relativeX = point.x - this.getPosition().x + this.width/2
        let relativeY = point.y - this.getPosition().y + this.height/2

        let normal = point.sub(this.getPosition()).multiplyScalar(-1).normalize()
        return normal;

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

class PowerUpTile extends Tile{

    constructor(width, height, depth, x, y, z, color, maxHits=1) {
        super();
        let boxGeometry = new THREE.BoxGeometry(width, height, depth);
        let material = new THREE.MeshLambertMaterial({color: "rgb(0,0,0)"})
        let box = new THREE.Mesh(boxGeometry, material);
        let bbBox = new THREE.Box3().setFromObject(box);
        box.position.set(x, y, z)
        bbBox.setFromObject(box);
        this.boundingBox = bbBox;
        this.object = box;
        this.surfaceNormal = new THREE.Vector3(0, -1, 0);
        this.helper = new THREE.Box3Helper(this.boundingBox, 'white' );
        this.width = width;
        this.height = height;
        box.castShadow = true;
        this.maxHits = maxHits;
    }

}
export {Ball, Wall, Tile, Base, PowerUpTile}