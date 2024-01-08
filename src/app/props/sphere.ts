import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { GameEngine } from '../game_engine'

export class Sphere {
  static Geometry = new THREE.SphereGeometry(1, 32, 32)
  static Material = new THREE.MeshBasicMaterial({ color: 0xFF0000 })
  radius: number
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap>
  body: CANNON.Body

  constructor(radius: number, position: { x: number, y: number, z: number }) {
    this.radius = radius
    this.mesh = new THREE.Mesh(
      Sphere.Geometry,
      Sphere.Material,
    )
    this.mesh.scale.set(radius, radius, radius)
    this.mesh.castShadow = true
    this.mesh.position.copy(position as unknown as THREE.Vector3)

    this.body = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(radius),
      material: GameEngine.instance.defaultMaterial,
    })
    this.body.position.copy(this.mesh.position as unknown as CANNON.Vec3)

    if (!GameEngine.instance.physicsDebugger) GameEngine.instance.scene.add(this.mesh)
    GameEngine.instance.world.addBody(this.body)
    GameEngine.instance.updatables.push(this)
  }

  update() {
    this.mesh.position.copy(this.body.position as unknown as THREE.Vector3)
  }

  // Example of how to remove a prop
  // remove() {
  //   GameEngine.instance.scene.remove(this.mesh)
  //   GameEngine.instance.world.removeBody(this.body)
  //   GameEngine.instance.updatables.splice(GameEngine.instance.updatables.indexOf(this), 1)
  // }
}
