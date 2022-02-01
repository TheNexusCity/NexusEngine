import { ComponentJson } from '@xrengine/common/src/interfaces/SceneInterface'
import { Entity } from '../../../ecs/classes/Entity'
import { addComponent, getComponent } from '../../../ecs/functions/ComponentFunctions'
import {
  ComponentDeserializeFunction,
  ComponentPrepareForGLTFExportFunction,
  ComponentSerializeFunction
} from '../../../common/constants/PrefabFunctionType'
import { isClient } from '../../../common/functions/isClient'
import { EntityNodeComponent } from '../../components/EntityNodeComponent'
import { Engine } from '../../../ecs/classes/Engine'
import { LinkComponent, LinkComponentType } from '../../components/LinkComponent'
import { DoubleSide, Mesh, MeshBasicMaterial, Object3D, PlaneBufferGeometry } from 'three'
import { Object3DComponent } from '../../components/Object3DComponent'
import { InteractableComponent } from '../../../interaction/components/InteractableComponent'
import { AssetLoader } from '../../../assets/classes/AssetLoader'

export const SCENE_COMPONENT_LINK = 'link'
export const SCENE_COMPONENT_LINK_DEFAULT_VALUES = {
  href: ''
}

if (isClient) {
  // todo: make this not top level
  AssetLoader.load({ url: '/static/editor/link-icon.png' })
}

export const deserializeLink: ComponentDeserializeFunction = (
  entity: Entity,
  json: ComponentJson<LinkComponentType>
) => {
  const obj3d = new Object3D()
  addComponent(entity, Object3DComponent, { value: obj3d })
  addComponent(entity, InteractableComponent, { action: 'link' })

  if (Engine.isEditor) {
    const geometry = new PlaneBufferGeometry()
    const material = new MeshBasicMaterial()
    material.map = AssetLoader.getFromCache('/static/editor/link-icon.png')
    material.side = DoubleSide
    material.transparent = true
    const helper = new Mesh(geometry, material)
    helper.layers.set(1)
    obj3d.add(helper)
    obj3d.userData.linkHelper = helper
  }

  if (Engine.isEditor) getComponent(entity, EntityNodeComponent)?.components.push(SCENE_COMPONENT_LINK)
  addComponent(entity, LinkComponent, { href: json.props.href ?? SCENE_COMPONENT_LINK_DEFAULT_VALUES.href })
}

export const serializeLink: ComponentSerializeFunction = (entity) => {
  const linkComponent = getComponent(entity, LinkComponent)
  if (linkComponent) {
    return {
      name: SCENE_COMPONENT_LINK,
      props: {
        href: linkComponent.href
      }
    }
  }
}

export const prepareLinkForGLTFExport: ComponentPrepareForGLTFExportFunction = (link) => {
  if (link.userData.linkHelper) link.remove(link.userData.linkHelper)
}
