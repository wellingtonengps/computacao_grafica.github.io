import * as THREE from "three";

class SoundManager{

    static createSound(object, filePath){

        let listener = new THREE.AudioListener();
        object.add( listener );
        let sound = new THREE.Audio( listener );
        let audioLoader = new THREE.AudioLoader();
        audioLoader.load( filePath, function( buffer ) {
            sound.setBuffer( buffer );
            sound.setLoop( false );
            sound.setVolume( 0.5 );
            //sound.play();
        });

        return sound;
    }
}

export {SoundManager}