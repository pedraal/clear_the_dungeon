import { GameEngine } from "./game_engine";
import { Mapping, Mappings } from "./props/mapping";

export class Coins {
  static MappingNames = [Mappings.Coin_A, Mappings.Coin_B, Mappings.Coin_C]
  engine: GameEngine;
  mappings: Mapping[];
  elapsedTicks: number;
  score: number;
  nextCoinAt: number;

  constructor(engine: GameEngine) {
    this.engine = engine
    this.mappings = []
    this.elapsedTicks = 0
    this.score = 0
    this.nextCoinAt = 0
    GameEngine.instance.updatables.push(this)
    this.renderScore()
  }

  update(_dt: number, elapsedTime: number) {
    if (elapsedTime > this.nextCoinAt) {
      this.generateCoin()
      const randomTime = Math.random() * 0.5 + 0.5
      this.nextCoinAt = elapsedTime + randomTime
    }

    this.mappings.forEach(mapping => {
      mapping.mesh.position.z -= 0.1
      const coinPosition = mapping.mesh.position.clone()
      if (mapping.mesh.position.z < this.unspawnZ) {
        this.removeCoin(mapping)
      }

      if (!this.target) return
      const targetPosition = this.target.position.clone()
      targetPosition.y = 1
      if (coinPosition.distanceTo(targetPosition) < 1) {
        this.hit(mapping)
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
    this.renderScore()
    this.removeCoin(mapping)
  }

  private renderScore() {
    document.querySelectorAll('.score').forEach(el => el.innerHTML = this.score.toString())

  }

  private generateCoin() {
    const randomCoin = Math.floor(Math.random() * Coins.MappingNames.length)
    this.mappings.push(new Mapping({ name: Coins.MappingNames[randomCoin], position: { x: this.nextCoinPositionX(), y: 1, z: this.spawnZ } }))
  }

  private removeCoin(coin: Mapping) {
    this.mappings = this.mappings.filter(m => m !== coin)
    coin.remove()
  }

  private nextCoinPositionX() {
    return Math.floor(Math.random() * 14) - 7
  }

  private get target() {
    return this.engine.character.mesh
  }

  private get spawnZ() {
    return this.engine.map.zBoundings[1] * this.engine.map.cellSide
  }

  private get unspawnZ() {
    return (this.engine.map.zBoundings[0] - 1) * this.engine.map.cellSide
  }

  remove() {
    this.mappings.forEach(mapping => mapping.remove())
    GameEngine.instance.updatables = GameEngine.instance.updatables.filter(u => u !== this)
  }
}
