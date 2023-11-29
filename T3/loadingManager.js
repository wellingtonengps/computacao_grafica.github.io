import * as THREE from "three";
class LoadingManager{

    static loading(onButtonPressed){
        const loadingManager= new THREE.LoadingManager( () => {
            let loadingScreen = document.getElementById( 'loading-screen' );
            loadingScreen.transition = 0;
            loadingScreen.style.setProperty('--speed1', '0');
            loadingScreen.style.setProperty('--speed2', '0');
            loadingScreen.style.setProperty('--speed3', '0');

            let button1 = document.getElementById("myBtn");
            let button2 = document.getElementById("myBtn2");
            let button3 = document.getElementById("myBtn3");


            button1.style.backgroundColor = 'Red';
            button1.innerHTML = 'Iniciar';
            button1.addEventListener("click", onButtonPressed);

            button2.style.backgroundColor = 'Green';
            button2.innerHTML = 'Reiniciar';
            button2.addEventListener("click", onButtonPressed);

            button3.style.backgroundColor = 'Blue';
            button3.innerHTML = 'Jogar novamente';
            button3.addEventListener("click", onButtonPressed);
        })

        return loadingManager;
    }
}

export {LoadingManager}