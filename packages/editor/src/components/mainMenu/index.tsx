import React from 'react'
import ToolButton from '../toolbar/ToolButton'
import MenuIcon from '@mui/icons-material/Menu'
import { ContextMenu, MenuItem, SubMenu, showMenu } from '../layout/ContextMenu'
import { useState } from 'react'
import Hotkeys, { OnKeyFun } from 'react-hot-keys'

interface Command {
  name: string
  action: Function
  hotkey?: string
  subCommnads?: Command[]
}

interface MainMenuProp {
  commands: Command[]
}

const MainMenu = (props: MainMenuProp) => {
  let [isMenuOpen, setMenuOpen] = useState(false)

  const toggleMenu = (e) => {
    if (isMenuOpen) {
      setMenuOpen(!isMenuOpen)
      return
    }

    const x = 0
    const y = e.currentTarget.offsetHeight
    showMenu({
      position: { x, y },
      target: e.currentTarget,
      id: 'menu'
    })

    setMenuOpen(true)
  }

  const hideMenu = () => setMenuOpen(false)

  const renderMenu = (command: Command) => {
    if (!command.subCommnads || command.subCommnads.length === 0) {
      const menuItem = (
        <MenuItem key={command.name} onClick={command.action}>
          {command.name}
          {command.hotkey && <div>{command.hotkey}</div>}
        </MenuItem>
      )

      if (command.hotkey) {
        return (
          <Hotkeys key={command.name} keyName={command.hotkey} onKeyUp={command.action as OnKeyFun}>
            {menuItem}
          </Hotkeys>
        )
      }
      return menuItem
    } else {
      return (
        <SubMenu key={command.name} title={command.name} hoverDelay={0}>
          {command.subCommnads.map((subcommand) => {
            return renderMenu(subcommand)
          })}
        </SubMenu>
      )
    }
  }

  return (
    <>
      <ToolButton icon={MenuIcon} onClick={toggleMenu} isSelected={isMenuOpen} id="menu" />
      <ContextMenu id="menu" onHide={hideMenu}>
        {props.commands.map((command: Command) => renderMenu(command))}
      </ContextMenu>
    </>
  )
}

export default MainMenu
