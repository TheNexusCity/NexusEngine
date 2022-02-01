import { Theme } from '@mui/material/styles'
import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'
import { deepOrange } from '@mui/material/colors'

const drawerWidth = 200

export const useStylesForDashboard = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex'
    },
    header: {
      height: '64px !important'
    },
    appBar: {
      zIndex: theme.zIndex.drawer + 1,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      }),
      backgroundColor: '#43484F'
    },
    appBarShift: {
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    },
    menuButton: {
      marginRight: 36,
      color: 'white'
    },
    hide: {
      display: 'none'
    },
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
      whiteSpace: 'nowrap'
    },
    drawerOpen: {
      width: `${drawerWidth}px !important`,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      }),
      backgroundColor: '#1f252d'
    },
    drawerClose: {
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      }),
      overflowX: 'hidden',
      width: `calc(${theme.spacing(7)} + 1px) !important`,
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9) + 1
      },
      backgroundColor: '#1f252d'
    },
    toolbar: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: theme.spacing(0, 1),
      // necessary for content to be below app bar
      ...theme.mixins.toolbar
    },
    appBarHeadingContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    appBarHeadingName: {
      ['@media (max-width:500px)']: {
        display: 'none'
      }
    },
    content: {
      top: '64px',
      overflow: 'auto',
      position: 'relative',
      padding: theme.spacing(3),
      backgroundColor: '#15171B',
      height: 'calc(100vh - 64px)'
    },
    contentWidthDrawerOpen: {
      width: `calc(100vw - ${drawerWidth}px)`
    },
    contentWidthDrawerClosed: {
      width: `calc(100vw - ${theme.spacing(7) + 1}px)`
    },
    backdrop: {
      zIndex: theme.zIndex.drawer + 1,
      color: '#fff'
    },
    textLink: {
      textDecoration: 'none'
    },
    orange: {
      color: theme.palette.getContrastText(deepOrange[500]),
      backgroundColor: deepOrange[500]
    },
    marginLft: {
      marginLeft: '10px'
    },
    avatarPosition: {
      display: 'flex',
      alignItems: 'center',
      justifyItems: 'center'
    },
    selected: {
      background: '#15171B !important'
    },
    nested: {
      paddingLeft: '2rem !important'
    },
    mdFont: {
      [theme.breakpoints.down('md')]: {
        fontSize: '1rem'
      }
    }
  })
)
