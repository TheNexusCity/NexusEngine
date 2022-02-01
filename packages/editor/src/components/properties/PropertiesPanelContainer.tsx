import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import TransformPropertyGroup from './TransformPropertyGroup'
import NameInputGroup from './NameInputGroup'
import InputGroup from '../inputs/InputGroup'
import BooleanInput from '../inputs/BooleanInput'
import { useTranslation } from 'react-i18next'
import EditorEvents from '../../constants/EditorEvents'
import { CommandManager } from '../../managers/CommandManager'
import { getNodeEditorsForEntity } from '../../functions/PrefabEditors'
import { hasComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { VisibleComponent } from '@xrengine/engine/src/scene/components/VisibleComponent'
import { PersistTagComponent } from '@xrengine/engine/src/scene/components/PersistTagComponent'
import { PreventBakeTagComponent } from '@xrengine/engine/src/scene/components/PreventBakeTagComponent'
import EditorCommands from '../../constants/EditorCommands'
import { TagComponentOperation } from '../../commands/TagComponentCommand'
import { DisableTransformTagComponent } from '@xrengine/engine/src/transform/components/DisableTransformTagComponent'
import { TransformComponent } from '@xrengine/engine/src/transform/components/TransformComponent'
import { SceneTagComponent } from '@xrengine/engine/src/scene/components/SceneTagComponent'

/**
 * StyledNodeEditor used as wrapper container element properties container.
 *
 * @author Robert Long
 * @type {styled component}
 */
const StyledNodeEditor = (styled as any).div`
`

/**
 * PropertiesHeader used as a wrapper for NameInputGroupContainer component.
 *
 * @author Robert Long
 */
const PropertiesHeader = (styled as any).div`
  background-color: ${(props) => props.theme.panel2};
  border: none !important;
  padding-bottom: 0 !important;
`

/**
 * NameInputGroupContainer used to provides styles and contains NameInputGroup and VisibleInputGroup.
 *
 *  @author Robert Long
 *  @type {Styled Component}
 */
const NameInputGroupContainer = (styled as any).div`
`
/**
 * Styled component used to provide styles for visiblity checkbox.
 *
 * @author Robert Long
 */
const VisibleInputGroup = (styled as any)(InputGroup)`
  & > label {
    width: auto !important;
  }
`

/**
 * Styled component used to provide styles for visiblity checkbox.
 *
 * @author Robert Long
 */
const PersistInputGroup = (styled as any)(InputGroup)`
 & > label {
   width: auto !important;
 }
`

/**
 * PropertiesPanelContent used as container element contains content of editor view.
 *
 * @author Robert Long
 * @type {Styled Component}
 */
const PropertiesPanelContent = (styled as any).div`
  overflow-y: auto;
  height: 100%;
`

/**
 * NoNodeSelectedMessage used to show the message when no selected no is there.
 *
 * @author Robert Long
 * @type {Styled component}
 */
const NoNodeSelectedMessage = (styled as any).div`
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
`

const PropsToWatch = ['position', 'rotation', 'scale', 'matrix']

/**
 * PropertiesPanelContainer used to render editor view to customize property of selected element.
 *
 * @author Robert Long
 * @extends Component
 */
export const PropertiesPanelContainer = () => {
  //setting the props and state
  const [selected, setSelected] = useState(CommandManager.instance.selected)
  const { t } = useTranslation()

  const onSelectionChanged = () => setSelected([...CommandManager.instance.selected])

  const onObjectsChanged = (objects, property) => {
    const selected = CommandManager.instance.selected

    if (PropsToWatch.includes(property)) return

    for (let i = 0; i < objects.length; i++) {
      if (selected.indexOf(objects[i]) !== -1) {
        setSelected([...CommandManager.instance.selected])
        return
      }
    }
  }

  useEffect(() => {
    CommandManager.instance.addListener(EditorEvents.SELECTION_CHANGED.toString(), onSelectionChanged)
    CommandManager.instance.addListener(EditorEvents.OBJECTS_CHANGED.toString(), onObjectsChanged)

    return () => {
      CommandManager.instance.removeListener(EditorEvents.SELECTION_CHANGED.toString(), onSelectionChanged)
      CommandManager.instance.removeListener(EditorEvents.OBJECTS_CHANGED.toString(), onObjectsChanged)
    }
  }, [])

  const onChangeVisible = (value) => {
    CommandManager.instance.executeCommandWithHistoryOnSelection(EditorCommands.TAG_COMPONENT, {
      operation: {
        component: VisibleComponent,
        type: value ? TagComponentOperation.ADD : TagComponentOperation.REMOVE
      }
    })
  }

  const onChangeBakeStatic = (value) => {
    CommandManager.instance.executeCommandWithHistoryOnSelection(EditorCommands.TAG_COMPONENT, {
      operation: {
        component: PreventBakeTagComponent,
        type: value ? TagComponentOperation.ADD : TagComponentOperation.REMOVE
      }
    })
  }

  const onChangePersist = (value) => {
    CommandManager.instance.executeCommandWithHistoryOnSelection(EditorCommands.TAG_COMPONENT, {
      operation: {
        component: PersistTagComponent,
        type: value ? TagComponentOperation.ADD : TagComponentOperation.REMOVE
      }
    })
  }

  //rendering editor views for customization of element properties
  let content
  const multiEdit = selected.length > 1
  const node = selected[selected.length - 1]

  if (!node) {
    content = <NoNodeSelectedMessage>{t('editor:properties.noNodeSelected')}</NoNodeSelectedMessage>
  } else {
    // get all editors that this entity has a component for
    const editors = getNodeEditorsForEntity(node.entity)

    const transform =
      hasComponent(node.entity, TransformComponent) &&
      !selected.some((node) => hasComponent(node.entity, DisableTransformTagComponent))

    content = (
      <StyledNodeEditor>
        <PropertiesHeader>
          <NameInputGroupContainer>
            <NameInputGroup node={node} key={node.entity} />
            {!hasComponent(node.entity, SceneTagComponent) && (
              <>
                <VisibleInputGroup name="Visible" label={t('editor:properties.lbl-visible')}>
                  <BooleanInput value={hasComponent(node.entity, VisibleComponent)} onChange={onChangeVisible} />
                </VisibleInputGroup>
                <VisibleInputGroup name="Prevent Baking" label={t('editor:properties.lbl-preventBake')}>
                  <BooleanInput
                    value={hasComponent(node.entity, PreventBakeTagComponent)}
                    onChange={onChangeBakeStatic}
                  />
                </VisibleInputGroup>
              </>
            )}
          </NameInputGroupContainer>
          <PersistInputGroup name="Persist" label={t('editor:properties.lbl-persist')}>
            <BooleanInput value={hasComponent(node.entity, PersistTagComponent)} onChange={onChangePersist} />
          </PersistInputGroup>
          {transform && <TransformPropertyGroup node={node} />}
        </PropertiesHeader>
        {editors.map((Editor, i) => (
          <Editor key={i} multiEdit={multiEdit} node={node} />
        ))}
      </StyledNodeEditor>
    )
  }

  return <PropertiesPanelContent>{content}</PropertiesPanelContent>
}

export default PropertiesPanelContainer
