import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { Engine } from '../engine'

interface Params {
  engine: Engine
  radius: number
  position: { x: number; y: number; z: number }
}

export class Sphere {
  static Geometry = new THREE.SphereGeometry(1, 32, 32)
  static Material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
  radius: number
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap>
  body: CANNON.Body
  params: Params
  engine: Engine

  constructor(params: Params) {
    this.params = params
    this.engine = this.params.engine
    this.radius = this.params.radius
    this.mesh = new THREE.Mesh(Sphere.Geometry, Sphere.Material)
    this.mesh.scale.set(this.radius, this.radius, this.radius)
    this.mesh.castShadow = true
    this.mesh.position.copy(this.params.position as unknown as THREE.Vector3)

    this.body = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(this.radius),
      material: this.engine.defaultMaterial,
    })
    this.body.position.copy(this.mesh.position as unknown as CANNON.Vec3)

    if (!this.engine.physicsDebugger) this.engine.scene.add(this.mesh)
    this.engine.world.addBody(this.body)
    this.engine.updatables.push(this)
  }

  update() {
    this.mesh.position.copy(this.body.position as unknown as THREE.Vector3)
  }

  // Example of how to remove a prop
  // remove() {
  //   this.engine.scene.remove(this.mesh)
  //   this.engine.world.removeBody(this.body)
  //   this.engine.updatables.splice(this.engine.updatables.indexOf(this), 1)
  // }
}
