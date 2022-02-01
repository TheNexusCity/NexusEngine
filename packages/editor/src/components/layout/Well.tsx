import styled from 'styled-components'

/**
 *
 *  @author Robert Long
 */
const Well = (styled as any).div`
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 4px;
  margin: 8px;
`

Well.displayName = 'Well'

export default Well
