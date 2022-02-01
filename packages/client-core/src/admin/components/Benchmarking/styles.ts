import { Theme } from '@mui/material/styles'

import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'

export const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    secondaryHeading: {
      fontSize: theme.typography.pxToRem(15),
      color: '#C0C0C0'
    }
  })
)
