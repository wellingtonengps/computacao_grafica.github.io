import * as THREE from "three";
import {setDefaultMaterial,} from "../libs/util/util.js";
import {GameState} from "./gameState.js";
import {CSG} from "../libs/other/CSGMesh.js";
import {getColor} from "./utils.js";


let material = setDefaultMaterial();

class Component {
    boundingBox = null;
    object = null;
    _id = null;
    _surfaceNormal = null;
    active = true;
    _scene = null;
    _lastCollided = null;
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

    getRayIntersectionPoint(object) {
        let raycaster = new THREE.Raycaster();
        let direction = object.getPosition().sub(this.getPosition()).normalize()
        raycaster.set(this.getPosition(), direction);
        let intersects = raycaster.intersectObject(object.getObject());

        if (this.scene) {
            const material = new THREE.LineBasicMaterial({
                color: "rgb(255,255,255)",
                linewidth: 2
            });


            const points = [];
            points.push(object.getPosition().add(new THREE.Vector3(0, 0, 0.5)));
            points.push(this.getPosition().add(new THREE.Vector3(0, 0, 0.5)));


            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            const line = new THREE.Line(geometry, material);
            this._scene.add(line);
        }

        if (intersects.length === 0) {
            return new THREE.Vector3(0, 0, 0)
        }

        return intersects[0].point
    }

    collide(object) {
        this.collidedWith.push(object)

        this.lastCollided = object.id;
    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }


    get lastCollided() {
        return this._lastCollided;
    }

    set lastCollided(value) {
        this._lastCollided = value;
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

    setPosition(x, y, z) {
        this.object.matrixAutoUpdate = true;
        this.object.position.set(x, y, z);
    }

    getPosition() {
        let pos = new THREE.Vector3();
        this.object.getWorldPosition(pos);
        return pos;
    }

    deleteObject() {
        this.object.geometry.dispose();
        this.object.material.dispose();
        this.object.visible = false;
        this.object.active = false;
    }

    getSurfaceNormalByPoint(point) {
    }
}

class Wall extends Component {

    constructor(height, width, depth, x, y, z) {
        super();
        let material = new THREE.MeshLambertMaterial({color: "rgb(71, 69, 78)"});
        let boxGeometry = new THREE.BoxGeometry(height, width, depth);
        let box = new THREE.Mesh(boxGeometry, material);
        box.position.set(x, y, z);
        let bbBox = new THREE.Box3().setFromObject(box);
        bbBox.setFromObject(box);

        this.boundingBox = bbBox;
        this.object = box;
        this.surfaceNormal = new THREE.Vector3(0, -1, 0);
        this.helper = new THREE.Box3Helper(this.boundingBox, 'white');

        box.castShadow = true;
    }

