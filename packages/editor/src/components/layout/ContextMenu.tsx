import React from 'react'
// react-contextmenu has a bug when built, and the only viable
// workaround is to import from the /dist bunled copy of it.
import {
  connectMenu as _connectMenu,
  ContextMenu as ReactContextMenu,
  MenuItem as _MenuItem,
  showMenu as _showMenu,
  SubMenu as _SubMenu,
  ContextMenuTrigger as _ContextMenuTrigger,
  ContextMenuProps
} from 'react-contextmenu'
import { EditorTheme } from '@xrengine/client-core/src/util/theme'
import { createGlobalStyle } from 'styled-components'
export const connectMenu = _connectMenu
export const MenuItem = _MenuItem
export const showMenu = _showMenu
export const SubMenu = _SubMenu
export const ContextMenuTrigger = _ContextMenuTrigger

/**
 *
 * @author Robert Long
 * @author Abhishek Pathak
 */
export const ContextMenuStyles = createGlobalStyle<{ theme: EditorTheme }>`
  .react-contextmenu {
    background-color: ${(props) => props.theme.dropdown};
    background-clip: padding-box;
    border-radius: 4px;
    margin: 2px 0 0;
    min-width: 140px;
    outline: none;
    opacity: 0;
    padding: 4px 0;
    pointer-events: none;
    text-align: left;
    box-shadow: ${(props) => props.theme.shadow30};
  }

  .react-contextmenu-wrapper {
    height: calc(100% - 40px);
    width:100%;
  }

  .react-contextmenu.react-contextmenu--visible {
    opacity: 1;
    pointer-events: auto;
    z-index: 9999;
  }

  .react-contextmenu-item {
    background: 0 0;
    border: 0;
    cursor: pointer;
    line-height: 24px;
    padding: 4px 8px;
    text-align: inherit;
    white-space: nowrap;
    display: flex;
    flex: 1;
    justify-content: space-between;
    color: ${(props) => props.theme.text};
  }

  .react-contextmenu-item.react-contextmenu-item--active,
  .react-contextmenu-item.react-contextmenu-item--selected {
    color: ${(props) => props.theme.text};
    background-color: ${(props) => props.theme.selected};
    border-color: transparent;
    text-decoration: none;
  }

  .react-contextmenu-item.react-contextmenu-item--disabled,
  .react-contextmenu-item.react-contextmenu-item--disabled:hover {
    background-color: transparent;
    border-color: rgba(0,0,0,.15);
    color: ${(props) => props.theme.text};
  }

  .react-contextmenu-item--divider {
    border-bottom: 1px solid ${(props) => props.theme.border};
    cursor: inherit;
    margin: 4px 0;
    height: 1px;
    padding: 0;
  }

  .react-contextmenu-item.react-contextmenu-submenu {
    padding: 0;
  }

  .react-contextmenu-item.react-contextmenu-submenu > .react-contextmenu-item::after {
    display: inline-block;
    font-size: 12px;
    content: "▸";
    vertical-align: middle;
  }
`

/**
 *
 * @author Robert Long
 * @param {ReactNode} children
 * @param {string} id
 * @param {any} rest
 * @returns
 */
export const ContextMenu = ({ children, ...rest }: React.PropsWithChildren<ContextMenuProps>) => {
  return (
    <>
      <ReactContextMenu {...rest}>{children}</ReactContextMenu>
      <ContextMenuStyles />
    </>
  )
}
