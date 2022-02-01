import { NetworkId } from '@xrengine/common/src/interfaces/NetworkId'
import { TypedArray } from 'bitecs'
import { Entity } from '../../../ecs/classes/Entity'
import { createViewCursor, readNetworkId, readProp, readUint32, readUint8, ViewCursor } from '../ViewCursor'

export const readProps = (v: ViewCursor, props: TypedArray[], idMap: Map<NetworkId, Entity>) => {
  while (v.cursor < v.buffer.byteLength) {
    const pid = readUint8(v)
    const count = readUint32(v)

    const prop = props[pid]

    for (let i = 0; i < count; i++) {
      const netId = readNetworkId(v) as NetworkId
      const eid = idMap.get(netId)!
      prop[eid] = readProp(v, prop)
    }
  }
}

export const createDataReader = (props: TypedArray[]) => {
  return (packet: ArrayBuffer, idMap: Map<NetworkId, Entity>) => {
    const view = createViewCursor(packet)
    return readProps(view, props, idMap)
  }
}
