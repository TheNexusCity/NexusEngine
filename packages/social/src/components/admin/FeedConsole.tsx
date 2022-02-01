/**
 * @author Tanya Vykliuk <tanya.vykliuk@gmail.com>
 */
import React, { useState } from 'react'
import { useDispatch } from '@xrengine/client-core/src/store'

import { Theme } from '@mui/material/styles'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableContainer from '@mui/material/TableContainer'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Paper from '@mui/material/Paper'
import Button from '@material-ui/core/Button'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import styles from './Admin.module.scss'
import Backdrop from '@mui/material/Backdrop'
import CircularProgress from '@mui/material/CircularProgress'
import VisibilityIcon from '@mui/icons-material/Visibility'
import WhatshotIcon from '@mui/icons-material/Whatshot'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import StarIcon from '@mui/icons-material/Star'
import StarOutlineIcon from '@mui/icons-material/StarOutline'
import { Edit } from '@mui/icons-material'
import Slide from '@mui/material/Slide'
import { TransitionProps } from '@mui/material/transitions'
import FeedForm from '@xrengine/social/src/components/FeedForm'
import { FeedService } from '@xrengine/client-core/src/social/services/FeedService'
import { ADMIN_PAGE_LIMIT } from '@xrengine/client-core/src/admin/services/AdminService'
import { EnhancedTableHead } from '@xrengine/client-core/src/admin/components/AdminHelpers'
import SharedModal from '@xrengine/client-core/src/admin/components/SharedModal'

if (!global.setImmediate) {
  global.setImmediate = setTimeout as any
}

interface Props {
  authState?: any
  locationState?: any
  fetchAdminInstances?: any
  removeUser?: any
  list?: any
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formControl: {
      margin: theme.spacing(0),
      minWidth: 120,
      backgroundColor: 'white'
    },
    selectEmpty: {
      marginTop: theme.spacing(0)
    },
    backdrop: {
      zIndex: theme.zIndex.drawer + 1,
      color: '#fff'
    }
  })
)

const Transition = React.forwardRef(
  (props: TransitionProps & { children?: React.ReactElement<any, any> }, ref: React.Ref<unknown>) => {
    return <Slide direction="up" ref={ref} {...props} />
  }
)

