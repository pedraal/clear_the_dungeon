import * as THREE from 'three'
import { Game } from '../game'
import { Mapping, Mappings } from '../mapping'

export class Coins {
  static MappingNames = [Mappings.Coin_A, Mappings.Coin_B, Mappings.Coin_C]
  game: Game
  coins: Mapping[]
  elapsedTicks: number
  score: number
  nextCoinAt: number

  constructor(game: Game) {
    this.game = game
    this.coins = []
    this.elapsedTicks = 0
    this.score = 0
    this.nextCoinAt = 0
    this.game.engine.updatables.push(this)
  }

  update(dt: number, elapsedTime: number) {
    if (elapsedTime > this.nextCoinAt) {
      this.generateCoin()
      const randomTime = Math.random() * 0.5 + 0.5
      this.nextCoinAt = elapsedTime + randomTime
    }

    for (const coin of this.coins) {
      const position = coin.body.translation()
      if (position.z < this.unspawnZ) this.removeCoin(coin)
      else if (this.game.character.hitbox.containsPoint(coin.body.translation() as unknown as THREE.Vector3))
        this.gather(coin)
      else coin.update()
    }
  }

  private gather(coin: Mapping) {
    switch (coin.mesh.name) {
      case 'Coin_A':
        this.game.score.incrementBy(3)
        break
      case 'Coin_B':
        this.game.score.incrementBy(2)
        break
      case 'Coin_C':
        this.game.score.incrementBy(1)
        break
    }
    this.removeCoin(coin)
  }

  private generateCoin() {
    const randomCoin = Math.floor(Math.random() * Coins.MappingNames.length)

    const coin = new Mapping({
      engine: this.game.engine,
      name: Coins.MappingNames[randomCoin],
      position: { x: this.spawnX(), y: this.spawnY(), z: this.spawnZ },
      bodyType: 'kinematic',
      shape: 'box',
      manualUpdate: true,
    })

    coin.body.setLinvel({ x: 0, y: 0, z: -7 }, true)

    this.coins.push(coin)
  }

  private removeCoin(coin: Mapping) {
    this.coins = this.coins.filter((m) => m !== coin)
    coin.remove()
  }

  private spawnX() {
    return (
      Math.floor(
        Math.random() *
          (this.game.map.xBoundings[1] * this.game.map.cellSide -
            this.game.map.xBoundings[0] * this.game.map.cellSide +
            1),
      ) +
      this.game.map.xBoundings[0] * this.game.map.cellSide
    )
  }

  private spawnY() {
    return Math.floor(Math.random() * 4) + 1
  }

  private get spawnZ() {
    return this.game.map.zBoundings[1] * this.game.map.cellSide
  }

  private get unspawnZ() {
    return (this.game.map.zBoundings[0] - 1) * this.game.map.cellSide
  }

  remove() {
    for (const coin of this.coins) coin.remove()
    this.game.engine.updatables = this.game.engine.updatables.filter((u) => u !== this)
  }
}
