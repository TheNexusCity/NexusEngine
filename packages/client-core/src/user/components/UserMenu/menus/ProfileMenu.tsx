import { Check, Close, Create, GitHub, Send } from '@mui/icons-material'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import InventoryIcon from '@mui/icons-material/Inventory'
import StoreIcon from '@mui/icons-material/Store'
import StorefrontIcon from '@mui/icons-material/Storefront'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import RefreshIcon from '@mui/icons-material/Refresh'
import { validateEmail, validatePhoneNumber } from '@xrengine/common/src/config'
import * as polyfill from 'credential-handler-polyfill'
import React, { useEffect, useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { AuthSettingService, useAdminAuthSettingState } from '../../../../admin/services/Setting/AuthSettingService'
import { DiscordIcon } from '../../../../common/components/Icons/DiscordIcon'
import { FacebookIcon } from '../../../../common/components/Icons/FacebookIcon'
import { GoogleIcon } from '../../../../common/components/Icons/GoogleIcon'
import { LinkedInIcon } from '../../../../common/components/Icons/LinkedInIcon'
import { TwitterIcon } from '../../../../common/components/Icons/TwitterIcon'
import { AuthService, useAuthState } from '../../../services/AuthService'
import styles from '../UserMenu.module.scss'
import { getAvatarURLForUser, Views } from '../util'

interface Props {
  changeActiveMenu?: any
  setProfileMenuOpen?: any

  hideLogin?: any
}

const initialState = {
  jwt: true,
  local: false,
  discord: false,
  facebook: false,
  github: false,
  google: false,
  linkedin: false,
  twitter: false,
  smsMagicLink: false,
  emailMagicLink: false
}

const ProfileMenu = (props: Props): any => {
  const { changeActiveMenu, setProfileMenuOpen, hideLogin } = props
  const { t } = useTranslation()
  const location: any = useLocation()

  const selfUser = useAuthState().user

  const [username, setUsername] = useState(selfUser?.name.value)
  const [emailPhone, setEmailPhone] = useState('')
  const [error, setError] = useState(false)
  const [errorUsername, setErrorUsername] = useState(false)
  const [showUserId, setShowUserId] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [userIdState, setUserIdState] = useState({ value: '', copied: false, open: false })
  const [apiKeyState, setApiKeyState] = useState({ value: '', copied: false, open: false })
  const authSettingState = useAdminAuthSettingState()
  const [authSetting] = authSettingState?.authSettings?.value || []
  const [authState, setAuthState] = useState(initialState)

  useEffect(() => {
    !authSetting && AuthSettingService.fetchAuthSetting()
  }, [])

  useEffect(() => {
    if (authSetting) {
      let temp = { ...initialState }
      authSetting?.authStrategies?.forEach((el) => {
        Object.entries(el).forEach(([strategyName, strategy]) => {
          temp[strategyName] = strategy
        })
      })
      setAuthState(temp)
    }
  }, [authSettingState?.updateNeeded?.value])

  let type = ''

  const loadCredentialHandler = async () => {
    try {
      const mediator = `${globalThis.process.env['VITE_MEDIATOR_SERVER']}/mediator?origin=${encodeURIComponent(
        window.location.origin
      )}`

      await polyfill.loadOnce(mediator)
      console.log('Ready to work with credentials!')
    } catch (e) {
      console.error('Error loading polyfill:', e)
    }
  }

  useEffect(() => {
    loadCredentialHandler()
  }, []) // Only run once

  useEffect(() => {
    selfUser && setUsername(selfUser.name.value)
  }, [selfUser.name.value])

  const updateUserName = (e) => {
    e.preventDefault()
    handleUpdateUsername()
  }

  const handleUsernameChange = (e) => {
    setUsername(e.target.value)
    if (!e.target.value) setErrorUsername(true)
  }

  const handleUpdateUsername = () => {
    const name = username.trim()
    if (!name) return
    if (selfUser.name.value.trim() !== name) {
      // @ts-ignore
      AuthService.updateUsername(selfUser.id.value, name)
    }
  }
  const handleInputChange = (e) => setEmailPhone(e.target.value)

  const validate = () => {
    if (emailPhone === '') return false
    if (validateEmail(emailPhone.trim()) && authState?.emailMagicLink) type = 'email'
    else if (validatePhoneNumber(emailPhone.trim()) && authState.smsMagicLink) type = 'sms'
    else {
      setError(true)
      return false
    }

    setError(false)
    return true
  }

  const handleSubmit = (e: any): any => {
    e.preventDefault()
    if (!validate()) return
    if (type === 'email') AuthService.addConnectionByEmail(emailPhone, selfUser?.id?.value!)
    else if (type === 'sms') AuthService.addConnectionBySms(emailPhone, selfUser?.id?.value!)
    return
  }

  const handleOAuthServiceClick = (e) => {
    AuthService.loginUserByOAuth(e.currentTarget.id, location)
  }

  const handleLogout = async (e) => {
    if (changeActiveMenu != null) changeActiveMenu(null)
    else if (setProfileMenuOpen != null) setProfileMenuOpen(false)
    setShowUserId(false)
    setShowApiKey(false)
    setUserIdState({ ...userIdState, open: false })
    setApiKeyState({ ...apiKeyState, open: false })
    await AuthService.logoutUser()
    // window.location.reload()
  }

  const handleWalletLoginClick = async (e) => {
    const domain = window.location.origin
    const challenge = '99612b24-63d9-11ea-b99f-4f66f3e4f81a' // TODO: generate

    console.log('Sending DIDAuth query...')

    const didAuthQuery: any = {
      web: {
        VerifiablePresentation: {
          query: [
            {
              type: 'DIDAuth'
            }
          ],
          challenge,
          domain // e.g.: requestingparty.example.com
        }
      }
    }

    // Use Credential Handler API to authenticate
    const result: any = await navigator.credentials.get(didAuthQuery)
    console.log(result)

    AuthService.loginUserByXRWallet(result)
  }

  const handleShowId = () => {
    setShowUserId(!showUserId)
    setUserIdState({ ...userIdState, value: selfUser.id.value as string })
  }

  const handleShowApiKey = () => {
    setShowApiKey(!showApiKey)
    setApiKeyState({ ...apiKeyState, value: selfUser.apiKey?.token?.value })
  }

  const handleCloseUserId = () => {
    setUserIdState({ ...userIdState, open: false })
  }

  const handleCloseApiKey = () => {
    setApiKeyState({ ...apiKeyState, open: false })
  }

  const refreshApiKey = () => {
    AuthService.updateApiKey()
  }

  const getConnectText = () => {
    if (authState?.emailMagicLink && authState?.smsMagicLink) {
      return t('user:usermenu.profile.connectPhoneEmail')
    } else if (authState?.emailMagicLink && !authState?.smsMagicLink) {
      return t('user:usermenu.profile.connectEmail')
    } else if (!authState?.emailMagicLink && authState?.smsMagicLink) {
      return t('user:usermenu.profile.connectPhone')
    } else {
      return ''
    }
  }

  const getErrorText = () => {
    if (authState?.emailMagicLink && authState?.smsMagicLink) {
      return t('user:usermenu.profile.phoneEmailError')
    } else if (authState?.emailMagicLink && !authState?.smsMagicLink) {
      return t('user:usermenu.profile.emailError')
    } else if (!authState?.emailMagicLink && authState?.smsMagicLink) {
      return t('user:usermenu.profile.phoneError')
    } else {
      return ''
    }
  }

  const getConnectPlaceholder = () => {
    if (authState?.emailMagicLink && authState?.smsMagicLink) {
      return t('user:usermenu.profile.ph-phoneEmail')
    } else if (authState?.emailMagicLink && !authState?.smsMagicLink) {
      return t('user:usermenu.profile.ph-email')
    } else if (!authState?.emailMagicLink && authState?.smsMagicLink) {
      return t('user:usermenu.profile.ph-phone')
    } else {
      return ''
    }
  }

  const goToEthNFT = () => {
    let token = JSON.stringify(localStorage.getItem('TheOverlay-Auth-Store'))
    if (selfUser.id.value && token)
      window.open(
        `${globalThis.process.env['VITE_ETH_MARKETPLACE']}?data=${selfUser.id.value}&token=${token}`,
        '_blank'
      )
  }
  const goToIcpNFT = () => {
    let token = localStorage.getItem('xrengine-client-store-key-v1')
    let accessToken = JSON.parse(token).authData.authUser.accessToken
    console.log(JSON.parse(token).authData.authUser.accessToken, 'token')
    if (selfUser.id.value && accessToken)
      window.open(`http://127.0.0.1:4000?userId=${selfUser.id.value}&token=${accessToken}`, '_blank')
    /*  
    window.open(
        `${globalThis.process.env['VITE_ETH_MARKETPLACE']}?data=${selfUser.id.value}&token=${token}`,
        '_blank'
      )
    */
  }

  const enableSocial =
    authState?.discord ||
    authState?.facebook ||
    authState?.github ||
    authState?.google ||
    authState?.linkedin ||
    authState?.twitter

  const enableConnect = authState?.emailMagicLink || authState?.smsMagicLink

  return (
    <div className={styles.menuPanel}>
      <section className={styles.profilePanel}>
        <section className={styles.profileBlock}>
          <div className={styles.avatarBlock}>
            <img src={getAvatarURLForUser(selfUser?.id?.value)} />
            {changeActiveMenu != null && (
              <Button
                className={styles.avatarBtn}
                id="select-avatar"
                onClick={() => changeActiveMenu(Views.Avatar)}
                disableRipple
              >
                <Create />
              </Button>
            )}
          </div>
          <div className={styles.headerBlock}>
            <Typography variant="h1" className={styles.panelHeader}>
              {t('user:usermenu.profile.lbl-username')}
            </Typography>
            <span className={styles.inputBlock}>
              <TextField
                margin="none"
                size="small"
                name="username"
                variant="outlined"
                value={username || ''}
                onChange={handleUsernameChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') updateUserName(e)
                }}
                className={styles.usernameInput}
                error={errorUsername}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <a href="#" className={styles.materialIconBlock} onClick={updateUserName}>
                        <Check className={styles.primaryForeground} />
                      </a>
                    </InputAdornment>
                  )
                }}
              />
            </span>

            <Grid container justifyContent="right">
              <Grid item xs={selfUser.userRole?.value === 'guest' ? 6 : 4}>
                <h2>
                  {selfUser?.userRole?.value === 'admin'
                    ? t('user:usermenu.profile.youAreAn')
                    : t('user:usermenu.profile.youAreA')}{' '}
                  <span>{selfUser?.userRole?.value}</span>.
                </h2>
              </Grid>
              <Grid
                item
                container
                xs={selfUser.userRole?.value === 'guest' ? 6 : 4}
                alignItems="flex-start"
                direction="column"
              >
                <Tooltip title="Show User ID" placement="right">
                  <h2 className={styles.showUserId} onClick={handleShowId}>
                    {showUserId ? t('user:usermenu.profile.hideUserId') : t('user:usermenu.profile.showUserId')}{' '}
                  </h2>
                </Tooltip>
              </Grid>
              {selfUser?.apiKey?.id && (
                <Grid item container xs={4} alignItems="flex-start" direction="column">
                  <Tooltip title="Show API key" placement="right">
                    <h2 className={styles.showUserId} onClick={handleShowApiKey}>
                      {showApiKey ? t('user:usermenu.profile.hideApiKey') : t('user:usermenu.profile.showApiKey')}{' '}
                    </h2>
                  </Tooltip>
                </Grid>
              )}
            </Grid>
            {selfUser?.userRole.value !== 'guest' && (
              <Grid
                display="grid"
                gridTemplateColumns="1fr 1.5fr"
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.5fr',

                  '@media(max-width: 600px)': {
                    gridTemplateColumns: '1fr'
                  },

                  button: {
                    margin: '0px',
                    width: '100%',
                    height: '100%',
                    color: 'white',
                    display: 'grid',
                    fontSize: '14px',
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    gridTemplateColumns: 'max-content auto',

                    svg: {
                      marginRight: '10px'
                    }
                  }
                }}
              >
                <Button size="small" onClick={() => changeActiveMenu(Views.Inventory)}>
                  <InventoryIcon />
                  <Typography component="div" variant="button">
                    My Inventory
                  </Typography>
                </Button>
                <Button size="small" onClick={() => changeActiveMenu(Views.Trading)}>
                  <StoreIcon />
                  <Typography component="div" variant="button">
                    My Trading
                  </Typography>
                </Button>
                <Button size="small" onClick={() => changeActiveMenu(Views.Wallet)}>
                  <AccountBalanceWalletIcon />
                  <Typography component="div" variant="button">
                    My Wallet
                  </Typography>
                </Button>
                <Button size="small" onClick={() => goToEthNFT()}>
                  <StorefrontIcon />
                  <Typography component="div" variant="button">
                    Open ETH NFT Marketplace
                  </Typography>
                </Button>
                <Button size="small" onClick={() => goToIcpNFT()}>
                  <StorefrontIcon />
                  <Typography component="div" variant="button">
                    Open ICP NFT Marketplace
                  </Typography>
                </Button>
              </Grid>
            )}
            <h4>
              {selfUser.userRole.value !== 'guest' && (
                <div className={styles.logout} onClick={handleLogout}>
                  {t('user:usermenu.profile.logout')}
                </div>
              )}
            </h4>
            {selfUser?.inviteCode.value != null && (
              <h2>
                {t('user:usermenu.profile.inviteCode')}: {selfUser.inviteCode.value}
              </h2>
            )}
          </div>
        </section>

        {showUserId && (
          <section className={styles.emailPhoneSection}>
            <Typography variant="h1" className={styles.panelHeader}>
              User id
            </Typography>

            <form>
              <TextField
                id="user-id"
                className={styles.emailField}
                size="small"
                placeholder={'user id'}
                variant="outlined"
                value={selfUser?.id.value}
                onChange={({ target: { value } }) => setUserIdState({ ...userIdState, value, copied: false })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CopyToClipboard
                        text={userIdState.value}
                        onCopy={() => {
                          setUserIdState({ ...userIdState, copied: true, open: true })
                        }}
                      >
                        <a href="#" className={styles.materialIconBlock}>
                          <ContentCopyIcon className={styles.primaryForeground} />
                        </a>
                      </CopyToClipboard>
                    </InputAdornment>
                  )
                }}
              />
            </form>
          </section>
        )}

        {showApiKey && (
          <section className={styles.emailPhoneSection}>
            <Typography variant="h1" className={styles.panelHeader}>
              API key
            </Typography>

            <form>
              <TextField
                className={styles.emailField}
                size="small"
                placeholder={'API key'}
                variant="outlined"
                value={selfUser?.apiKey?.token?.value}
                onChange={({ target: { value } }) => setApiKeyState({ ...apiKeyState, value, copied: false })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <RefreshIcon className={styles.apiRefresh} onClick={refreshApiKey} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <CopyToClipboard
                        text={apiKeyState.value}
                        onCopy={() => {
                          setApiKeyState({ ...apiKeyState, copied: true, open: true })
                        }}
                      >
                        <a href="#" className={styles.materialIconBlock}>
                          <ContentCopyIcon className={styles.primaryForeground} />
                        </a>
                      </CopyToClipboard>
                    </InputAdornment>
                  )
                }}
              />
            </form>
          </section>
        )}

        {!hideLogin && (
          <>
            {selfUser?.userRole.value === 'guest' && enableConnect && (
              <section className={styles.emailPhoneSection}>
                <Typography variant="h1" className={styles.panelHeader}>
                  {getConnectText()}
                </Typography>

                <form onSubmit={handleSubmit}>
                  <TextField
                    className={styles.emailField}
                    size="small"
                    placeholder={getConnectPlaceholder()}
                    variant="outlined"
                    onChange={handleInputChange}
                    onBlur={validate}
                    error={error}
                    helperText={error ? getErrorText() : null}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end" onClick={handleSubmit}>
                          <a href="#" className={styles.materialIconBlock}>
                            <Send className={styles.primaryForeground} />
                          </a>
                        </InputAdornment>
                      )
                    }}
                  />
                </form>
              </section>
            )}
            {selfUser?.userRole.value === 'guest' && changeActiveMenu != null && (
              <section className={styles.walletSection}>
                <Typography variant="h3" className={styles.textBlock}>
                  {t('user:usermenu.profile.or')}
                </Typography>
                {/*<Button onClick={handleWalletLoginClick} className={styles.walletBtn}>
                  {t('user:usermenu.profile.lbl-wallet')}
                </Button>
                <br/>*/}
                <Button onClick={() => changeActiveMenu(Views.ReadyPlayer)} className={styles.walletBtn}>
                  {t('user:usermenu.profile.loginWithReadyPlayerMe')}
                </Button>
              </section>
            )}

            {selfUser?.userRole.value === 'guest' && enableSocial && (
              <section className={styles.socialBlock}>
                <Typography variant="h3" className={styles.textBlock}>
                  {t('user:usermenu.profile.connectSocial')}
                </Typography>
                <div className={styles.socialContainer}>
                  {authState?.discord && (
                    <a href="#" id="discord" onClick={handleOAuthServiceClick}>
                      <DiscordIcon width="40" height="40" viewBox="0 0 40 40" />
                    </a>
                  )}
                  {authState?.google && (
                    <a href="#" id="google" onClick={handleOAuthServiceClick}>
                      <GoogleIcon width="40" height="40" viewBox="0 0 40 40" />
                    </a>
                  )}
                  {authState?.facebook && (
                    <a href="#" id="facebook" onClick={handleOAuthServiceClick}>
                      <FacebookIcon width="40" height="40" viewBox="0 0 40 40" />
                    </a>
                  )}
                  {authState?.linkedin && (
                    <a href="#" id="linkedin2" onClick={handleOAuthServiceClick}>
                      <LinkedInIcon width="40" height="40" viewBox="0 0 40 40" />
                    </a>
                  )}
                  {authState?.twitter && (
                    <a href="#" id="twitter" onClick={handleOAuthServiceClick}>
                      <TwitterIcon width="40" height="40" viewBox="0 0 40 40" />
                    </a>
                  )}
                  {authState?.github && (
                    <a href="#" id="github" onClick={handleOAuthServiceClick}>
                      <GitHub />
                    </a>
                  )}
                </div>
                <Typography variant="h4" className={styles.smallTextBlock}>
                  {t('user:usermenu.profile.createOne')}
                </Typography>
              </section>
            )}
            {setProfileMenuOpen != null && (
              <div className={styles.closeButton} onClick={() => setProfileMenuOpen(false)}>
                <Close />
              </div>
            )}
          </>
        )}
      </section>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={userIdState.open}
        onClose={handleCloseUserId}
        message="User ID copied"
        key={'top' + 'center'}
        autoHideDuration={2000}
      />

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={apiKeyState.open}
        onClose={handleCloseApiKey}
        message="API Key copied"
        key={'bottom' + 'center'}
        autoHideDuration={2000}
      />
    </div>
  )
}

export default ProfileMenu