const FeedConsole = (props: Props) => {
  const classes = useStyles()
  const { list } = props
  const dispatch = useDispatch()
  const headCells = [
    { id: 'featuredByAdmin', numeric: false, disablePadding: false, label: 'Featured by Admin' },
    { id: 'preview', numeric: false, disablePadding: false, label: 'Preview' },
    { id: 'video', numeric: false, disablePadding: false, label: 'Video' },
    { id: 'details', numeric: false, disablePadding: false, label: 'Details' },
    { id: 'creatorId', numeric: false, disablePadding: false, label: 'Creator' },
    { id: 'createdAt', numeric: false, disablePadding: false, label: 'Created' },
    { id: 'action', numeric: false, disablePadding: false, label: '' }
  ]

  function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) {
      return -1
    }
    if (b[orderBy] > a[orderBy]) {
      return 1
    }
    return 0
  }
  type Order = 'asc' | 'desc'

  function getComparator<Key extends keyof any>(
    order: Order,
    orderBy: Key
  ): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy)
  }

  function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number])
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0])
      if (order !== 0) return order
      return a[1] - b[1]
    })
    return stabilizedThis.map((el) => {
      return el[0]
    })
  }

  const [modalOpen, setModalOpen] = useState(false)
  const [order, setOrder] = React.useState<Order>('asc')
  const [orderBy, setOrderBy] = React.useState<any>('name')
  const [selected, setSelected] = React.useState<string[]>([])
  const [dense, setDense] = React.useState(false)
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(ADMIN_PAGE_LIMIT)
  const [loading, setLoading] = React.useState(false)
  const [view, setView] = React.useState(null)

  const handleRequestSort = (event: React.MouseEvent<unknown>, property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleView = (id: string) => {
    setView(list.find((item) => item.id === id))
    setModalOpen(true)
  }

  const handleClose = () => {
    setModalOpen(false)
  }

  const handleUpdateFeed = (feed) => {
    FeedService.updateFeedAsAdmin(feed.id, feed)
  }

  return (
    <div>
      <Typography variant="h2" color="primary">
        Social Feeds List
      </Typography>
      <Paper className={styles.adminRoot}>
        <TableContainer className={styles.tableContainer}>
          <Table
            stickyHeader
            aria-labelledby="tableTitle"
            size={dense ? 'small' : 'medium'}
            aria-label="enhanced table"
          >
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              headCells={headCells}
            />
            <TableBody className={styles.thead}>
              {stableSort(list, getComparator(order, orderBy)).map((row, index) => {
                return (
                  <TableRow
                    hover
                    className={styles.trow}
                    style={{ color: 'black !important' }}
                    tabIndex={-1}
                    key={row.id}
                  >
                    <TableCell className={styles.tcell} align="center">
                      <Typography variant="h3" color="textPrimary">
                        {row.featuredByAdmin ? <StarIcon /> : <StarOutlineIcon />}
                      </Typography>
                    </TableCell>
                    <TableCell className={styles.tcell} align="center">
                      <CardMedia
                        className={styles.previewImage}
                        image={row.previewUrl?.toString()}
                        title={row.title?.toString()}
                      />
                    </TableCell>
                    <TableCell className={styles.tcell}>
                      <CardMedia
                        className={styles.previewImage}
                        src={row.videoUrl.toString()}
                        title={row.title.toString()}
                        component="video"
                        controls
                        autoPlay={false}
                      />
                    </TableCell>
                    <TableCell className={styles.tcell} align="left">
                      <section className={styles.iconsContainer}>
                        <Typography variant="h3" color="textPrimary">
                          {row.featured ? <StarIcon /> : <StarOutlineIcon />}
                        </Typography>
                        <Typography variant="h3" color="textPrimary">
                          <VisibilityIcon style={{ fontSize: '16px' }} />
                          {row.viewsCount}
                        </Typography>
                        <Typography variant="h3" color="textPrimary">
                          <WhatshotIcon htmlColor="#FF6201" />
                          {row.fires}
                        </Typography>
                        <Typography variant="h3" color="textPrimary">
                          <BookmarkIcon />
                          {row.bookmarks}
                        </Typography>
                      </section>
                      <br />
                      {row.title}
                      <br />
                      {row.description}
                    </TableCell>
                    <TableCell className={styles.tcell} align="left">
                      <Avatar src={row.avatar?.toString()} />
                      {row.creatorName + ', ' + row.creatorUserName}
                    </TableCell>
                    <TableCell className={styles.tcell} align="right">
                      {row.createdAt}
                    </TableCell>
                    <TableCell className={styles.tcell}>
                      {row.featuredByAdmin === 1 ? (
                        <Button
                          variant="outlined"
                          color="secondary"
                          style={{ width: 'fit-content' }}
                          onClick={() => handleUpdateFeed({ id: row.id.toString(), featuredByAdmin: 0 })}
                        >
                          UnFeature
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          color="secondary"
                          style={{ width: 'fit-content' }}
                          onClick={() => handleUpdateFeed({ id: row.id.toString(), featuredByAdmin: 1 })}
                        >
                          Feature
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        color="secondary"
                        style={{ width: 'fit-content' }}
                        onClick={() => handleView(row.id.toString())}
                      >
                        <Edit className="text-success" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {view && (
          <SharedModal open={modalOpen} TransitionComponent={Transition} onClose={handleClose}>
            <FeedForm feed={view} />
          </SharedModal>
        )}
      </Paper>
      <Backdrop className={classes.backdrop} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  )
}

export default FeedConsole
