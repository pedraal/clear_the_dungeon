import * as THREE from 'three'
import { Game } from '../game'
import { Mapping, Mappings } from '../mapping'

export class Coins {
  static MappingNames = [Mappings.coin_a, Mappings.coin_b, Mappings.coin_c]
  game: Game
  coins: Mapping[]
  score: number
  nextCoinAt: number

  constructor(game: Game) {
    this.game = game
    this.coins = []
    this.game.engine.updatables.push(this)
  }

  update(dt: number, elapsedTime: number) {
    for (const coin of this.coins) {
      if (this.game.character.hitbox.containsPoint(coin.body.translation() as unknown as THREE.Vector3))
        this.removeCoin(coin)
      else coin.update()
    }
  }

  private spawnCoin(x, y, z) {
    const randomCoin = Math.floor(Math.random() * Coins.MappingNames.length)

    const coin = new Mapping({
      engine: this.game.engine,
      name: Coins.MappingNames[randomCoin],
      position: { x, y, z },
      bodyType: 'kinematic',
      shape: 'box',
      manualUpdate: true,
    })

    this.coins.push(coin)
  }

  private removeCoin(coin: Mapping) {
    this.coins = this.coins.filter((m) => m !== coin)
    coin.remove()
  }
}
