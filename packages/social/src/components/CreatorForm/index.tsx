/**
 * @author Tanya Vykliuk <tanya.vykliuk@gmail.com>
 */
import React, { useEffect, useState } from 'react'
import { useDispatch } from '@xrengine/client-core/src/store'
import { useHistory } from 'react-router-dom'

import { CardMedia, Typography, Button } from '@material-ui/core'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import { useSnackbar, SnackbarOrigin } from 'notistack'

import styles from './CreatorForm.module.scss'
import AccountCircle from '@mui/icons-material/AccountCircle'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import EditIcon from '@mui/icons-material/Edit'
import LinkIcon from '@mui/icons-material/Link'
import CloseSnackbarComponent from '../buttons/CloseSnackbarComponent'
import SubjectIcon from '@mui/icons-material/Subject'
// import TwitterIcon from '@mui/icons-material/Twitter';
// import InstagramIcon from '@mui/icons-material/Instagram';
// import TitleIcon from '@mui/icons-material/Title';

import TextField from '@material-ui/core/TextField'

import { useCreatorState } from '@xrengine/client-core/src/social/services/CreatorService'
import { CreatorService } from '@xrengine/client-core/src/social/services/CreatorService'
import { PopupsStateService } from '@xrengine/client-core/src/social/services/PopupsStateService'
import { useTranslation } from 'react-i18next'

interface Props {
  creatorData?: any
}

