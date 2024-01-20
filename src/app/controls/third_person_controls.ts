import * as THREE from 'three'
import { Character } from '../character'
import { Engine } from '../engine'
import { BaseKeyboardControls } from './base_keyboard_controls'

interface Params {
  engine: Engine
}

export class ThirdPersonControls extends BaseKeyboardControls {
  disabled: boolean
  lookBackward: boolean
  isMouseLocked: boolean

  constructor(params: Params) {
    super(params)
    this.isMouseLocked = false
    this.disable()
    this.startMouseListeners()
  }

  update() {
    if (this.disabled) {
      this.velocity.set(0, 0, 0)
      return
    }

    super.update()
  }

  assignTarget(target: Character) {
    this.target = target
    const rotation = this.target.body.rotation()
    this.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
    this.updateCamera()
  }

  updateCamera() {
    const cameraPosition = this.lookBackward ? new THREE.Vector3(0, 2, 5) : new THREE.Vector3(-2, 4, -4)
    const cameraLookAt = this.lookBackward ? new THREE.Vector3(0, 0, -20) : new THREE.Vector3(0, 0, 20)

    const rotatedCameraPosition = cameraPosition.clone().applyQuaternion(this.target.mesh.quaternion)
    const rotatedCameraLookAt = cameraLookAt.clone().applyQuaternion(this.target.mesh.quaternion)

    this.camera.position.lerp(this.target.mesh.position.clone().add(rotatedCameraPosition), 0.05)
    this.camera.lookAt(this.target.mesh.position.clone().add(rotatedCameraLookAt))
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

  startMouseListeners() {
    document.addEventListener('click', this.onClick)
    document.addEventListener('contextmenu', this.onRightClickPressed)
    document.addEventListener('mouseup', this.onRightClickReleased)
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('pointerlockchange', this.onPointerLockChange)
  }

  stopMouseListeners() {
    document.addEventListener('click', this.onClick)
    document.removeEventListener('contextmenu', this.onRightClickPressed)
    document.removeEventListener('mouseup', this.onRightClickReleased)
    document.removeEventListener('mousemove', this.onMouseMove)
    document.addEventListener('pointerlockchange', this.onPointerLockChange)
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

    this.quaternion = this.quaternion.multiply(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -deltaX * rotationSensitivity),
    )
  }
}
