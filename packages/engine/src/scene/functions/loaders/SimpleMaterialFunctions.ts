import { Material, Mesh, MeshBasicMaterial, MeshPhongMaterial, MeshStandardMaterial } from 'three'
import { ComponentJson } from '@xrengine/common/src/interfaces/SceneInterface'
import { Entity } from '../../../ecs/classes/Entity'
import { addComponent, getComponent, hasComponent } from '../../../ecs/functions/ComponentFunctions'
import { ComponentDeserializeFunction, ComponentSerializeFunction } from '../../../common/constants/PrefabFunctionType'
import { SimpleMaterialTagComponent } from '../../components/SimpleMaterialTagComponent'
import { Engine } from '../../../ecs/classes/Engine'
import { beforeMaterialCompile } from '../../classes/BPCEMShader'
import { SceneOptions } from '../../systems/SceneObjectSystem'
import { EntityNodeComponent } from '../../components/EntityNodeComponent'

export const SCENE_COMPONENT_SIMPLE_MATERIALS = 'simple-materials'

export const deserializeSimpleMaterial: ComponentDeserializeFunction = (
  entity: Entity,
  json: ComponentJson<{ simpleMaterials: boolean }>
) => {
  if (!json.props.simpleMaterials) return

  addComponent(entity, SimpleMaterialTagComponent, {})
  Engine.simpleMaterials = json.props.simpleMaterials

  if (Engine.isEditor) getComponent(entity, EntityNodeComponent)?.components.push(SCENE_COMPONENT_SIMPLE_MATERIALS)
}

export const serializeSimpleMaterial: ComponentSerializeFunction = (entity) => {
  if (hasComponent(entity, SimpleMaterialTagComponent)) {
    return {
      name: SCENE_COMPONENT_SIMPLE_MATERIALS,
      props: {
        simpleMaterials: {}
      }
    }
  }
}

export const useSimpleMaterial = (obj: Mesh): void => {
  if (obj.material instanceof MeshStandardMaterial) {
    ;(obj as any).prevMaterial = obj.material
    obj.material = new MeshPhongMaterial()
    MeshBasicMaterial.prototype.copy.call(obj.material, (obj as any).prevMaterial)
  }
}

export const useStandardMaterial = (obj: Mesh): void => {
  const material = (obj as any).prevMaterial ?? obj.material

  if (typeof material === 'undefined') return

  // BPCEM
  if (SceneOptions.instance.boxProjection) {
    material.onBeforeCompile = beforeMaterialCompile(
      SceneOptions.instance.bpcemOptions.bakeScale,
      SceneOptions.instance.bpcemOptions.bakePositionOffset
    )
  }

  ;(material as any).envMapIntensity = SceneOptions.instance.envMapIntensity

  if ((obj as any).prevMaterial) {
    ;(obj.material as Material).dispose()
    obj.material = material
    ;(obj as any).prevMaterial = undefined
  }

  if (obj.receiveShadow) Engine.csm?.setupMaterial(obj)
}
