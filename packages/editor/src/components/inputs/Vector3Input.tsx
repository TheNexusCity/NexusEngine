import React, { useState } from 'react'
import NumericInput from './NumericInput'
import Scrubber from './Scrubber'
import { Vector3 } from 'three'
import styled from 'styled-components'
import LinkIcon from '@mui/icons-material/Link'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import Hidden from '../layout/Hidden'

export const Vector3InputContainer = (styled as any).div`
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  justify-content: flex-start;
`

export const Vector3Scrubber = (styled as any)(Scrubber)`
  display: flex;
  align-items: center;
  color: ${(props) => props.theme.text2};

  &:not(:first-child) {
      padding: 0 6px;
  }
  &:first-child {
    padding-right: 6px;
  }
`

export const UniformButtonContainer = (styled as any).div`
  display: flex;
  align-items: center;
  width: 12px;
  margin-left: 6px;

  svg {
    width: 100%;
  }

  label {
    color: ${(props) => props.theme.text2};
  }

  label:hover {
    color: ${(props) => props.theme.blueHover};
  }
`

let uniqueId = 0

interface Vector3InputProp {
  uniformScaling?: boolean
  smallStep?: number
  mediumStep?: number
  largeStep?: number
  value: any
  onChange: Function
  hideLabels?: boolean
}

interface Vector3InputState {
  uniformEnabled: any
  hideLabels: boolean
}

/**
 *
 * @author Robert Long
 */
export const Vector3Input = (props: Vector3InputProp) => {
  const id = uniqueId++
  const newValue = new Vector3()
  const [uniformEnabled, setUniformEnabled] = useState(props.uniformScaling)
  const [hideLabels, setHideLabels] = useState(props.hideLabels ?? false)

  const onToggleUniform = () => {
    setUniformEnabled(!uniformEnabled)
  }

  const onChange = (field, fieldValue) => {
    const { value, onChange } = props

    if (uniformEnabled) {
      newValue.set(fieldValue, fieldValue, fieldValue)
    } else {
      const x = value ? value.x : 0
      const y = value ? value.y : 0
      const z = value ? value.z : 0

      newValue.x = field === 'x' ? fieldValue : x
      newValue.y = field === 'y' ? fieldValue : y
      newValue.z = field === 'z' ? fieldValue : z
    }

    if (typeof onChange === 'function') {
      onChange(newValue)
    }
  }

  const onChangeX = (x) => onChange('x', x)

  const onChangeY = (y) => onChange('y', y)

  const onChangeZ = (z) => onChange('z', z)

  const { uniformScaling, value, ...rest } = props
  const vx = value ? value.x : 0
  const vy = value ? value.y : 0
  const vz = value ? value.z : 0
  const checkboxId = 'uniform-button-' + id

  return (
    <Vector3InputContainer>
      <Vector3Scrubber {...rest} tag="div" value={vx} onChange={onChangeX}>
        {!hideLabels && <div>X:</div>}
      </Vector3Scrubber>
      <NumericInput {...rest} value={vx} onChange={onChangeX} />
      <Vector3Scrubber {...rest} tag="div" value={vy} onChange={onChangeY}>
        {!hideLabels && <div>Y:</div>}
      </Vector3Scrubber>
      <NumericInput {...rest} value={vy} onChange={onChangeY} />
      <Vector3Scrubber {...rest} tag="div" value={vz} onChange={onChangeZ}>
        {!hideLabels && <div>Z:</div>}
      </Vector3Scrubber>
      <NumericInput {...rest} value={vz} onChange={onChangeZ} />
      <UniformButtonContainer>
        {uniformScaling && (
          <>
            <Hidden as="input" id={checkboxId} type="checkbox" checked={uniformEnabled} onChange={onToggleUniform} />
            <label title="Uniform Scale" htmlFor={checkboxId}>
              {uniformEnabled ? <LinkIcon /> : <LinkOffIcon />}
            </label>
          </>
        )}
      </UniformButtonContainer>
    </Vector3InputContainer>
  )
}

Vector3Input.defaultProps = {
  value: new Vector3(),
  hideLabels: false,
  onChange: () => {}
}

export default Vector3Input
