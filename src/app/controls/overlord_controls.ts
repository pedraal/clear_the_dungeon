import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GameEngine } from '../game_engine'

export class OverlordControls {
  controls: OrbitControls
  engine: GameEngine

  constructor(engine: GameEngine) {
    this.engine = engine
    this.engine.camera.position.set(10, 10, 10)
    this.controls = new OrbitControls(this.engine.camera, this.engine.canvas)
    this.engine.updatables.push(this)
  }

  update() {
    this.controls.update()
  }
}
