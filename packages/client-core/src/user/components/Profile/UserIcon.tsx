import React, { useState } from 'react'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import Button from '@mui/material/Button'
import styles from './Profile.module.scss'
import TextField from '@mui/material/TextField'
import classNames from 'classnames'
import { AuthService } from '../../services/AuthService'
import { useTranslation } from 'react-i18next'
import { useAuthState } from '../../services/AuthService'

interface Props {
  avatarUrl: string
  auth: any
}

const UserProfile = (props: Props): any => {
  const { auth } = props
  const user = useAuthState().user
  const { t } = useTranslation()
  const [file, setFile] = useState({})
  const [fileUrl, setFileUrl] = useState('')
  const [username, setUsername] = useState(user.name.value)
  const handleChange = (e: any): void => {
    const efile = e.target.files[0]
    const formData = new FormData()
    if (efile != null) {
      formData.append('file', efile, efile.type)
      formData.append('name', efile.name)
      formData.append('type', 'user-thumbnail')

      const file = formData

      setFile(file)
      setFileUrl(efile)
    } else {
      setFile({})
      setFileUrl('')
    }
  }

  const handleSubmit = async (): Promise<void> => {
    await AuthService.uploadAvatar(file)
  }

  const handleUsernameChange = (e: any): void => {
    const name = e.target.value
    setUsername(name)
  }
  const updateUsername = async (): Promise<void> => {
    await AuthService.updateUsername(user.id.value!, username)
  }
  return (
    <div className={styles['user-container']}>
      <div className={styles.username}>
        <TextField
          variant="outlined"
          margin="normal"
          fullWidth
          id="username"
          label={t('user:profile.userIcon.lbl-name')}
          name="name"
          autoFocus
          defaultValue={user.name.value}
          onChange={(e) => handleUsernameChange(e)}
        />
        <Button variant="contained" color="primary" onClick={updateUsername}>
          {t('user:profile.userIcon.lbl-update')}
        </Button>
      </div>
      <div className={styles['user-id']}>
        <div>
          {t('user:profile.userIcon.userId')}: {user.id.value}
        </div>
      </div>
      <div className={styles.uploadform}>
        {fileUrl ? (
          <img
            src={fileUrl}
            className={classNames({
              [styles.rounded]: true,
              [styles['mx-auto']]: true,
              [styles['d-block']]: true,
              [styles['max-size-200']]: true
            })}
          />
        ) : props.avatarUrl ? (
          <img
            src={props.avatarUrl}
            className={classNames({
              [styles.rounded]: true,
              [styles['mx-auto']]: true,
              [styles['d-block']]: true,
              [styles['max-size-200']]: true
            })}
          />
        ) : (
          <AccountCircleIcon style={{ fontSize: 150 }} />
        )}
        <input
          id="fileInput"
          accept="image/*"
          name="file"
          placeholder={t('user:profile.userIcon.ph-uploadImg')}
          type="file"
          className={styles['signup__fileField']}
          onChange={handleChange}
        />

        <label htmlFor="fileInput">
          <Button variant="contained" component="span" color="secondary">
            {t('user:profile.userIcon.lbl-selectAcvatar')}
          </Button>
        </label>
        <Button disabled={fileUrl.length === 0} variant="contained" color="primary" onClick={handleSubmit}>
          {t('user:profile.userIcon.lbl-submit')}
        </Button>
      </div>
    </div>
  )
}

export default UserProfile
