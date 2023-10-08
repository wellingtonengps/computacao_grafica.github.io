
class GameState{
    static nextUID = 0;
    static getNextUID(){
        this.nextUID ++;
        return this.nextUID;
    }

}

export {GameState}