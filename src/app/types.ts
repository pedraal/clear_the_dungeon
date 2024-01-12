export interface Controls {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  movementVector: THREE.Vector3
  quaternion: THREE.Quaternion
  assignTarget(target: THREE.Object3D): void
  updateCamera(): void
}

export interface Updatable {
  update(deltaTime: number, elapsedTime: number): void
}
