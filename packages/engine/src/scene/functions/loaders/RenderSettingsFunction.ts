import { ComponentJson } from '@xrengine/common/src/interfaces/SceneInterface'
import { Vector3, DirectionalLight, PerspectiveCamera, PCFSoftShadowMap, LinearToneMapping } from 'three'
import { AssetLoader } from '../../../assets/classes/AssetLoader'
import { DEFAULT_LOD_DISTANCES } from '../../../assets/constants/LoaderConstants'
import { CSM } from '../../../assets/csm/CSM'
import {
  ComponentDeserializeFunction,
  ComponentSerializeFunction,
  ComponentUpdateFunction
} from '../../../common/constants/PrefabFunctionType'
import { isClient } from '../../../common/functions/isClient'
import { Engine } from '../../../ecs/classes/Engine'
import { EngineEvents } from '../../../ecs/classes/EngineEvents'
import { accessEngineState } from '../../../ecs/classes/EngineService'
import { Entity } from '../../../ecs/classes/Entity'
import { addComponent, getComponent } from '../../../ecs/functions/ComponentFunctions'
import { receiveActionOnce } from '../../../networking/functions/matchActionOnce'
import { EntityNodeComponent } from '../../components/EntityNodeComponent'
import { RenderSettingComponent, RenderSettingComponentType } from '../../components/RenderSettingComponent'

export const SCENE_COMPONENT_RENDERER_SETTINGS = 'renderer-settings'
export const SCENE_COMPONENT_RENDERER_SETTINGS_DEFAULT_VALUES = {
  LODs: { x: 5, y: 15, z: 30 },
  overrideRendererSettings: false,
  csm: true,
  toneMapping: LinearToneMapping,
  toneMappingExposure: 0.2,
  shadowMapType: PCFSoftShadowMap
}

export const deserializeRenderSetting: ComponentDeserializeFunction = (
  entity: Entity,
  json: ComponentJson<RenderSettingComponentType>
) => {
  const props = parseRenderSettingsProperties(json.props)
  addComponent(entity, RenderSettingComponent, props)

  Engine.isCSMEnabled = props.csm
  if (Engine.isEditor) getComponent(entity, EntityNodeComponent)?.components.push(SCENE_COMPONENT_RENDERER_SETTINGS)

  updateRenderSetting(entity)
}

export const updateRenderSetting: ComponentUpdateFunction = (entity: Entity) => {
  if (!isClient) return
  const component = getComponent(entity, RenderSettingComponent)

  resetEngineRenderer()
  if (typeof component.overrideRendererSettings !== 'undefined' && !component.overrideRendererSettings) {
    initializeCSM()
    return
  }

  if (component.LODs)
    AssetLoader.LOD_DISTANCES = { '0': component.LODs.x, '1': component.LODs.y, '2': component.LODs.z }

  Engine.isCSMEnabled = component.csm
  Engine.renderer.toneMapping = component.toneMapping
  Engine.renderer.toneMappingExposure = component.toneMappingExposure

  if (component.shadowMapType) {
    Engine.renderer.shadowMap.enabled = true
    Engine.renderer.shadowMap.needsUpdate = true
    Engine.renderer.shadowMap.type = component.shadowMapType
  } else {
    Engine.renderer.shadowMap.enabled = false
  }

  if (component.csm && !Engine.isHMD && Engine.renderer.shadowMap.enabled) {
    if (accessEngineState().sceneLoaded.value) initializeCSM()
    else receiveActionOnce(EngineEvents.EVENTS.SCENE_LOADED, initializeCSM)
  }
}

export const initializeCSM = () => {
  Engine.csm = new CSM({
    camera: Engine.camera as PerspectiveCamera,
    parent: Engine.scene,
    lights: Engine.directionalLights
  })
}

export const resetEngineRenderer = (resetLODs = false) => {
  if (!isClient) return

  Engine.renderer.shadowMap.enabled = true
  Engine.renderer.shadowMap.type = PCFSoftShadowMap
  Engine.renderer.shadowMap.needsUpdate = true

  Engine.renderer.toneMapping = LinearToneMapping
  Engine.renderer.toneMappingExposure = 0.8

  if (resetLODs) AssetLoader.LOD_DISTANCES = Object.assign({}, DEFAULT_LOD_DISTANCES)

  if (!Engine.csm) return

  Engine.csm.remove()
  Engine.csm.dispose()
  Engine.csm = undefined!
}

export const serializeRenderSettings: ComponentSerializeFunction = (entity) => {
  const component = getComponent(entity, RenderSettingComponent) as RenderSettingComponentType
  if (!component) return

  return {
    name: SCENE_COMPONENT_RENDERER_SETTINGS,
    props: {
      LODs: component.LODs,
      overrideRendererSettings: component.overrideRendererSettings,
      csm: component.csm,
      toneMapping: component.toneMapping,
      toneMappingExposure: component.toneMappingExposure,
      shadowMapType: component.shadowMapType
    }
  }
}

const parseRenderSettingsProperties = (props): RenderSettingComponentType => {
  const result = {
    overrideRendererSettings:
      props.overrideRendererSettings ?? SCENE_COMPONENT_RENDERER_SETTINGS_DEFAULT_VALUES.overrideRendererSettings,
    csm: props.csm ?? SCENE_COMPONENT_RENDERER_SETTINGS_DEFAULT_VALUES.csm,
    toneMapping: props.toneMapping ?? SCENE_COMPONENT_RENDERER_SETTINGS_DEFAULT_VALUES.toneMapping,
    toneMappingExposure:
      props.toneMappingExposure ?? SCENE_COMPONENT_RENDERER_SETTINGS_DEFAULT_VALUES.toneMappingExposure,
    shadowMapType: props.shadowMapType ?? SCENE_COMPONENT_RENDERER_SETTINGS_DEFAULT_VALUES.shadowMapType
  } as RenderSettingComponentType

  const tempV3 = props.LODs ?? SCENE_COMPONENT_RENDERER_SETTINGS_DEFAULT_VALUES.LODs
  result.LODs = new Vector3(tempV3.x, tempV3.y, tempV3.z)

  return result
}
