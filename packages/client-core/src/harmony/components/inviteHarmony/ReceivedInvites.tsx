import React from 'react'
import ListItem from '@mui/material/ListItem'
import Divider from '@mui/material/Divider'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import { useStyle, useStyles, RootList, AcceptInviteBtn } from './style'

const ReceivedInvites = () => {
  const invites = [
    {
      id: 'WGTWF-123123',
      name: 'Kimenyi',
      description: 'Evening meeting',
      accepted: true
    },
    {
      id: 'WGTWF-12312',
      name: 'Kevin',
      description: 'Evening show',
      accepted: true
    },
    {
      id: 'WGTWF-1231',
      name: 'Mugisha',
      description: 'Evening meeting',
      accepted: false
    },
    {
      id: 'WGTWF-12',
      name: 'Karera',
      description: 'Evening meeting',
      accepted: false
    },
    {
      id: 'WGTWF-1',
      name: 'Emmy',
      description: 'Evening meeting',
      accepted: true
    },
    {
      id: 'WGTWF-4541',
      name: 'Pinto',
      description: 'Home gathering',
      accepted: true
    },
    {
      id: 'WGTWF-4541',
      name: 'Pele',
      description: 'Church gathering',
      accepted: true
    },
    {
      id: 'WGTWF-4541',
      name: 'Pele',
      description: 'Church gathering',
      accepted: true
    },
    {
      id: 'WGTWF-4541',
      name: 'Pele',
      description: 'Church gathering',
      accepted: true
    },
    {
      id: 'WGTWF-4541',
      name: 'Pele',
      description: 'Church gathering',
      accepted: true
    }
  ]
  const classes = useStyles()
  const classex = useStyles()

  return (
    <div className={classes.scroll}>
      <RootList>
        {invites.map((el) => {
          return (
            <div key={el.id}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar>{el.name.slice(0, 1).toLocaleUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  style={{ backgroundColor: '#43484F', color: '#f1f1f1' }}
                  primary={el.name}
                  // secondary={<React.Fragment>{el.description}</React.Fragment>}
                />
                {el.accepted ? (
                  <Chip label="accepted" variant="outlined" className={classes.accepted} />
                ) : (
                  <div className={classes.btnContainer}>
                    <AcceptInviteBtn variant="contained">Accept</AcceptInviteBtn>
                    <Button variant="contained" className={classes.rejectedBtn}>
                      Reject
                    </Button>
                  </div>
                )}
              </ListItem>

              <Divider variant="fullWidth" component="li" style={{ backgroundColor: 'rgba(255, 255, 255, 0.16)' }} />
            </div>
          )
        })}
      </RootList>
    </div>
  )
}

export default ReceivedInvites
