import { Character } from './character'

export interface Controls {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  velocity: THREE.Vector3
  quaternion: THREE.Quaternion
  assignTarget(target: Character): void
  updateCamera(): void
}

export interface Updatable {
  update(deltaTime: number, elapsedTime: number): void
}
