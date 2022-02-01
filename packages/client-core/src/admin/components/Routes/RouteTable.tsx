import React, { ChangeEvent, useEffect, useState } from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import { useAuthState } from '../../../user/services/AuthService'
import { useRouteStyles, useRouteStyle } from './styles'
import { useRouteState } from '../../services/RouteService'
import { RouteService } from '../../services/RouteService'
import { ActiveRouteService, useActiveRouteState } from '../../services/ActiveRouteService'
import { Checkbox } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'

export interface RouteColumn {
  id: 'project' | 'route' | 'active'
  label: string
  minWidth?: number
  align?: 'right'
}

export const routeColumns: RouteColumn[] = [
  { id: 'project', label: 'Project', minWidth: 65 },
  { id: 'route', label: 'Route', minWidth: 65 },
  {
    id: 'active',
    label: 'Active',
    minWidth: 65,
    align: 'right'
  }
]

/**
 * Temporary
 */
const ROUTE_PAGE_LIMIT = 1000

/**
 *
 * @param props
 * @returns
 */

const RouteTable = () => {
  const classes = useRouteStyle()
  const classex = useRouteStyles()

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(ROUTE_PAGE_LIMIT)

  const authState = useAuthState()
  const user = authState.user
  const adminRouteState = useRouteState()
  const adminActiveRouteState = useActiveRouteState()
  const adminRoute = adminRouteState
  const activeRouteData = adminActiveRouteState.activeRoutes
  const installedRouteData = adminRoute.routes
  const adminRouteCount = adminRoute.total
  const [processing, setProcessing] = useState(false)

  const handlePageChange = (event: unknown, newPage: number) => {
    const incDec = page < newPage ? 'increment' : 'decrement'
    ActiveRouteService.fetchActiveRoutes(incDec)
    RouteService.fetchInstalledRoutes(incDec)
    setPage(newPage)
  }

  useEffect(() => {
    if (user?.id?.value && adminRoute.updateNeeded.value === true) {
      ActiveRouteService.fetchActiveRoutes()
      RouteService.fetchInstalledRoutes()
    }
  }, [authState.user?.id?.value, adminRouteState.updateNeeded.value])

  useEffect(() => {
    ActiveRouteService.fetchActiveRoutes()
    RouteService.fetchInstalledRoutes()
  }, [])

  useEffect(() => {
    // console.log('setting false', activeRouteData.value)
    // setProcessing(false)
  }, [activeRouteData.value])

  const handleRowsPerPageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  const isRouteActive = (project: string, route: string) =>
    activeRouteData.findIndex((a) => {
      return a.project.value === project && a.route.value === route
    }) !== -1

  const activateCallback = (project: string, route: string, checked: boolean) => {
    // setProcessing(true)
    // setTimeout(() => {
    ActiveRouteService.setRouteActive(project, route, checked)
    // }, 1000)
  }

  const installedRoutes = installedRouteData
    .map((el) => {
      if (!el.routes?.length) return []
      return el.routes.map((route) => {
        return {
          id: el.project.value + route.value,
          project: el.project.value,
          route: route.value,
          active: (
            <Checkbox
              className={classex.checkboxContainer}
              checked={isRouteActive(el.project.value, route.value)}
              onChange={(ev, checked) => activateCallback(el.project.value, route.value, checked)}
            />
          )
        }
      })
    })
    .flat()

  return (
    <>
      <div className={classes.root}>
        <TableContainer className={classes.container}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                {routeColumns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                    className={classex.tableCellHeader}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {installedRoutes.map((row) => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                    {routeColumns.map((column) => {
                      const value = row[column.id]
                      return (
                        <TableCell key={column.id} align={column.align} className={classex.tableCellBody}>
                          {value}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[ROUTE_PAGE_LIMIT]}
          component="div"
          count={adminRouteCount.value}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          className={classex.tableFooter}
        />
        {processing && (
          <div className={classes.progressBackground}>
            <CircularProgress className={classes.progress} />
          </div>
        )}
      </div>
    </>
  )
}

export default RouteTable
