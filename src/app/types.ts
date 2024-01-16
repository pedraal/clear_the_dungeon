import * as CANNON from 'cannon-es'
import { Character } from './props/character'

export interface Controls {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  velocity: CANNON.Vec3
  quaternion: CANNON.Quaternion
  assignTarget(target: Character): void
  updateCamera(): void
}

export interface Updatable {
  update(deltaTime: number, elapsedTime: number): void
}
