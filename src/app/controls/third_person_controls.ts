import * as THREE from 'three'
import { Engine } from '../engine'

interface Params {
  engine: Engine
}

export class ThirdPersonControls {
  params: Params
  engine: Engine
  disabled: boolean
  camera: THREE.PerspectiveCamera
  target: THREE.Object3D<THREE.Object3DEventMap>
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  lookBackward: boolean
  isMouseLocked: boolean
  movementVector: THREE.Vector3
  quaternion: THREE.Quaternion

  constructor(params: Params) {
    this.params = params
    this.engine = this.params.engine
    this.camera = this.engine.camera

    this.movementVector = new THREE.Vector3(0, 0, 0)
    this.quaternion = new THREE.Quaternion()

    this.forward = false
    this.backward = false
    this.left = false
    this.right = false
    this.jump = false
    this.isMouseLocked = false

    this.disable()

    this.startListeners()
    this.engine.updatables.push(this)
  }

  update(_dt: number, _elapsedTime: number) {
    if (this.disabled) {
      this.movementVector.set(0, 0, 0)
      return
    }

    if (this.forward) this.movementVector.z = 1
    else if (this.backward) this.movementVector.z = -1
    else this.movementVector.z = 0

    if (this.left) this.movementVector.x = 1
    else if (this.right) this.movementVector.x = -1
    else this.movementVector.x = 0

    if (this.jump) this.movementVector.y = 2
    else this.movementVector.y = 0
  }

  assignTarget(target: THREE.Object3D) {
    this.target = target
    this.quaternion = this.target.quaternion.clone()
    this.updateCamera()
  }

  updateCamera() {
    const cameraPosition = this.lookBackward ? new THREE.Vector3(0, 2, 5) : new THREE.Vector3(-2, 4, -4)
    const cameraLookAt = this.lookBackward ? new THREE.Vector3(0, 0, -20) : new THREE.Vector3(0, 0, 20)

    const rotatedCameraPosition = cameraPosition.clone().applyQuaternion(this.target.quaternion)
    const rotatedCameraLookAt = cameraLookAt.clone().applyQuaternion(this.target.quaternion)

    this.camera.position.lerp(this.target.position.clone().add(rotatedCameraPosition), 0.05)
    this.camera.lookAt(this.target.position.clone().add(rotatedCameraLookAt))
  }

  enable() {
    this.disabled = false
    this.lookBackward = false
  }

  disable() {
    this.disabled = true
    this.lookBackward = true
    document.exitPointerLock()
  }

  startListeners() {
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)

    document.addEventListener('click', this.onClick)
    document.addEventListener('contextmenu', this.onRightClickPressed)
    document.addEventListener('mouseup', this.onRightClickReleased)
    document.addEventListener('mousemove', this.onMouseMove)

    document.addEventListener('pointerlockchange', this.onPointerLockChange)
  }

  stopListeners() {
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)

    document.addEventListener('click', this.onClick)
    document.removeEventListener('contextmenu', this.onRightClickPressed)
    document.removeEventListener('mouseup', this.onRightClickReleased)
    document.removeEventListener('mousemove', this.onMouseMove)
  }

  onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'z':
      case 'ArrowUp':
        this.backward = false
        this.forward = true
        break
      case 's':
      case 'ArrowDown':
        this.forward = false
        this.backward = true
        break
      case 'q':
      case 'ArrowLeft':
        this.right = false
        this.left = true
        break
      case 'd':
      case 'ArrowRight':
        this.left = false
        this.right = true
        break
      case ' ':
        this.jump = true
        break
    }
  }

  onKeyUp = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'z':
      case 'ArrowUp':
        this.forward = false
        break
      case 's':
      case 'ArrowDown':
        this.backward = false
        break
      case 'q':
      case 'ArrowLeft':
        this.left = false
        break
      case 'd':
      case 'ArrowRight':
        this.right = false
        break
      case ' ':
        this.jump = false
        break
    }
  }

  onClick = () => {
    if (this.isMouseLocked || this.disabled) return

    this.engine.canvas.requestPointerLock()
  }

  onRightClickPressed = (event: MouseEvent) => {
    if (event.button === 2) {
      event.preventDefault()
    }
  }

  onRightClickReleased = (event: MouseEvent) => {
    if (event.button === 2) {
      event.preventDefault()
    }
  }

  onPointerLockChange = () => {
    this.isMouseLocked = document.pointerLockElement === this.engine.canvas
  }

  onMouseMove = (event: MouseEvent) => {
    if (!this.isMouseLocked) return

    const deltaX = event.movementX

    const rotationSensitivity = 0.003

    this.quaternion.multiply(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -deltaX * rotationSensitivity),
    )
  }
}
