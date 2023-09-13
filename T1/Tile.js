import * as THREE from "three";

class Tile{
    constructor(color, position) {
        this.color = color;
        this.position = position;
        this.object = this.buildObject(color, position);
    }


    buildObject(color, position){
        let tileMaterial = new THREE.MeshLambertMaterial({ color: color });
        let boxGeometry = new THREE.BoxGeometry(1, 0.5, 0.5);
        let box = new THREE.Mesh(boxGeometry, tileMaterial);

        // position the box
        box.position.set(position.x, position.y, position.z);

        return box;
    }

    getObject(){
        return this.object;
    }

}