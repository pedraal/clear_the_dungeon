import { GameEngine } from "./game_engine";
import { Mapping, Mappings } from "./props/mapping";

export class Coins {
  static MappingNames = [Mappings.Coin_A, Mappings.Coin_B, Mappings.Coin_C]
  mappings: Mapping[];
  elapsedTicks: number;
  target: THREE.Object3D;
  score: number;
  nextCoinAt: number;

  constructor(target: THREE.Object3D) {
    this.target = target
    this.mappings = []
    this.elapsedTicks = 0
    this.score = 0
    this.nextCoinAt = 0
    GameEngine.instance.updatables.push(this)
    document.querySelector('#score')!.innerHTML = this.score.toString()
  }

  update(_dt, elapsedTime: number) {
    if (elapsedTime > this.nextCoinAt) {
      this.generateCoin()
      const randomTime = Math.random() * 0.5 + 0.5
      this.nextCoinAt = elapsedTime + randomTime
    }

    this.mappings.forEach(mapping => {
      mapping.mesh.position.z -= 0.1
      const coinPosition = mapping.mesh.position.clone()
      const targetPosition = this.target.position.clone()
      targetPosition.y = 1
      if (coinPosition.distanceTo(targetPosition) < 1) {
        this.hit(mapping)
      }
      if (mapping.mesh.position.z < -1) {
        this.removeCoin(mapping)
      }
    })
  }

  private hit(mapping: Mapping) {
    switch (mapping.mesh.name) {
      case 'Coin_A':
        this.score += 3
        break
      case 'Coin_B':
        this.score += 2
        break
      case 'Coin_C':
        this.score += 1
        break
    }
    document.querySelector('#score')!.innerHTML = this.score.toString()
    this.removeCoin(mapping)
  }

  private generateCoin() {
    const randomCoin = Math.floor(Math.random() * Coins.MappingNames.length)
    this.mappings.push(new Mapping({ name: Coins.MappingNames[randomCoin], position: { x: this.nextCoinPositionX(), y: 1, z: 40 } }))
  }

  private removeCoin(coin: Mapping) {
    this.mappings = this.mappings.filter(m => m !== coin)
    coin.remove()
  }

  private nextCoinPositionX() {
    return Math.floor(Math.random() * 14) - 7
  }

  remove() {
    this.mappings.forEach(mapping => mapping.remove())
    GameEngine.instance.updatables = GameEngine.instance.updatables.filter(u => u !== this)
  }
}
