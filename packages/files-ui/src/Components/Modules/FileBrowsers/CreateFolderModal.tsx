import {
  Button,
  FormikTextInput,
  Grid,
  Typography
} from "@chainsafe/common-components"
import {
  createStyles,
  makeStyles,
  useMediaQuery
} from "@chainsafe/common-theme"
import React, { useCallback, useState } from "react"
import { Form, FormikProvider, useFormik } from "formik"
import CustomModal from "../../Elements/CustomModal"
import CustomButton from "../../Elements/CustomButton"
import { t, Trans } from "@lingui/macro"
import { CSFTheme } from "../../../Themes/types"
import { useFileBrowser } from "../../../Contexts/FileBrowserContext"
import { useFilesApi } from "../../../Contexts/FilesApiContext"
import { nameValidator } from "../../../Utils/validationSchema"
import { getPathWithFile } from "../../../Utils/pathUtils"


const useStyles = makeStyles(
  ({ breakpoints, constants, typography, zIndex }: CSFTheme) => {
    return createStyles({
      root: {
        padding: constants.generalUnit * 3,
        flexDirection: "column"
      },
      modalRoot: {
        zIndex: zIndex?.blocker,
        [breakpoints.down("md")]: {
          paddingBottom: Number(constants?.mobileButtonHeight)
        }
      },
      modalInner: {
        backgroundColor: constants.createFolder.backgroundColor,
        color: constants.createFolder.color,
        [breakpoints.down("md")]: {
          maxWidth: `${breakpoints.width("md")}px !important`
        }
      },
      input: {
        marginBottom: constants.generalUnit * 2
      },
      okButton: {
        marginLeft: constants.generalUnit
      },
      label: {
        fontSize: 14,
        lineHeight: "22px"
      },
      heading: {
        color: constants.createFolder.color,
        fontWeight: typography.fontWeight.semibold,
        textAlign: "center",
        marginBottom: constants.generalUnit * 4
      }
    })
  }
)

interface ICreateFolderModalProps {
  modalOpen: boolean
  close: () => void
}

const CreateFolderModal = ({ modalOpen, close }: ICreateFolderModalProps) => {
  const classes = useStyles()
  const { filesApiClient } = useFilesApi()
  const { currentPath, refreshContents, bucket } = useFileBrowser()
  const [creatingFolder, setCreatingFolder] = useState(false)
  const desktop = useMediaQuery("md")

  const formik = useFormik({
    initialValues: {
      name: ""
    },
    validationSchema: nameValidator,
    onSubmit: async (values, helpers) => {
      if (!bucket) return
      helpers.setSubmitting(true)
      try {
        setCreatingFolder(true)
        await filesApiClient.addBucketDirectory(bucket.id, { path: getPathWithFile(currentPath, values.name.trim()) })
        refreshContents && await refreshContents()
        setCreatingFolder(false)
        helpers.resetForm()
        onCancel()
      } catch (error: any) {
        setCreatingFolder(false)
        if (error?.error?.code === 409) {
          helpers.setFieldError("name", t`Folder name is already in use`)
        } else {
          helpers.setFieldError("name", t`There was an error creating the folder ${error?.message}`)
        }
        helpers.setSubmitting(false)
      }
    },
    enableReinitialize: true
  })

  const onCancel = useCallback(() => {
    formik.resetForm()
    close()
  }, [close, formik])

  return (
    <CustomModal
      className={classes.modalRoot}
      injectedClass={{
        inner: classes.modalInner
      }}
      active={modalOpen}
      closePosition="none"
      maxWidth="sm"
    >
      <FormikProvider value={formik}>
        <Form data-cy='form-folder-creation'>
          <div
            className={classes.root}
            data-cy="modal-create-folder"
          >
            {!desktop && (
              <Grid
                item
                xs={12}
                sm={12}
              >
                <Typography
                  className={classes.heading}
                  variant="h5"
                  component="h5"
                >
                  <Trans>New folder</Trans>
                </Typography>
              </Grid>
            )}
            <Grid
              item
              xs={12}
              sm={12}
              className={classes.input}
            >
              <FormikTextInput
                data-cy="input-folder-name"
                name="name"
                size="large"
                placeholder="Name"
                labelClassName={classes.label}
                label="Folder Name"
                autoFocus
              />
            </Grid>
            <Grid
              item
              flexDirection="row"
              justifyContent="flex-end"
            >
              <CustomButton
                data-cy="button-cancel-create-folder"
                onClick={onCancel}
                size="medium"
                variant={desktop ? "outline" : "gray"}
                type="button"
              >
                <Trans>Cancel</Trans>
              </CustomButton>
              <Button
                data-cy="button-create-folder"
                size={desktop ? "medium" : "large"}
                variant="primary"
                type="submit"
                className={classes.okButton}
                loading={creatingFolder}
                disabled={!formik.dirty || !formik.isValid}
              >
                {desktop ? <Trans>OK</Trans> : <Trans>Create</Trans>}
              </Button>
            </Grid>
          </div>
        </Form>
      </FormikProvider>
    </CustomModal>
  )
}

export default CreateFolderModal
