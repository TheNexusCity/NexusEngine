import { Theme } from '@mui/material/styles'

import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    tableContainer: {
      maxHeight: '73vh'
    },
    searchRoot: {
      padding: '2px 20px',
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      background: '#343b41'
    },
    input: {
      marginLeft: theme.spacing(1),
      flex: 1,
      color: '#f1f1f1'
    },
    iconButton: {
      padding: 10,
      color: '#f1f1f1'
    },
    paperDialog: {
      background: 'rgb(58, 65, 73) !important',
      color: '#f1f1f1'
    },
    spanDange: {
      color: '#FF8C00'
    },
    spanNone: {
      color: '#808080'
    },
    tableCellHeader: {
      background: '#343b41 !important',
      color: '#f1f1f1 !important',
      borderBottom: '2px solid #23282c !important'
    },
    tableCellBody: {
      borderBottom: '1px solid #23282c !important',
      color: '#f1f1f1 !important'
    },
    tableFooter: {
      background: '#343b41 !important',
      color: '#f1f1f1 !important'
    },
    actionStyle: {
      textDecoration: 'none',
      color: '#000',
      marginRight: '10px'
    },
    spanWhite: {
      color: '#f1f1f1'
    },
    paperDrawer: {
      width: '40%',
      backgroundColor: '#43484F',
      color: '#f1f1f1',
      overflow: 'auto',
      [theme.breakpoints.down('md')]: {
        overflowY: 'scroll'
      }
    },
    marginTp: {
      marginTop: '20%'
    },
    texAlign: {
      textAlign: 'center'
    },
    redBorder: {
      border: '1px solid red',
      padding: '2px 4px',
      display: 'flex',
      alignItems: 'center',
      marginTop: '10px',
      marginBottom: '15px',
      background: '#343b41',
      color: '#f1f1f1 !important'
    },
    createInput: {
      padding: '2px 4px',
      display: 'flex',
      alignItems: 'center',
      marginTop: '10px',
      marginBottom: '15px',
      background: '#343b41',
      border: '1px solid #23282c',
      color: '#f1f1f1 !important'
    },
    select: {
      color: '#f1f1f1 !important'
    },
    selectPaper: {
      background: '#343b41',
      color: '#f1f1f1'
    },
    marginBottom: {
      marginBottom: '10px'
    },
    marginBottm: {
      marginBottom: '15px',
      [theme.breakpoints.down('md')]: {
        marginBottom: '0'
      }
    },
    saveBtn: {
      marginLeft: 'auto',
      background: '#43484F !important',
      color: '#fff !important',
      width: '150px',
      marginRight: '25px',
      boxShadow:
        '0px 3px 1px -2px rgb(0 0 0 / 20%), 0px 2px 2px 0px rgb(0 0 0 / 14%), 0px 1px 5px 0px rgb(0 0 0 / 12%) !important',
      [theme.breakpoints.down('md')]: {
        width: '120px'
      },
      [theme.breakpoints.between(100, 0)]: {
        width: '100px'
      }
    },
    createBtn: {
      height: '50px',
      margin: 'auto 5px',
      width: '100%',
      background: 'rgb(58, 65, 73)',
      color: '#f1f1f1 !important',
      [theme.breakpoints.down('md')]: {
        fontSize: '0.7rem'
      }
    },
    rootTable: {
      flexGrow: 1,
      width: '100%',
      backgroundColor: '#43484F',
      color: '#f1f1f1'
    },
    rootPaper: {
      marginTop: '65px',
      height: '15vh',
      background: '#111',
      color: '#f1f1f1',
      backgroundColor: '#343b41',
      [theme.breakpoints.down('md')]: {
        height: '10vh'
      }
    },
    locationTitle: {
      margin: '50px auto',
      width: '300px',
      textAlign: 'center',
      [theme.breakpoints.down('md')]: {
        margin: '10px auto'
      }
    },
    locationSubTitle: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    mt10: {
      marginTop: '10%'
    },
    headingFont: {
      [theme.breakpoints.down('md')]: {
        fontSize: '1.6rem'
      },
      [theme.breakpoints.between(100, 0)]: {
        fontSize: '1.4rem'
      }
    },
    middlePaper: {
      color: '#f1f1f1',
      padding: '20px 0 8px 20px',
      background: '#15171B',
      height: '10rem'
    },
    pdl: {
      paddingLeft: '1rem',
      [theme.breakpoints.down('md')]: {
        paddingLeft: '0'
      }
    },
    typo: {
      lineHeight: '1rem'
    },
    locationOtherInfo: {
      fontSize: '1.2rem'
    },
    mb: {
      marginBottom: '10px'
    },
    mb20px: {
      marginBottom: '20px'
    },
    spacing: {
      paddingLeft: '2rem',
      marginTop: '5%',
      [theme.breakpoints.down('md')]: {
        paddingLeft: '1rem'
      }
    },
    typoFont: {
      [theme.breakpoints.down('md')]: {
        fontSize: '1.5rem',
        paddingLeft: '1rem'
      }
    },
    pdlarge: {
      paddingLeft: '2rem',
      [theme.breakpoints.down('md')]: {
        paddingLeft: '1rem'
      }
    },
    mb10: {
      marginBottom: '5%'
    },
    marginTpM: {
      marginTop: '10%',
      [theme.breakpoints.down('md')]: {
        marginTop: '2.5rem'
      }
    }
  })
)