const CreatorForm = ({ creatorData }: Props) => {
  const history = useHistory()
  const avatarRef = React.useRef<HTMLInputElement>()
  const dispatch = useDispatch()
  const creatorsState = useCreatorState()
  const [creator, setCreator] = useState(creatorData ? creatorData : creatorsState.creators.currentCreator.value)

  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const callBacksFromUpdateUsername = (str: string) => {
    const anchorOrigin: SnackbarOrigin = { horizontal: 'center', vertical: 'top' }
    switch (str) {
      case 'succes': {
        const succes = enqueueSnackbar('Data saved successfully', {
          variant: 'success',
          anchorOrigin,
          action: [
            <CloseSnackbarComponent
              key="closeSnackbar"
              handleClose={() => {
                closeSnackbar(succes)
              }}
            />
          ]
        })
        break
      }
      case 'reject': {
        const reject = enqueueSnackbar('This name is already taken', {
          variant: 'error',
          anchorOrigin,
          action: [
            <CloseSnackbarComponent
              key="closeSnackbar"
              handleClose={() => {
                closeSnackbar(reject)
              }}
            />
          ]
        })
        break
      }
    }
  }

  const handleUpdateUser = (e: any) => {
    e.preventDefault()
    CreatorService.updateCreator(creator, callBacksFromUpdateUsername)
  }
  const handlePickAvatar = async (file) => setCreator({ ...creator, newAvatar: file.target.files[0] })
  const { t } = useTranslation()

  const icons = {
    UserIcon: '/assets/creator-form/userpic.png',
    EmailIcon: '/assets/creator-form/at.svg',
    EditIcon: '/assets/creator-form/edit.svg',
    MailIcon: '/assets/creator-form/envelope.svg',
    ChainIcon: '/assets/creator-form/url.svg'
  }

  useEffect(
    () => setCreator(creatorsState.creators.currentCreator.value),
    [JSON.stringify(creatorsState.creators.currentCreator.value)]
  )

  return (
    <>
      <section className={styles.creatorContainer}>
        <form className={styles.form} noValidate onSubmit={(e) => handleUpdateUser(e)}>
          <nav className={styles.headerContainer}>
            {!creatorData && (
              <Button
                variant="text"
                className={styles.backButton}
                onClick={() => {
                  history.goBack()
                }}
              >
                <ArrowBackIosIcon />
                {t('social:creatorForm.back')}
              </Button>
            )}
            {!creatorData && (
              <Typography variant="h2" className={styles.pageTitle}>
                {t('social:creatorForm.edit')}
              </Typography>
            )}
            <Button variant="text" type="submit" className={styles.saveButton}>
              {t('social:creatorForm.save')}
            </Button>
          </nav>
          {creator.avatar ? (
            <CardMedia className={styles.avatarImage} image={creator.avatar} title={creator.username} />
          ) : (
            <section className={styles.avatarImage} />
          )}
          <Typography
            className={styles.uploadAvatar}
            onClick={() => {
              ;(avatarRef.current as HTMLInputElement).click()
            }}
          >
            {t('social:creatorForm.changeAvatar')}
          </Typography>
          <input
            className={styles.displayNone}
            type="file"
            ref={avatarRef}
            name="newAvatar"
            onChange={handlePickAvatar}
            placeholder={t('social:creatorForm.ph-selectPreview')}
          />
          <section className={styles.content}>
            <div className={styles.formLine}>
              <img src={icons.UserIcon} className={styles.fieldLabelIcon} />
              <TextField
                className={styles.textFieldContainer}
                onChange={(e) => setCreator({ ...creator, name: e.target.value })}
                fullWidth
                id="name"
                placeholder={t('social:creatorForm.ph-name')}
                value={creator.name}
              />
            </div>
            <div className={styles.formLine}>
              <img src={icons.EmailIcon} className={styles.fieldLabelIcon} />
              <TextField
                className={styles.textFieldContainer}
                onChange={(e) => setCreator({ ...creator, username: e.target.value })}
                fullWidth
                id="username"
                placeholder={t('social:creatorForm.ph-username')}
                value={creator.username}
              />
            </div>
            <div className={styles.formLine}>
              <img src={icons.MailIcon} className={styles.fieldLabelIcon} />
              <TextField
                className={styles.textFieldContainer}
                onChange={(e) => setCreator({ ...creator, email: e.target.value })}
                fullWidth
                id="email"
                placeholder={t('social:creatorForm.ph-email')}
                value={creator.email}
              />
            </div>
            <div className={styles.formLine}>
              <img src={icons.EditIcon} className={styles.fieldLabelIcon} />
              <TextField
                className={styles.textFieldContainer}
                onChange={(e) => setCreator({ ...creator, tags: e.target.value })}
                fullWidth
                id="tags"
                placeholder={t('social:creatorForm.ph-tags')}
                value={creator.tags}
              />
            </div>
            <div className={styles.formLine}>
              <img src={icons.ChainIcon} className={styles.fieldLabelIcon} />
              <TextField
                className={styles.textFieldContainer}
                onChange={(e) => setCreator({ ...creator, link: e.target.value })}
                fullWidth
                id="link"
                placeholder={t('social:creatorForm.ph-link')}
                value={creator.link}
              />
            </div>
            <div className={styles.formLine}>
              <SubjectIcon className={styles.fieldLabelIcon} />
              <TextField
                className={styles.textFieldContainer}
                onChange={(e) => setCreator({ ...creator, bio: e.target.value })}
                fullWidth
                multiline
                id="bio"
                placeholder={t('social:creatorForm.ph-aboutYou')}
                value={creator.bio}
              />
            </div>
            {/*hided for now*/}
            {/* <div className={styles.formLine}>
                     <TwitterIcon className={styles.fieldLabelIcon} />
                     <TextField className={styles.textFieldContainer} onChange={(e)=>setCreator({...creator, twitter: e.target.value})} fullWidth id="twitter" placeholder={t('social:creatorForm.ph-twitter')} value={creator.twitter} />
                 </div> 
                 <div className={styles.formLine}>
                     <InstagramIcon className={styles.fieldLabelIcon} />
                     <TextField className={styles.textFieldContainer} onChange={(e)=>setCreator({...creator, instagram: e.target.value})} fullWidth id="instagram" placeholder={t('social:creatorForm.ph-instagram')} value={creator.instagram} />
                 </div> 
                 <div className={styles.formLine}>
                     <TitleIcon className={styles.fieldLabelIcon} />
                     <TextField className={styles.textFieldContainer} onChange={(e)=>setCreator({...creator, tiktok: e.target.value})} fullWidth id="tiktok" placeholder={t('social:creatorForm.ph-tiktok')} value={creator.tiktok} />
                 </div> 
                 <div className={styles.formLine}>
                     <InstagramIcon className={styles.fieldLabelIcon} />
                     <TextField className={styles.textFieldContainer} onChange={(e)=>setCreator({...creator, instagram: e.target.value})} fullWidth id="instagram" placeholder={t('social:creatorForm.ph-instagram')} value={creator.instagram} />
                 </div>    */}
            <br />
            {!creatorData && (
              <Button className={styles.logOutButton} variant="contained">
                Sign-Out
              </Button>
            )}
          </section>
        </form>
      </section>
    </>
  )
}

export default CreatorForm
