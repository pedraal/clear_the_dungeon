export interface Controls {
  assignTarget(target: THREE.Object3D): void
  movementVector: THREE.Vector3
  updateCamera(): void
}

export interface Updatable {
  update(deltaTime: number, elapsedTime: number): void
}
