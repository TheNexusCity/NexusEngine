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
import { InteractableComponent, InteractableComponentType } from '../../../interaction/components/InteractableComponent'

export const SCENE_COMPONENT_INTERACTABLE = 'interactable'
export const SCENE_COMPONENT_INTERACTABLE_DEFAULT_VALUES = {
  interactable: false
}

export const deserializeInteractable: ComponentDeserializeFunction = (
  entity: Entity,
  json: ComponentJson<InteractableComponentType>
) => {
  const props = parseInteractableProperties(json.props)
  addComponent(entity, InteractableComponent, props)

  if (Engine.isEditor) getComponent(entity, EntityNodeComponent)?.components.push(SCENE_COMPONENT_INTERACTABLE)

  updateInteractable(entity, props)
}

export const updateInteractable: ComponentUpdateFunction = async (
  _entity: Entity,
  _properties: InteractableComponentType
) => {}

export const serializeInteractable: ComponentSerializeFunction = (entity) => {
  const component = getComponent(entity, InteractableComponent) as InteractableComponentType
  if (!component) return

  return {
    name: SCENE_COMPONENT_INTERACTABLE,
    props: {
      interactable: component.interactable,
      interactionType: component.interactionType,
      interactionText: component.interactionText,
      interactionDistance: component.interactionDistance,
      interactionThemeIndex: component.interactionThemeIndex,
      interactionName: component.interactionName,
      interactionDescription: component.interactionDescription,
      interactionImages: component.interactionImages,
      interactionVideos: component.interactionVideos,
      interactionUrls: component.interactionUrls,
      interactionModels: component.interactionModels,
      mediaIndex: component.mediaIndex,
      intensity: component.intensity
    }
  }
}

const parseInteractableProperties = (props): InteractableComponentType => {
  return {
    ...props,
    interactable: props.interactable ?? SCENE_COMPONENT_INTERACTABLE_DEFAULT_VALUES.interactable
  }
}
