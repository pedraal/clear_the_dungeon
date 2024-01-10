import * as THREE from 'three'
import { Engine } from '../engine'

interface Params {
  engine: Engine
  disabledAxes?: ('x' | 'y' | 'z')[]
}

export class ThirdPersonControls {
  params: Params
  engine: Engine
  disabledAxes: ('x' | 'y' | 'z')[]
  camera: THREE.PerspectiveCamera
  target: THREE.Object3D<THREE.Object3DEventMap>
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  lookBackward: boolean
  movementVector: THREE.Vector3

  constructor(params: Params) {
    this.params = params
    this.engine = this.params.engine
    this.camera = this.engine.camera
    this.disabledAxes = this.params.disabledAxes || []

    this.movementVector = new THREE.Vector3(0, 0, 0)

    this.forward = false
    this.backward = false
    this.left = false
    this.right = false
    this.jump = false

    this.lookBackward = true

    this.startListeners()
    this.engine.updatables.push(this)
  }

  update(_dt: number, _elapsedTime: number) {
    if (!this.disabledAxes.includes('z')) {
      if (this.forward) this.movementVector.z = 1
      else if (this.backward) this.movementVector.z = -1
      else this.movementVector.z = 0
    } else this.movementVector.z = 0

    if (!this.disabledAxes.includes('x')) {
      if (this.left) this.movementVector.x = 1
      else if (this.right) this.movementVector.x = -1
      else this.movementVector.x = 0
    } else this.movementVector.x = 0

    if (!this.disabledAxes.includes('y')) {
      if (this.jump) this.movementVector.y = 2
      else this.movementVector.y = 0
    } else this.movementVector.y = 0
  }

  assignTarget(target: THREE.Object3D) {
    this.target = target
    this.updateCamera()
  }

  updateCamera() {
    const cameraPosition = this.lookBackward ? new THREE.Vector3(0, 2, 5) : new THREE.Vector3(-2, 4, -4)
    const cameraLookAt = this.lookBackward ? new THREE.Vector3(0, 0, -20) : new THREE.Vector3(0, 0, 20)

    this.camera.position.lerp(this.target.position.clone().add(cameraPosition), 0.05)
    this.camera.lookAt(this.target.position.clone().add(cameraLookAt))
  }

  startListeners() {
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('contextmenu', (event) => event.preventDefault())
  }

  stopListeners() {
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('contextmenu', (event) => event.preventDefault())
  }

  onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'z':
        this.backward = false
        this.forward = true
        break
      case 's':
        this.forward = false
        this.backward = true
        break
      case 'q':
        this.right = false
        this.left = true
        break
      case 'd':
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
        this.forward = false
        break
      case 's':
        this.backward = false
        break
      case 'q':
        this.left = false
        break
      case 'd':
        this.right = false
        break
      case ' ':
        this.jump = false
        break
    }
  }
}
