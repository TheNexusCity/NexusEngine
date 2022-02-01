import { Object3D, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments } from 'three'
import { addIsHelperFlag } from '@xrengine/engine/src/scene/functions/addIsHelperFlag'
export default class EditorSpotLightHelper extends Object3D {
  light: any
  color: any
  outerCone: LineSegments
  innerCone: LineSegments
  constructor(light, color?) {
    super()
    this.name = 'EditorSpotLightHelper'
    this.light = light
    this.color = color
    const geometry = new BufferGeometry()
    const positions = [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, -1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, -1, 1]
    for (let i = 0, j = 1, l = 32; i < l; i++, j++) {
      const p1 = (i / l) * Math.PI * 2
      const p2 = (j / l) * Math.PI * 2
      positions.push(Math.cos(p1), Math.sin(p1), 1, Math.cos(p2), Math.sin(p2), 1)
    }
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    const material = new LineBasicMaterial({ fog: false })
    this.outerCone = new LineSegments(geometry, material)
    this.outerCone.layers.set(1)
    this.add(this.outerCone)
    this.innerCone = new LineSegments(geometry, material)
    this.innerCone.layers.set(1)
    this.add(this.innerCone)
    this.update()
    addIsHelperFlag(this)
  }
  dispose() {
    this.outerCone.geometry.dispose()
  }
  update = () => {
    this.light.updateMatrixWorld()
    const coneLength = this.light.distance ? this.light.distance : 1000
    const outerConeWidth = coneLength * Math.tan(this.light.angle)
    const innerConeAngle = (1 - this.light.penumbra) * this.light.angle
    const innerConeWidth = coneLength * Math.tan(innerConeAngle)
    this.outerCone.scale.set(outerConeWidth, outerConeWidth, coneLength)
    this.innerCone.scale.set(innerConeWidth, innerConeWidth, coneLength)
    // if (this.color !== undefined) {
    //   (this.outerCone.material.color as any).set(this.color);
    //   (this.outerCone.material.color as any).set(this.color);
    // } else {
    //   (this.outerCone.material.color as any).copy(this.light.color);
    //   (this.outerCone.material.color as any).copy(this.light.color);
    // }
  }
}
