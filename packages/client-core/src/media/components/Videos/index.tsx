import React, { useEffect } from 'react'
import styles from './Videos.module.scss'
import Button from '@mui/material/Button'
import { PublicVideo, useVideoState, VideoService } from '../../services/VideoService'
import { useTranslation } from 'react-i18next'

interface Props {}

export const VideoList = (props: Props): any => {
  const { t } = useTranslation()
  const videos = useVideoState()

  useEffect(() => {
    VideoService.fetchPublicVideos()
  }, [])
  return (
    <div>
      <Button variant="contained" color="primary" className={styles.back} href="/">
        {t('social:video.back')}
      </Button>
      <div className={styles['video-container']}>
        {videos.videos.value.map((video: PublicVideo, i: number) => {
          return (
            <div className={styles.box} key={i}>
              {/* <Link
                href={
                  '/video?manifest=' + video.url + '&title=' + video.name
                }
              >
              </Link> */}
              {video.name}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VideoList
