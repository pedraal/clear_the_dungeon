import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Engine, PhysicDebuggerModes } from './engine'
import { Controls } from './types'
import { CannonUtils } from './utils/cannon_utils'
import { GenericModel } from './utils/generic_model'
import { GLTFUtils } from './utils/gltf_utils'
import { State, StateMachine } from './utils/state_machine'

interface Params {
  engine: Engine
  name: string
  position: { x: number; y: number; z: number }
  orientation?: number
  controls?: Controls
}

export class Character extends GenericModel {
  static async load() {
    return GenericModel.load('characters', 'glb', Object.values(Characters))
  }

  params: Params
  engine: Engine
  mesh: THREE.Group
  body: CANNON.Body
  mixer: THREE.AnimationMixer
  controls: Controls | undefined
  stateMachine: CharacterStateMachine
  yHalfExtend: number

  constructor(params: Params) {
    super(params)
    this.params = params
    this.engine = this.params.engine

    this.model = GLTFUtils.cloneGltf(Character.gltfs[this.params.name]) as GLTF

    this.mesh = this.model.scene
    this.mesh.receiveShadow = true
    this.mesh.position.copy(this.params.position as THREE.Vector3)
    this.mesh.rotation.y = Math.PI * (this.params.orientation || 0)

    this.yHalfExtend = this.hitbox.getSize(new THREE.Vector3()).y / 2
    this.body = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.KINEMATIC,
      shape: new CANNON.Box(new CANNON.Vec3(0.7, this.yHalfExtend, 0.7)),
      material: this.engine.defaultMaterial,
    })
    this.setBodyPosition(this.mesh.position.clone() as unknown as CANNON.Vec3)
    this.body.quaternion.copy(this.mesh.quaternion as unknown as CANNON.Quaternion)

    this.mesh.traverse((node) => {
      if (node instanceof THREE.Bone && node.name === 'handslotl') {
        node.children = node.children.splice(1, 1)
      } else if (node instanceof THREE.Bone && node.name === 'handslotr') {
        node.children = node.children.splice(0, 1)
      }
    })

    this.mixer = new THREE.AnimationMixer(this.mesh)

    this.controls = this.params.controls
    if (this.controls) {
      this.controls.assignTarget(this)
    }

    this.stateMachine = new CharacterStateMachine(this)
    this.stateMachine.setState('idle')

    if (this.engine.params.physicsDebugger !== PhysicDebuggerModes.Strict) this.engine.scene.add(this.mesh)
    this.engine.world.addBody(this.body)
    this.engine.updatables.push(this)
  }

  update(dt: number, elapsedTime: number) {
    this.mixer.update(dt)
    this.handleMovement(dt)
    this.stateMachine.currentState?.update(dt, elapsedTime)
    this.controls?.updateCamera()

    console.log(this.body.position.y)
  }

  private handleMovement(dt: number) {
    if (!this.controls) return

    this.body.quaternion.copy(this.body.quaternion.slerp(this.controls.quaternion, 0.05))

    let velocity = this.controls.velocity.clone()
    velocity = CannonUtils.ApplyQuaternionToVec3(velocity, this.body.quaternion)
    velocity = velocity.scale(6 * dt)
    velocity.y = 0 // vertical movement is handled by the jump animation

    this.body.position.copy(this.body.position.clone().vadd(velocity))

    this.mesh.position.copy(this.body.position as unknown as THREE.Vector3)
    this.mesh.position.y -= this.yHalfExtend
    this.mesh.quaternion.copy(this.body.quaternion as unknown as THREE.Quaternion)
  }

  setBodyPosition(position: CANNON.Vec3) {
    this.body.position.copy(position as unknown as CANNON.Vec3)
    this.body.position.y += this.yHalfExtend
  }

  getAnimation(name: string) {
    return this.model.animations.find((a) => a.name === name) as THREE.AnimationClip
  }

  get hitbox() {
    return new THREE.Box3().setFromObject(this.mesh)
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
    this.addState('starting_jump', StartingJumpState)
    this.addState('jumping', JumpingState)
    this.addState('landing_jump', LandingJumpState)
  }

  get direction() {
    const direction = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
    }

    if (!this.character.controls) return direction

    const velocity = this.character.controls.velocity
    if (velocity.y > 1) direction.jump = true
    else if (velocity.z === -1) direction.backward = true
    else if (velocity.x === -1) direction.right = true
    else if (velocity.x === 1) direction.left = true
    else if (velocity.z === 1) direction.forward = true

    return direction
  }
}

