import { ComponentJson } from '@xrengine/common/src/interfaces/SceneInterface'
import {
  ComponentDeserializeFunction,
  ComponentSerializeFunction,
  ComponentUpdateFunction
} from '../../../common/constants/PrefabFunctionType'
import { Engine } from '../../../ecs/classes/Engine'
import { Entity } from '../../../ecs/classes/Entity'
import { addComponent, getComponent } from '../../../ecs/functions/ComponentFunctions'
import { EntityNodeComponent } from '../../components/EntityNodeComponent'
import { Object3DComponent } from '../../components/Object3DComponent'
import { MediaComponent, MediaComponentType } from '../../components/MediaComponent'
import { Object3D } from 'three'
import UpdateableObject3D from '../../classes/UpdateableObject3D'
import { UpdatableComponent } from '../../components/UpdatableComponent'

export const SCENE_COMPONENT_MEDIA = 'media'
export const SCENE_COMPONENT_MEDIA_DEFAULT_VALUES = {
  controls: false,
  autoplay: false,
  autoStartTime: 0,
  loop: false
}

export const deserializeMedia: ComponentDeserializeFunction = (
  entity: Entity,
  json: ComponentJson<MediaComponentType>
) => {
  const props = parseMediaProperties(json.props)
  addComponent(entity, MediaComponent, props)
  addComponent(entity, Object3DComponent, { value: new UpdateableObject3D() })
  addComponent(entity, UpdatableComponent, {})

  if (Engine.isEditor) getComponent(entity, EntityNodeComponent)?.components.push(SCENE_COMPONENT_MEDIA)

  updateMedia(entity, props)
}

export const updateMedia: ComponentUpdateFunction = async (entity: Entity, properties: MediaComponentType) => {
  const obj3d = getComponent(entity, Object3DComponent).value
  const component = getComponent(entity, MediaComponent)

  if (!Engine.isEditor) {
    if (obj3d.userData.player) {
      if (typeof properties.autoplay !== 'undefined') obj3d.userData.player.autoplay = component.autoplay
    } else if (obj3d.userData.videoEl) {
      if (typeof properties.autoplay !== 'undefined') obj3d.userData.videoEl.autoplay = component.autoplay
      if (typeof properties.controls !== 'undefined') obj3d.userData.videoEl.controls = component.controls
      if (typeof properties.loop !== 'undefined') obj3d.userData.videoEl.loop = component.loop
      if (typeof properties.autoStartTime !== 'undefined') updateAutoStartTimeForMedia(entity)
    } else if (obj3d.userData.audioEl) {
      if (typeof properties.autoplay !== 'undefined') obj3d.userData.audioEl.autoplay = component.autoplay
      if (typeof properties.loop !== 'undefined') obj3d.userData.audioEl.setLoop(component.loop)
      if (typeof properties.autoStartTime !== 'undefined') updateAutoStartTimeForMedia(entity)
    }
  }
}

export const serializeMedia: ComponentSerializeFunction = (entity) => {
  const component = getComponent(entity, MediaComponent) as MediaComponentType
  if (!component) return

  return {
    name: SCENE_COMPONENT_MEDIA,
    props: {
      controls: component.controls,
      autoplay: component.autoplay,
      autoStartTime: component.autoStartTime,
      loop: component.loop
    }
  }
}

export const updateAutoStartTimeForMedia = (entity: Entity) => {
  const component = getComponent(entity, MediaComponent)
  if (!component) return

  const obj3d = getComponent(entity, Object3DComponent).value

  if (component.startTimer) clearTimeout(component.startTimer)
  if (component.autoStartTime === 0) return

  const timeDiff = component.autoStartTime - Date.now()

  // If media will play in future then wait.
  if (timeDiff > 0) {
    component.startTimer = setTimeout(() => {
      if (obj3d?.userData.videoEl) obj3d.userData.videoEl.play()
    }, timeDiff)

    return
  }

  if (obj3d.userData.videoEl) {
    if (!obj3d.userData.videoEl.src) return

    // If loop is not enable and media is played once for its full duration then don't start it again
    if (!component.loop && -timeDiff > obj3d.userData.videoEl.duration) return

    const offset = (-timeDiff / 1000) % obj3d.userData.videoEl.duration
    obj3d.userData.videoEl.currentTime = offset
    obj3d.userData.videoEl.play()
  } else {
    if (!obj3d.userData.audioEl.buffer) return

    // If loop is not enable and media is played once for its full duration then don't start it again
    if (!component.loop && -timeDiff > obj3d.userData.audioEl.buffer.duration) return

    const offset = (-timeDiff / 1000) % obj3d.userData.audioEl.buffer.duration
    obj3d.userData.audioEl.offset = offset
    obj3d.userData.audioEl.play()
  }
}

const parseMediaProperties = (props): MediaComponentType => {
  return {
    controls: props.controls ?? SCENE_COMPONENT_MEDIA_DEFAULT_VALUES.controls,
    autoplay: props.autoplay ?? SCENE_COMPONENT_MEDIA_DEFAULT_VALUES.autoplay,
    autoStartTime: props.autoStartTime ?? SCENE_COMPONENT_MEDIA_DEFAULT_VALUES.autoStartTime,
    loop: props.loop ?? SCENE_COMPONENT_MEDIA_DEFAULT_VALUES.loop
  }
}
