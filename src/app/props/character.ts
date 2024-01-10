import * as THREE from 'three'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Engine } from '../engine'
import { GLTFUtils } from '../utils/gltf_utils'
import { Controls } from '../types'

interface Params {
  engine: Engine
  name: string
  position: { x: number, y: number, z: number }
  orientation?: number
  controls?: Controls
}

const randomSkin = [
  'Barbarian',
  'Knight',
  'Mage',
  'Rogue',
  'Rogue_Hooded',
][Math.floor(Math.random() * 5)]

export class Character {
  static gltfs: Record<string, GLTF> = {}
  static loader = new GLTFLoader()
  static async load() {
    const loadPromise = (name: string): Promise<void> => new Promise((resolve) => {
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
        }
      )
    })

    await Promise.all(Character.models.map((name) => loadPromise(name)))
  }

  params: Params
  engine: Engine
  mesh: THREE.Group
  mixer: THREE.AnimationMixer
  model: GLTF
  controls: Controls | undefined
  movementAnimation: THREE.AnimationClip
  startedJumpingAt: number | undefined

  constructor(params: Params) {
    this.params = params
    this.engine = this.params.engine
    this.initModel()
    this.initEquipement()
    this.initControls()
    this.initAnimations()

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
    this.movementAnimation = this.getAnimation('Idle')
    this.mixer = new THREE.AnimationMixer(this.mesh)
    this.mixer.clipAction(this.movementAnimation).play()
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
      }
      else if (node instanceof THREE.Bone && node.name === 'handslotr') {
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
  }

  private handleMovement(dt: number) {
    if (!this.controls) return

    const movementVector = this.controls.movementVector.clone()
    const velocity = 6 * dt
    this.mesh.position.add(movementVector.clone().multiplyScalar(velocity))

    this.controls.updateCamera()

    let movementAnimation: THREE.AnimationClip
    if (movementVector.z === -1)
      movementAnimation = this.getAnimation('Walking_Backwards')
    else if (movementVector.x === -1)
      movementAnimation = this.getAnimation('Running_Strafe_Right')
    else if (movementVector.x === 1)
      movementAnimation = this.getAnimation('Running_Strafe_Left')
    else if (movementVector.z === 1)
      movementAnimation = this.getAnimation('Running_A')
    else
      movementAnimation = this.getAnimation('Idle')


    if (this.movementAnimation !== movementAnimation) {
      this.mixer.clipAction(movementAnimation).play()
      this.mixer.clipAction(this.movementAnimation).stop()
    }

    this.movementAnimation = movementAnimation
  }

  private getAnimation(name: string) {
    return this.model.animations.find(a => a.name === name) as THREE.AnimationClip
  }

  static models = [
    randomSkin
  ]
}
