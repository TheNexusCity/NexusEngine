/**
 * @author Tanya Vykliuk <tanya.vykliuk@gmail.com>
 */
import { Card, CardContent, CardMedia, Typography, Avatar } from '@mui/material'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import PersonPinIcon from '@mui/icons-material/PersonPin'
import React, { useEffect, useState } from 'react'
import { useDispatch } from '@xrengine/client-core/src/store'

import { useCreatorState } from '@xrengine/client-core/src/social/services/CreatorService'
import { CreatorService } from '@xrengine/client-core/src/social/services/CreatorService'
// @ts-ignore
import styles from './Creators.module.scss'
import { PopupsStateService } from '@xrengine/client-core/src/social/services/PopupsStateService'
import { useHistory } from 'react-router-dom'

interface Props {}

const Creators = (props: Props) => {
  const history = useHistory()
  const creatorsState = useCreatorState()
  const dispatch = useDispatch()
  useEffect(() => {
    CreatorService.getCreators()
  }, [])
  const creators =
    creatorsState.creators.creators?.value && creatorsState.creators.fetchingCreators?.value === false
      ? creatorsState.creators.creators.value
      : null

  const handleCreatorView = (id) => {
    PopupsStateService.updateCreatorPageState(false)
    PopupsStateService.updateCreatorPageState(true, id)
  }

  const currentCreator = creatorsState.creators.currentCreator?.id?.value
  useEffect(() => {
    CreatorService.getBlockedList(currentCreator)
  }, [])
  const blackList = creatorsState?.creators?.blocked.value

  return (
    <section className={styles.creatorContainer}>
      {/*     <h3>Featured Creators</h3> */}
      {creators &&
        blackList &&
        creators.length > 0 &&
        creators
          ?.filter((person) => person.isBlocked < 1)
          .map((item, itemIndex) => (
            <Card
              className={styles.creatorItem}
              elevation={0}
              key={itemIndex}
              onClick={() => {
                history.push(`/creator/${item.id}`)
              }}
            >
              {item.avatar ? (
                <CardMedia className={styles.previewImage} image={item.avatar || <PersonPinIcon />} title={item.name} />
              ) : (
                <section className={styles.previewImage}>
                  <Avatar className={styles.avatarPlaceholder} />
                </section>
              )}
              <CardContent>
                <Typography className={styles.titleContainer}>
                  {item.name}
                  {item.verified === 1 && (
                    <VerifiedUserIcon htmlColor="#007AFF" style={{ fontSize: '13px', margin: '0 0 0 5px' }} />
                  )}
                </Typography>
                <Typography className={styles.usernameContainer}>{item.username}</Typography>
              </CardContent>
            </Card>
          ))}
    </section>
  )
}

export default Creators
