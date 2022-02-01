import { Icon } from '@iconify/react'
import LockIcon from '@mui/icons-material/Lock'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import ViewCompactIcon from '@mui/icons-material/ViewCompact'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import React from 'react'
import { useStyles } from './styles'

const settings = ({
  handleAuth,
  handleAws,
  handleChargebee,
  handleRedis,
  handleEmail,
  handleClient,
  handleGameServer,
  handleServer,
  handleAnalytics,
  serverFocused,
  awsFocused,
  emailFocused,
  gameFocused,
  clientFocused,
  authFocused,
  chargebeeFocused,
  redisFocused,
  analyticsFocused
}) => {
  const classes = useStyles()

  return (
    <div>
      <List>
        <Divider variant="inset" component="li" sx={{ marginLeft: '0px' }} />
        <ListItem
          button
          onClick={handleAnalytics}
          className={analyticsFocused ? `${classes.autoFocused}` : `${classes.notFocused}`}
        >
          <ListItemAvatar>
            <Avatar style={{ background: '#5e5a4d', color: 'orange' }}>
              <Icon icon="carbon:analytics" color="orange" />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary="Analytics" />
        </ListItem>
        <Divider variant="inset" component="li" sx={{ marginLeft: '0px' }} />
        <ListItem
          button
          onClick={handleServer}
          className={serverFocused ? `${classes.focused}` : `${classes.notFocused}`}
        >
          <ListItemAvatar>
            <Avatar style={{ background: '#5e5a4d', color: 'orange' }}>
              <Icon icon="carbon:bare-metal-server" />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary="Server" />
        </ListItem>
        <Divider variant="inset" component="li" sx={{ marginLeft: '0px' }} />
        <ListItem
          button
          onClick={handleClient}
          className={clientFocused ? `${classes.focused}` : `${classes.notFocused}`}
        >
          <ListItemAvatar>
            <Avatar style={{ background: '#5e5a4d', color: 'orange' }}>
              <ViewCompactIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary="Client" />
        </ListItem>
        <Divider variant="inset" component="li" sx={{ marginLeft: '0px' }} />
        <ListItem
          button
          onClick={handleGameServer}
          className={gameFocused ? `${classes.focused}` : `${classes.notFocused}`}
        >
          <ListItemAvatar>
            <Avatar style={{ background: '#5e5a4d', color: 'orange' }}>
              <SportsEsportsIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary="Game Server" />
        </ListItem>
        <Divider variant="inset" component="li" sx={{ marginLeft: '0px' }} />
        <ListItem
          button
          onClick={handleEmail}
          className={emailFocused ? `${classes.focused}` : `${classes.notFocused}`}
        >
          <ListItemAvatar>
            <Avatar style={{ background: '#5e5a4d', color: 'orange' }}>
              <MailOutlineIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary="Email" />
        </ListItem>
        <Divider variant="inset" component="li" sx={{ marginLeft: '0px' }} />
        <ListItem button onClick={handleAuth} className={authFocused ? `${classes.focused}` : `${classes.notFocused}`}>
          <ListItemAvatar>
            <Avatar style={{ background: '#5e5a4d', color: 'orange' }}>
              <LockIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary="Authentication" />
        </ListItem>
        <Divider variant="inset" component="li" sx={{ marginLeft: '0px' }} />
        <ListItem button onClick={handleAws} className={awsFocused ? `${classes.focused}` : `${classes.notFocused}`}>
          <ListItemAvatar>
            <Avatar style={{ background: '#5e5a4d' }}>
              <Icon icon="logos:aws" />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary="Aws" />
        </ListItem>
        <Divider variant="inset" component="li" sx={{ marginLeft: '0px' }} />
        <ListItem
          button
          onClick={handleChargebee}
          className={chargebeeFocused ? `${classes.focused}` : `${classes.notFocused}`}
        >
          <ListItemAvatar>
            <Avatar style={{ background: '#5e5a4d' }}>
              <Icon icon="logos:chargebee-icon" />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary="Chargebee" />
        </ListItem>
        <Divider variant="inset" component="li" sx={{ marginLeft: '0px' }} />
        <ListItem
          button
          onClick={handleRedis}
          className={redisFocused ? `${classes.focused}` : `${classes.notFocused}`}
        >
          <ListItemAvatar>
            <Avatar style={{ background: '#5e5a4d' }}>
              <Icon icon="logos:redis" />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary="Redis" />
        </ListItem>
        <Divider variant="inset" component="li" sx={{ marginLeft: '0px' }} />
      </List>
    </div>
  )
}

export default settings
