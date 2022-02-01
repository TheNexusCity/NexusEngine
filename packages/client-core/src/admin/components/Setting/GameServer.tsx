import React, { useEffect } from 'react'
import { useStyles } from './styles'
import Switch from '@mui/material/Switch'
import { Grid, Paper, Typography } from '@mui/material'
import InputBase from '@mui/material/InputBase'
import { useAuthState } from '../../../user/services/AuthService'
import { GameServerSettingService } from '../../services/Setting/GameServerSettingService'
import { useGameServerSettingState } from '../../services/Setting/GameServerSettingService'

interface gameServerProps {}

const GameServer = (props: gameServerProps) => {
  const classes = useStyles()
  const gameServerSettingState = useGameServerSettingState()
  const gameServerSettings = gameServerSettingState?.gameserver?.value || []
  const authState = useAuthState()
  const user = authState.user
  const [local, setLocal] = React.useState({
    checkedA: true,
    checkedB: true
  })
  const handleLocal = (event) => {
    setLocal({ ...local, [event.target.name]: event.target.checked })
  }

  useEffect(() => {
    if (user?.id?.value != null && gameServerSettingState?.updateNeeded?.value === true) {
      GameServerSettingService.fetchedGameServerSettings()
    }
  }, [authState?.user?.id?.value, gameServerSettingState?.updateNeeded?.value])

  return (
    <div>
      <form>
        <Typography component="h1" className={classes.settingsHeading}>
          GAME SERVER
        </Typography>
        {gameServerSettings.map((el) => (
          <div className={classes.root} key={el?.id || ''}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <label> Client Host</label>
                <Paper component="div" className={classes.createInput}>
                  <InputBase
                    name="clientHost"
                    className={classes.input}
                    disabled
                    style={{ color: '#fff' }}
                    value={el?.clientHost || ''}
                  />
                </Paper>
                <label>rtc_start_port</label>
                <Paper component="div" className={classes.createInput}>
                  <InputBase
                    name="rtc_start_port"
                    className={classes.input}
                    disabled
                    style={{ color: '#fff' }}
                    value={el?.rtc_start_port || ''}
                  />
                </Paper>
                <label>rtc_end_port</label>
                <Paper component="div" className={classes.createInput}>
                  <InputBase
                    name="rtc_end_port"
                    className={classes.input}
                    disabled
                    style={{ color: '#fff' }}
                    value={el?.rtc_end_port || ''}
                  />
                </Paper>
                <label>rtc_port_block_size</label>
                <Paper component="div" className={classes.createInput}>
                  <InputBase
                    name="rtc_port_block_size"
                    className={classes.input}
                    disabled
                    style={{ color: '#fff' }}
                    value={el?.rtc_port_block_size || ''}
                  />
                </Paper>
                <label>Identifier Digits </label>
                <Paper component="div" className={classes.createInput}>
                  <InputBase
                    disabled
                    name="identifierDigits"
                    className={classes.input}
                    style={{ color: '#fff' }}
                    value={el?.identifierDigits || ''}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <label> Local </label>
                <Paper component="div" className={classes.createInput}>
                  <Switch
                    disabled
                    checked={local.checkedB}
                    onChange={handleLocal}
                    color="primary"
                    name="checkedB"
                    inputProps={{ 'aria-label': 'primary checkbox' }}
                  />
                </Paper>
                <label> Domain </label>
                <Paper component="div" className={classes.createInput}>
                  <InputBase
                    name="domain"
                    className={classes.input}
                    disabled
                    style={{ color: '#fff' }}
                    value={el?.domain || ''}
                  />
                </Paper>
                <label> Release Name </label>
                <Paper component="div" className={classes.createInput}>
                  <InputBase
                    name="releaseName"
                    className={classes.input}
                    disabled
                    style={{ color: '#fff' }}
                    value={el?.releaseName || ''}
                  />
                </Paper>
                <label> Port </label>
                <Paper component="div" className={classes.createInput}>
                  <InputBase
                    name="port"
                    className={classes.input}
                    disabled
                    style={{ color: '#fff' }}
                    value={el?.port || ''}
                  />
                </Paper>
                <label> Mode </label>
                <Paper component="div" className={classes.createInput}>
                  <InputBase
                    name="mode"
                    className={classes.input}
                    disabled
                    style={{ color: '#fff' }}
                    value={el?.mode || ''}
                  />
                </Paper>
                <label> Location Name </label>
                <Paper component="div" className={classes.createInput}>
                  <InputBase
                    name="locationName"
                    className={classes.input}
                    disabled
                    style={{ color: '#fff' }}
                    value={el?.locationName || ''}
                  />
                </Paper>
              </Grid>
            </Grid>
          </div>
        ))}
      </form>
    </div>
  )
}

export default GameServer
