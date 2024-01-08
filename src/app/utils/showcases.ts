import { Mapping } from "../props/mapping";
import { Character } from "../props/character";
import { Sphere } from '../props/sphere'
import { Box } from '../props/box'

export class Showcase {
  static mappingShowcase(index: number, options: { sphere?: boolean, box?: true, shapeAlgorithm?: Mapping['shapeAlgorithm'] }) {
    new Mapping(Mapping.models[index], { position: { x: 0, y: 2, z: 0 }, mass: 0, orientation: 0, shapeAlgorithm: options.shapeAlgorithm })
    let y = 6
    for (const z of [-1.5, 0, 1.5]) {
      for (const x of [-1.5, 0, 1.5]) {
        if (options.sphere)
          new Sphere(0.5, { x, y, z })
        else if (options.box)
          new Box(0.5, { x, y, z })

        y += 2
      }
    }
  }

  static mappingsShowcase(options: { sphere?: boolean, box?: true, shapeAlgorithm?: Mapping['shapeAlgorithm'] }) {
    const rowLength = 9
    const cellSize = 6

    /**
     * Uncomment this to center the models in the camera view
     * For some reason I cannot explain, this produce really weird physics behavior, most of shape are not colliding.
     * The uncommented version is working better but still not perfectly
     */
    // const firstCellX = -Math.floor(rowLength / 2) * cellSize
    // const firstCellZ = -Math.floor(Mapping.models.length / rowLength / 2) * 6
    // const lastCellX = Math.abs(firstCellX)

    const firstCellX = 0
    const firstCellZ = 0
    const lastCellX = (rowLength - 1) * cellSize

    let x = firstCellX
    let z = firstCellZ
    let y = 6

    for (const name of [...Mapping.models]) {
      new Mapping(name, { position: { x, y: 2, z }, mass: 0, orientation: 0, shapeAlgorithm: options.shapeAlgorithm })

      if (options.sphere)
        new Sphere(0.5, { x, y, z })
      else if (options.box)
        new Box(0.5, { x, y, z })

      if (x === lastCellX) {
        x = firstCellX
        z += cellSize
      }
      else {
        x += cellSize
      }
      // y += 4
    }

  }

  static charactersShowcase() {
    const rowLength = 9
    const cellSize = 3

    const firstCellX = 0
    const firstCellZ = 0
    const lastCellX = (rowLength - 1) * cellSize

    let x = firstCellX
    let z = firstCellZ
    let y = 6

    for (const name of Character.models) {
      new Character({ name, position: { x, y: 2, z } })

      if (x === lastCellX) {
        x = firstCellX
        z += cellSize
      }
      else {
        x += cellSize
      }
    }
  }
}
