import { Mapping, Mappings } from "./props/mapping"

export class GameMap {
  generateFloor() {
    const cellSide = 4
    const xInterval = [-20, 20]
    const zInterval = [-10, 40]

    for (let i = xInterval[0]; i <= xInterval[1]; i += cellSide) {
      for (let j = zInterval[0]; j <= zInterval[1]; j += cellSide) {
        new Mapping({ name: Mappings.Floor_Dirt, position: { x: i, y: -1, z: j } })
      }
    }
  }
}