class CharacterState extends State {
  machine: CharacterStateMachine
  animation: string
  transitionTime = 0.2
  enterTime = 0.0
  loop: THREE.AnimationActionLoopStyles = THREE.LoopRepeat

  get action() {
    return this.machine.character.mixer.clipAction(this.machine.character.getAnimation(this.animation))
  }

  enter(prevState?: CharacterState) {
    if (prevState) {
      this.action.time = this.enterTime
      this.action.loop = this.loop
      this.action.enabled = true
      this.action.setEffectiveTimeScale(1.0)
      this.action.setEffectiveWeight(1.0)
      this.action.crossFadeFrom(prevState.action, this.transitionTime, true)
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
    if (this.machine.direction.jump) this.machine.setState('starting_jump')
    else if (this.machine.direction.forward) this.machine.setState('running')
    else if (this.machine.direction.backward) this.machine.setState('walking_backward')
    else if (this.machine.direction.left) this.machine.setState('strafing_left')
    else if (this.machine.direction.right) this.machine.setState('strafing_right')
  }
}

class RunningState extends CharacterState {
  name = 'running'
  animation = 'Running_A'

  update() {
    if (this.machine.direction.jump) this.machine.setState('starting_jump')
    else if (!this.machine.direction.forward) this.machine.setState('idle')
    else if (this.machine.direction.backward) this.machine.setState('walking_backward')
    else if (this.machine.direction.left) this.machine.setState('strafing_left')
    else if (this.machine.direction.right) this.machine.setState('strafing_right')
  }
}

class StrafingLeftState extends CharacterState {
  name = 'strafing_left'
  animation = 'Running_Strafe_Left'

  update() {
    if (this.machine.direction.jump) this.machine.setState('starting_jump')
    else if (!this.machine.direction.left) this.machine.setState('idle')
    else if (this.machine.direction.backward) this.machine.setState('walking_backward')
    else if (this.machine.direction.forward) this.machine.setState('running')
    else if (this.machine.direction.right) this.machine.setState('strafing_right')
  }
}
class StrafingRightState extends CharacterState {
  name = 'strafing_right'
  animation = 'Running_Strafe_Right'

  update() {
    if (this.machine.direction.jump) this.machine.setState('starting_jump')
    else if (!this.machine.direction.right) this.machine.setState('idle')
    else if (this.machine.direction.backward) this.machine.setState('walking_backward')
    else if (this.machine.direction.forward) this.machine.setState('running')
    else if (this.machine.direction.left) this.machine.setState('strafing_left')
  }
}

class WalkingBackwardState extends CharacterState {
  name = 'walking_backward'
  animation = 'Walking_Backwards'

  update() {
    if (this.machine.direction.jump) this.machine.setState('starting_jump')
    else if (!this.machine.direction.backward) this.machine.setState('idle')
    else if (this.machine.direction.forward) this.machine.setState('running')
    else if (this.machine.direction.left) this.machine.setState('strafing_left')
    else if (this.machine.direction.right) this.machine.setState('strafing_right')
  }
}

class StartingJumpState extends CharacterState {
  name = 'starting_jump'
  animation = 'Jump_Start'
  loop = THREE.LoopOnce

  transitionTime = 0.1
  elapsedTime = 0
  duration = 0.2

  update(dt: number) {
    this.elapsedTime += dt
    if (this.elapsedTime > this.duration) this.machine.setState('jumping')
  }
}

class JumpingState extends CharacterState {
  name = 'jumping'
  animation = 'Jump_Idle'

  elapsedTime = 0
  duration = 0.7
  transitionTime = 0.1
  halfDuration = this.duration / 2

  update(dt: number) {
    this.elapsedTime += dt
    if (this.elapsedTime > this.duration) this.machine.setState('landing_jump')
    else {
      const t = this.elapsedTime / this.halfDuration
      const value = Math.sin((t * Math.PI) / 2)
      this.machine.character.body.position.y = value * 2.2 + this.machine.character.yHalfExtend
    }
  }
}

class LandingJumpState extends CharacterState {
  name = 'landing_jump'
  animation = 'Jump_Land'

  enterTime = 0.2
  elapsedTime = 0
  transitionTime = 0.1
  duration = 0.1

  update(dt: number) {
    this.elapsedTime += dt
    if (this.elapsedTime > this.duration) this.machine.setState('idle')
  }
}

// Assets source : https://kaylousberg.com/game-assets
export enum Characters {
  Knight = 'Knight',
  // Barbarian = 'Barbarian',
  // Mage = 'Mage',
  // Rogue = 'Rogue',
  // Rogue_Hooded = 'Rogue_Hooded',
}
