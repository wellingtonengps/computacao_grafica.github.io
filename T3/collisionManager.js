class CollisionManager{

    collidableObjs = [] // outros objetos
    colliderObjs = [] // bolinhas

    constructor() {
    }

    checkCollisions(){
        for(let i = 0; i < this.colliderObjs.length; i++){

            for(let j = 0; j <  this.collidableObjs.length; j++){

                let collided = this.colliderObjs[i].getBoundingBox().intersectsBox(this.collidableObjs[j].getBoundingBox())

                if(collided && this.colliderObjs[i].id !== this.collidableObjs[j].id){
                    this.colliderObjs[i].collide(this.collidableObjs[j])
                    this.collidableObjs[j].collide(this.colliderObjs[i])
                }
            }
        }
    }

    registerCollider(object){
        this.colliderObjs.push(object)
    }

    registerCollidable(object){
        this.collidableObjs.push(object)
    }

}

export {CollisionManager}