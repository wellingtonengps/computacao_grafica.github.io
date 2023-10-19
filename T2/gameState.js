
class GameState{
    static nextUID = 0;
    static baseId = null;
    static ballId = null;
    static getNextUID(){
        this.nextUID ++;
        return this.nextUID;
    }

}

export {GameState}