import * as THREE from "three";
import {setDefaultMaterial,} from "../libs/util/util.js";
import {GameState} from "./gameState.js";
import {CSG} from "../libs/other/CSGMesh.js";
import {createTextTexture, getColor, loadGLTFFile} from "./utils.js";
import {SoundManager} from "./soundManager.js";




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

        /*if (this.scene) {
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
        }*/

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
    sound1;
    sound2;
    sound3;
    static TYPE_INDESTRUCTIBLE = 2;
    static TYPE_COMMON = 0;
    static TYPE_HARD = 1;

    constructor(width, height, depth, x, y, z, color, type = 1) {
        super();
        let boxGeometry = new THREE.BoxGeometry(width, height, depth);
        let material = new THREE.MeshLambertMaterial({color: getColor(type)})
        let box = new THREE.Mesh(boxGeometry, material);

        let listener = new THREE.AudioListener();
        box.add( listener );
        let sound = new THREE.Audio( listener );
        let audioLoader = new THREE.AudioLoader();
        this.sound1 = SoundManager.createSound(box, 'assets/sounds/bloco1.mp3')
        this.sound2 = SoundManager.createSound(box, 'assets/sounds/bloco2.mp3')
        this.sound3 = SoundManager.createSound(box, 'assets/sounds/bloco3.mp3')



        if(type == 2){
            let textureLoader = new THREE.TextureLoader();
            let texture  = textureLoader.load('assets/textures/stripes.png');
            box.material = new THREE.MeshLambertMaterial({color: "white"});
            box.material.map = texture;
            this.type = Tile.TYPE_HARD;
            this.maxhits = 2;

           this.soundEffect = SoundManager.createSound(box, 'assets/sounds/bloco2.mp3')

        }else if(type >2){
            this.maxhits = 1;
            this.type = Tile.TYPE_COMMON;
            this.soundEffect = SoundManager.createSound(box, 'assets/sounds/bloco1.mp3')

        }else if (type === 1){

            this.type = Tile.TYPE_INDESTRUCTIBLE;

        }
       // box.material.map = createTextTeture("AAAAA")


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
        //this.type = type;

        let edgesGeometry = new THREE.EdgesGeometry(boxGeometry); // or WireframeGeometry( geometry )
        let lineMaterial = new THREE.LineBasicMaterial({color: "black", linewidth: 1});
        let wireframe = new THREE.LineSegments(edgesGeometry, lineMaterial);

        this.wireframe = wireframe;

       /* if (type > 2) {
            this.type = 1;
        }*/

    }

    playSoundEffect(object){

        if(object instanceof Ball && object.state === Ball.STATE_UNSTOPPABLE){
           // SoundManager.play('bloco3')
            this.sound3.play()
        }

        else if(this.type === Tile.TYPE_COMMON){

            //SoundManager.play('bloco1')
            this.sound1.play()

        }

        else if(this.type === Tile.TYPE_INDESTRUCTIBLE || this.type === Tile.TYPE_HARD){
            this.sound2.play()

            // SoundManager.play('bloco2')
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
           // this.soundEffect.play();
            this.playSoundEffect(object);
            if (this.hits === this.maxhits && this.type !== Tile.TYPE_INDESTRUCTIBLE) {
                this.active = false;
                this.object.visible = false;


                if (this._onDestroy != null) {
                    this._onDestroy(this);
                }
            } else {
                this.getObject().material = new THREE.MeshLambertMaterial({color: 0xffffff});
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
    static STATE_NORMAL = 0;
    static STATE_UNSTOPPABLE = 1;
    _state = Ball.STATE_NORMAL;

    constructor(radius, x, y, z) {
        super();
        let material = new THREE.MeshPhongMaterial({color: 'white', shininess: 200});
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


    get state() {
        return this._state;
    }

    set state(value) {

        if(value === Ball.STATE_NORMAL){
            this.object.material = new THREE.MeshPhongMaterial({color: 'white', shininess: 200});
        }else if(value === Ball.STATE_UNSTOPPABLE){
            this.object.material = new THREE.MeshPhongMaterial({color: 'red', shininess: 200});
        }

        this._state = value;
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
            let lastCollided = this.collidedWith[this.collidedWith.length-1]

            if(this.state !== Ball.STATE_UNSTOPPABLE || !( lastCollided instanceof Tile)) {
                this.movementDirection = this.movementDirection.reflect(addedNormalVectors);
            }

            this.collidedWith = []
        }

    }

    collide(object) {
        if (object.active && this.lastCollided != object.id) {
            this.getObject();
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
        //let base2 = new THREE.Mesh(baseGeometry, material);
        let base = this.createCSGBase(height, width, depth);
        let bbBase = new THREE.Box3().setFromObject(base);
        base.material = new THREE.MeshLambertMaterial({color: "white"});

        let geometry = base.geometry;
        let material = base.material;

        // You must set an individual UV coordinate for each vertex of your scene
        // Learn more here:
        // https://discoverthreejs.com/book/first-steps/textures-intro/
      /*  var uvCoords = [0.0, 0.0,
            0.3, 1.0,
            0.5, 0.0,
            0.7, 1.0,
            1.0, 0.0];

        geometry.setAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( uvCoords), 2 ) );
*/
        // Load the texture and set to the material of the mesh
        //let texture  = textureLoader.load('assets/textures/stripes.png');

        let texture = new THREE.TextureLoader().load('assets/textures/stripes.png');
        material.map =  texture;



        this.object = base;
        this.boundingBox = bbBase;
        base.position.set(x, y, z);
        bbBase.setFromObject(this.object)
        this.surfaceNormal = new THREE.Vector3(0, 1, 0);
        this.helper = new THREE.Box3Helper(this.boundingBox, 'white');
        base.castShadow = true
        this.soundEffect = SoundManager.createSound(base, 'assets/sounds/rebatedor.mp3')
        loadGLTFFile('assets/objects/','UFO_Empty', 1.5, 180, true, base);

        /*base2.position.set(x, y, z);
        this.object = base2;*/
    }

    update() {
        super.update();
        this.boundingBox.setFromObject(this.object)
    }

    collide(object) {
        super.collide(object);
        this.soundEffect.stop();
        this.soundEffect.play();
    }

    getHelper() {
        return this.helper;
    }

    createCSGBase(height, width, depth) {
        let mat = new THREE.MeshPhongMaterial({color: 'red', shininess: 500});
        let cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(width, width, depth))
        let cylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(width / 2, width / 2, depth, 36))

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

class Life extends Component {
    constructor(radius, x, y, z) {
        super();
        let material = new THREE.MeshPhongMaterial({color: 'red', shininess: 200});
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

    destroyLife() {
        this.active = false;
        this.object.visible = false;
        this.object.removeFromParent();
        this.object.geometry.dispose();
        this.object.material.dispose();
    }


}

class PowerUpTile extends Tile {

    _onCollect;
    _onDestroy;

    constructor(width, height, depth, x, y, z, color, type) {
        super();
        let textureLoader = new THREE.TextureLoader();
        let boxGeometry = new THREE.BoxGeometry(width, height, depth);
        //let capsuleGeometry = new THREE.CapsuleGeometry(height, width, 16, 16);
        let texture  = type === 0? createTextTexture("T"):createTextTexture("S");
        //let texture  = createTextTeture("T");
        //let material = new THREE.MeshLambertMaterial({color: "white"})
        let material = new THREE.MeshLambertMaterial({
            color: type === 0?"white": "yellow",
            map: texture,
            side: THREE.DoubleSide,
        });

        let capsuleGeometry = new THREE.CapsuleGeometry(0.15, 0.40, 16, 16);
        capsuleGeometry.rotateY(Math.PI);

        // material.map = texture;

        let box = new THREE.Mesh(capsuleGeometry, material);
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
        //this.maxHits = maxHits;
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

    set onDestroy(func){
        this._onDestroy = func;
    }

    update() {
        super.update();

        let pos = this.getPosition();
        this.setPosition(pos.x, pos.y - this.fallSpeed, pos.z);
        this.object.rotateZ(this.fallSpeed)

        if (this.getPosition().y <= 0) {
            this._onDestroy();
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

export {Ball, Wall, Tile, Base, PowerUpTile, Life}