    getHelper() {
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
    _onDestroy = null;

    constructor(width, height, depth, x, y, z, color, maxHits = 1) {
        super();
        let boxGeometry = new THREE.BoxGeometry(width, height, depth);
        let material = new THREE.MeshPhongMaterial({color: getColor(maxHits)})
        let box = new THREE.Mesh(boxGeometry, material);
        let bbBox = new THREE.Box3().setFromObject(box);
        box.position.set(x, y, z)
        bbBox.setFromObject(box);
        this.boundingBox = bbBox;
        this.object = box;
        this.surfaceNormal = new THREE.Vector3(0, -1, 0);
        this.helper = new THREE.Box3Helper(this.boundingBox, 'white');
        this.width = width;
        this.height = height;
        box.castShadow = true;
        this.maxHits = maxHits;

        let edgesGeometry = new THREE.EdgesGeometry(boxGeometry); // or WireframeGeometry( geometry )
        let lineMaterial = new THREE.LineBasicMaterial({color: "black", linewidth: 1});
        let wireframe = new THREE.LineSegments(edgesGeometry, lineMaterial);

        this.wireframe = wireframe;

        if (maxHits > 2) {
            this.maxHits = 1;
        }
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

    setOnDestroy(func) {
        this._onDestroy = func;
    }

    collide(object) {
        if (this.active === true && object instanceof Ball) {

            super.collide(object);
            this.hits++;

            if (this.hits === this.maxHits) {
                this.active = false;
                this.object.visible = false;

                if (this._onDestroy != null) {
                    this._onDestroy(this);
                }
            } else {
                this.getObject().material = new THREE.MeshBasicMaterial({color: 0xffffff});
            }

        }
    }

    getSurfaceNormalByPoint(point) {
        let relativeX = point.x - this.getPosition().x + this.width / 2;
        let relativeY = point.y - this.getPosition().y + this.height / 2;

        if (relativeX <= 0) {
            return new THREE.Vector3(-1, 0, 0);
        } else if (relativeX >= this.width) {
            return new THREE.Vector3(1, 0, 0);
        } else if (relativeY >= this.height) {
            return new THREE.Vector3(0, 1, 0);
        } else if (relativeY <= 0) {
            return new THREE.Vector3(0, -1, 0);
        }

        return this.surfaceNormal;
    }

}

class Ball extends Component {

    constructor(radius, x, y, z) {
        super();
        let material = setDefaultMaterial();
        let sphereGeometry = new THREE.SphereGeometry(radius, 32, 16);
        let sphereBox = new THREE.Mesh(sphereGeometry, material);
        let bbSphere = new THREE.Box3().setFromObject(sphereBox);
        sphereBox.position.set(x, y, z);
        bbSphere.setFromObject(sphereBox);
        this.boundingBox = bbSphere;
        this.object = sphereBox;
        this.radius = radius;
        this.helper = new THREE.Box3Helper(this.boundingBox, 'white');
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

    }

    reactToCollisions() {

        if (this.collidedWith.length > 0) {
            let addedNormalVectors = new THREE.Vector3(0, 0, 0)
            for (let i = 0; i < this.collidedWith.length; i++) {
                let object = this.collidedWith[i]
                let rayIntersectionPoint = this.getRayIntersectionPoint(object);
                let normal = object.getSurfaceNormalByPoint(rayIntersectionPoint);
                addedNormalVectors = addedNormalVectors.add(normal);
            }
            addedNormalVectors = addedNormalVectors.normalize();

            this.movementDirection = this.movementDirection.reflect(addedNormalVectors);

            this.collidedWith = []
        }

    }

    collide(object) {
        if (object.active && this.lastCollided != object.id) {
            super.collide(object);
        }
    }

    reflect(normal) {
        let newDirection = this.movementDirection.reflect(normal);
        //let limit = Math.PI/2;
        let limit = null;
        let j = new THREE.Vector3(0, 1, 0);
        let angleToJ = newDirection.angleTo(j);
        let rotationAmount = angleToJ - limit + Math.PI / 10;
        let xDirection = newDirection.x < 0 ? -1 : 1;

        if (limit != null && angleToJ >= limit) {
            newDirection = newDirection.applyAxisAngle(new THREE.Vector3(0, 0, 1), xDirection * rotationAmount);
        }

        this.setMovement(newDirection, this.movementSpeed)
    }

}

class Base extends Component {
    constructor(height, width, depth, x, y, z) {
        super();
        this.height = height;
        this.width = 2 * Math.sqrt(Math.pow((width / 2), 2) - Math.pow((width / 2 - height), 2));
        this.depth = depth;
        let baseGeometry = new THREE.BoxGeometry(width, height, depth);
        let base2 = new THREE.Mesh(baseGeometry, material);
        let base = this.createCSGBase(height, width, depth);
        let bbBase = new THREE.Box3().setFromObject(base);
        this.object = base;
        this.boundingBox = bbBase;
        base.position.set(x, y, z);
        bbBase.setFromObject(this.object)
        this.surfaceNormal = new THREE.Vector3(0, 1, 0);
        this.helper = new THREE.Box3Helper(this.boundingBox, 'white');
        base.castShadow = true
        /*base2.position.set(x, y, z);
        this.object = base2;*/
    }

    update() {
        super.update();
        this.boundingBox.setFromObject(this.object)
    }

    collide(object) {
        super.collide(object);
    }

    getHelper() {
        return this.helper;
    }

    createCSGBase(height, width, depth) {
        let mat = new THREE.MeshPhongMaterial({color: 'red', shininess: 500});
        let cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(width, width, depth))
        let cylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(width / 2, width / 2, depth, 20))

        cubeMesh.position.set(0, -height - (width / 2 - height + height / 2), 0)
        cubeMesh.matrixAutoUpdate = false;
        cubeMesh.updateMatrix();

        cylinderMesh.position.set(0, -(width / 2 - height + height / 2), 0)
        cylinderMesh.rotateX(Math.PI / 2)
        cylinderMesh.matrixAutoUpdate = false;
        cylinderMesh.updateMatrix();

        let outerCyCSG = CSG.fromMesh(cylinderMesh)
        let cubeCSG = CSG.fromMesh(cubeMesh);

        let csgBase = outerCyCSG.subtract(cubeCSG)

        let base = CSG.toMesh(csgBase, new THREE.Matrix4())
        base.material = new THREE.MeshPhongMaterial({color: 'yellow', shininess: 500})
        //base.position.set(1, 10, 0)
        //this.base.object = base;
        // scene.add(base)

        return base;
    }

    getSurfaceNormalByPoint(point) {
        super.getSurfaceNormalByPoint(point);
        let relativeX = point.x - this.getPosition().x + this.width / 2
        let relativeY = point.y - this.getPosition().y + this.height / 2

        let normal = point.sub(this.getPosition().sub(new THREE.Vector3(0, 1, 0))).multiplyScalar(-1).normalize()
        return normal;

        if (relativeX >= this.width / 2) {
            return new THREE.Vector3(0.5, 0.87, 0);
        } else {
            return new THREE.Vector3(-0.5, 0.87, 0);
        }

    }
}

class PowerUpTile extends Tile {

    _onCollect;

    constructor(width, height, depth, x, y, z, color, maxHits = 1) {
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
        this.helper = new THREE.Box3Helper(this.boundingBox, 'white');
        this.width = width;
        this.height = height;
        box.castShadow = true;
        this.maxHits = maxHits;
        this.fallSpeed = 0.1;
        this.active = false;
        this.collected = false;

    }


    get onCollect() {
        return this._onCollect;
    }

    set onCollect(value) {
        this._onCollect = value;
    }

    update() {
        super.update();

        let pos = this.getPosition();
        this.setPosition(pos.x, pos.y - this.fallSpeed, pos.z);

        if (this.getPosition().y <= 0) {
            this.destroyTile()
        }
    }

    destroyTile() {
        this.active = false;
        this.object.visible = false;
        this.object.removeFromParent();
        this.object.geometry.dispose();
        this.object.material.dispose();
    }


    collide(object) {

        if (object.id === GameState.baseId && !this.collected) {
            this.collected = true;

            if (this.onCollect !== null) {
                this.onCollect(this);
            }
            this.destroyTile();
        }


    }

}

export {Ball, Wall, Tile, Base, PowerUpTile}