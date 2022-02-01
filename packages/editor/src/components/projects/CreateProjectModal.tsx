import classNames from 'classnames'
import React, { useState } from 'react'
import styles from '@xrengine/client-core/src/admin/components/Project/Projects.module.scss'
import Button from '@mui/material/Button'
import Fade from '@mui/material/Fade'
import FormControl from '@mui/material/FormControl'
import Modal from '@mui/material/Modal'
import CircularProgress from '@mui/material/CircularProgress'
interface Props {
  open: boolean
  handleClose: any
  createProject: (name: string) => Promise<void>
}

export const CreateProjectModal = (props: Props): any => {
  const { open, handleClose, createProject } = props

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [projectName, setProjectName] = useState('')

  const showError = (err: string) => {
    setError(err)
    setTimeout(() => {
      setError('')
    }, 3000)
  }

  const onCreateProject = async () => {
    try {
      if (projectName !== '') {
        setProcessing(true)
        await createProject(projectName)
        setProcessing(false)
        closeModal()
      }
    } catch (err) {
      setProcessing(false)
      showError(err.message)
    }
  }

  const handleSubmitOnEnter = (event) => {
    if (event.key === 'Enter') {
      onCreateProject()
    }
  }

  const closeModal = () => {
    setProjectName('')
    handleClose()
  }

  return (
    <div>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        className={styles.modal}
        open={open}
        onClose={closeModal}
        closeAfterTransition
      >
        <Fade in={props.open}>
          <div
            className={classNames({
              [styles.paper]: true,
              [styles['modal-content']]: true
            })}
          >
            {processing === false && (
              <div>
                <FormControl>
                  <div>
                    <input
                      name="name"
                      required={true}
                      id="nameSelect"
                      placeholder="Name*"
                      value={projectName}
                      onKeyDown={handleSubmitOnEnter}
                      className={styles['create-project-name']}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="contained" color="primary" onClick={onCreateProject}>
                    Create Project
                  </Button>
                </FormControl>
              </div>
            )}
            {processing === true && (
              <div className={styles.processing}>
                <CircularProgress color="primary" />
                <div className={styles.text}>Processing</div>
              </div>
            )}
            {error && error.length > 0 && <h2 className={styles['error-message']}>{error}</h2>}
          </div>
        </Fade>
      </Modal>
    </div>
  )
}
