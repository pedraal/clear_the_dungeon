import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { Engine } from '../engine'

interface Params {
  engine: Engine,
  side: number
  position: { x: number, y: number, z: number }
}

export class Box {
  static Geometry = new THREE.BoxGeometry(1, 1, 1)
  static Material = new THREE.MeshBasicMaterial({ color: 0x0000FF })
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap>
  body: CANNON.Body
  params: Params
  engine: Engine

  constructor(params: Params) {
    this.params = params
    this.engine = this.params.engine
    this.mesh = new THREE.Mesh(
      Box.Geometry,
      Box.Material,
    )
    this.mesh.name = 'Box'
    this.mesh.scale.set(this.params.side, this.params.side, this.params.side)
    this.mesh.castShadow = true
    this.mesh.position.copy(this.params.position as unknown as THREE.Vector3)

    this.body = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(this.params.side * 0.5), // This fixes the weird box to convex polyhedron colling issue
      material: this.engine.defaultMaterial,
    })
    this.body.position.copy(this.params.position as unknown as CANNON.Vec3)

    if (!this.engine.physicsDebugger) this.engine.scene.add(this.mesh)
    this.engine.world.addBody(this.body)
    this.engine.updatables.push(this)
  }

  update() {
    this.mesh.position.copy(this.body.position as unknown as THREE.Vector3)
    this.mesh.quaternion.copy(this.body.quaternion as unknown as THREE.Quaternion)
  }
}
