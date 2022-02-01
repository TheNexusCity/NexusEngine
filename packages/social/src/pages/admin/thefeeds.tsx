/**
 * @author Gleb Ordinsky <glebordinskijj@gmail.com>
 */
import React, { useEffect } from 'react'
import Dashboard from '@xrengine/social/src/components/Dashboard'

import { useDispatch } from '@xrengine/client-core/src/store'
import { TheFeedsService } from '@xrengine/client-core/src/social/services/TheFeedsService'
import { AuthService } from '@xrengine/client-core/src/user/services/AuthService'
import TheFeedsConsole from '@xrengine/social/src/components/admin/Feeds'
import { useTheFeedsState } from '@xrengine/client-core/src/social/services/TheFeedsService'

// const thefeeds = '';
// conts Feeds = '';

interface Props {
  //doLoginAuto: typeof AuthService.doLoginAuto
}

const TheFeeds = ({}: //doLoginAuto
Props) => {
  const dispatch = useDispatch()
  const create = (data) => {
    TheFeedsService.createTheFeedsNew(data)
  }
  const deleteTheFeed = (id) => {
    TheFeedsService.removeTheFeeds(id)
  }
  const update = (obj) => {
    TheFeedsService.updateTheFeedsAsAdmin(obj)
  }
  const theFeedsState = useTheFeedsState()

  useEffect(() => {
    AuthService.doLoginAuto(true, true)
    TheFeedsService.getTheFeedsNew()
  }, [])
  const TheFeedsList = theFeedsState?.thefeeds.value || []
  return (
    <>
      <div>
        <Dashboard>
          <TheFeedsConsole create={create} list={TheFeedsList} deleteTheFeed={deleteTheFeed} update={update} />
        </Dashboard>
      </div>
    </>
  )
}

export default TheFeeds
