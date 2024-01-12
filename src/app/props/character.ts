import * as THREE from 'three'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Engine } from '../engine'
import { Controls } from '../types'
import { GLTFUtils } from '../utils/gltf_utils'
import { State, StateMachine } from '../utils/state_machine'

interface Params {
  engine: Engine
  name: string
  position: { x: number; y: number; z: number }
  orientation?: number
  controls?: Controls
}

export enum Characters {
  Barbarian = 'Barbarian',
  Knight = 'Knight',
  // Mage = 'Mage',
  // Rogue = 'Rogue',
  // Rogue_Hooded = 'Rogue_Hooded',
}

export class Character {
  static gltfs: Record<string, GLTF> = {}
  static loader = new GLTFLoader()
  static async load() {
    const loadPromise = (name: string): Promise<void> =>
      new Promise((resolve) => {
        Character.loader.load(
          `/gltf/characters/${name}.glb`,
          (model) => {
            Character.gltfs[name] = model
            resolve()
          },
          (xhr) => {
            // console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
          },
          (error) => {
            console.error('GLTFLoader : ', error)
          },
        )
      })

    await Promise.all(Object.values(Characters).map((name) => loadPromise(name)))
  }

  params: Params
  engine: Engine
  mesh: THREE.Group
  mixer: THREE.AnimationMixer
  model: GLTF
  controls: Controls | undefined
  stateMachine: CharacterStateMachine

  constructor(params: Params) {
    this.params = params
    this.engine = this.params.engine
    this.initModel()
    this.initEquipement()
    this.initControls()
    this.initAnimations()

    this.stateMachine = new CharacterStateMachine(this)
    this.stateMachine.setState('idle')

    this.engine.scene.add(this.mesh)
    this.engine.updatables.push(this)
  }

  private initModel() {
    this.model = GLTFUtils.cloneGltf(Character.gltfs[this.params.name]) as GLTF
    this.mesh = this.model.scene
    this.mesh.receiveShadow = true
    this.mesh.position.copy(this.params.position as THREE.Vector3)
    this.mesh.position.y -= 2
    this.mesh.rotation.y = Math.PI * (this.params.orientation || 0)
  }

  private initAnimations() {
    this.mixer = new THREE.AnimationMixer(this.mesh)
  }

  private initControls() {
    this.controls = this.params.controls
    if (this.controls) {
      this.controls.assignTarget(this.mesh)
    }
  }

  private initEquipement() {
    let left: THREE.Bone | undefined
    let right: THREE.Bone | undefined

    this.mesh.traverse((node) => {
      if (node instanceof THREE.Bone && node.name === 'handslotl') {
        left = node
      } else if (node instanceof THREE.Bone && node.name === 'handslotr') {
        right = node
      }
    })

    if (left) {
      left.clear()
    }
    if (right) {
      right.children = right.children.splice(0, 1)
    }
  }

  update(dt: number, elapsedTime: number) {
    this.mixer.update(dt)
    this.handleMovement(dt)
    this.stateMachine.currentState?.update(dt, elapsedTime)
  }

  private handleMovement(dt: number) {
    if (!this.controls) return

    const movementVector = this.controls.movementVector.clone()
    const velocity = 6 * dt
    this.mesh.position.add(movementVector.clone().multiplyScalar(velocity))

    this.controls.updateCamera()
  }

  getAnimation(name: string) {
    return this.model.animations.find((a) => a.name === name) as THREE.AnimationClip
  }
}

class CharacterStateMachine extends StateMachine {
  character: Character
  constructor(character: Character) {
    super()
    this.character = character
    this.init()
  }

  init() {
    this.addState('idle', IdleState)
    this.addState('running', RunningState)
    this.addState('strafing_left', StrafingLeftState)
    this.addState('strafing_right', StrafingRightState)
    this.addState('walking_backward', WalkingBackwardState)
  }

  get direction() {
    const direction = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    }

    if (!this.character.controls) return direction

    const movementVector = this.character.controls.movementVector
    if (movementVector.z === -1) {
      direction.backward = true
    } else if (movementVector.x === -1) {
      direction.right = true
    } else if (movementVector.x === 1) {
      direction.left = true
    } else if (movementVector.z === 1) {
      direction.forward = true
    }

    return direction
  }
}

class CharacterState extends State {
  machine: CharacterStateMachine
  animation: string

  get action() {
    return this.machine.character.mixer.clipAction(this.machine.character.getAnimation(this.animation))
  }

  enter(prevState?: CharacterState) {
    if (prevState) {
      this.action.time = 0.0
      this.action.enabled = true
      this.action.setEffectiveTimeScale(1.0)
      this.action.setEffectiveWeight(1.0)
      this.action.crossFadeFrom(prevState.action, 0.2, true)
      this.action.play()
    } else {
      this.action.play()
    }
  }
}

class IdleState extends CharacterState {
  name = 'idle'
  animation = 'Idle'

  update() {
    if (this.machine.direction.forward) this.machine.setState('running')
    else if (this.machine.direction.backward) this.machine.setState('walking_backward')
    else if (this.machine.direction.left) this.machine.setState('strafing_left')
    else if (this.machine.direction.right) this.machine.setState('strafing_right')
  }
}

class RunningState extends CharacterState {
  name = 'running'
  animation = 'Running_A'

  update() {
    if (!this.machine.direction.forward) this.machine.setState('idle')
    else if (this.machine.direction.backward) this.machine.setState('walking_backward')
    else if (this.machine.direction.left) this.machine.setState('strafing_left')
    else if (this.machine.direction.right) this.machine.setState('strafing_right')
  }
}

class StrafingLeftState extends CharacterState {
  name = 'strafing_left'
  animation = 'Running_Strafe_Left'

  update() {
    if (!this.machine.direction.left) this.machine.setState('idle')
    else if (this.machine.direction.backward) this.machine.setState('walking_backward')
    else if (this.machine.direction.forward) this.machine.setState('running')
    else if (this.machine.direction.right) this.machine.setState('strafing_right')
  }
}
class StrafingRightState extends CharacterState {
  name = 'strafing_right'
  animation = 'Running_Strafe_Right'

  update() {
    if (!this.machine.direction.right) this.machine.setState('idle')
    else if (this.machine.direction.backward) this.machine.setState('walking_backward')
    else if (this.machine.direction.forward) this.machine.setState('running')
    else if (this.machine.direction.left) this.machine.setState('strafing_left')
  }
}

class WalkingBackwardState extends CharacterState {
  name = 'walking_backward'
  animation = 'Walking_Backwards'

  update() {
    if (!this.machine.direction.backward) this.machine.setState('idle')
    else if (this.machine.direction.forward) this.machine.setState('running')
    else if (this.machine.direction.left) this.machine.setState('strafing_left')
    else if (this.machine.direction.right) this.machine.setState('strafing_right')
  }
}
