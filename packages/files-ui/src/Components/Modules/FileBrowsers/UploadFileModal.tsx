import { Button, FileInput } from "@chainsafe/common-components"
import { useFiles } from "../../../Contexts/FilesContext"
import { createStyles, makeStyles } from "@chainsafe/common-theme"
import React, { useCallback, useState } from "react"
import { Formik, Form } from "formik"
import { array, object } from "yup"
import CustomModal from "../../Elements/CustomModal"
import { Trans, t } from "@lingui/macro"
import clsx from "clsx"
import { CSFTheme } from "../../../Themes/types"
import { useFileBrowser } from "../../../Contexts/FileBrowserContext"
import { getPathWithFile } from "../../../Utils/pathUtils"

const useStyles = makeStyles(({ constants, breakpoints }: CSFTheme) =>
  createStyles({
    root: {
    },
    modalInner: {
      backgroundColor: constants.uploadModal.background,
      color: constants.uploadModal.color,
      [breakpoints.down("md")]: {
        maxWidth: `${breakpoints.width("md")}px !important`
      }
    },
    input: {
      marginBottom: constants.generalUnit * 2
    },
    fileList: {
      color: constants.uploadModal.color
    },
    item: {
      color: constants.uploadModal.color
    },
    cta: {},
    okButton: {
      marginLeft: constants.generalUnit,
      "&.wide": {
        paddingLeft: constants.generalUnit * 4,
        paddingRight: constants.generalUnit * 4
      }
    },
    cancelButton: {},
    label: {
      fontSize: 14,
      lineHeight: "22px"
    },
    addFiles: {
      backgroundColor: constants.uploadModal.addMoreBackground,
      color: constants.uploadModal.addMore,
      "& svg": {
        fill: constants.uploadModal.addMore
      }
    },
    closeIcon: {
      "& svg": {
        fill: constants.uploadModal.icon
      },
      "&:hover svg": {
        fill: constants.uploadModal.iconHover
      },
      "&:hover": {
        backgroundColor: "transparent"
      }
    },
    footer: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      padding: constants.generalUnit * 2,
      backgroundColor: constants.uploadModal.footerBackground
    }
  })
)

interface IUploadFileModuleProps {
  modalOpen: boolean
  close: () => void
}

const UploadFileModule = ({ modalOpen, close }: IUploadFileModuleProps) => {
  const classes = useStyles()
  const [isDoneDisabled, setIsDoneDisabled] = useState(true)
  const { uploadFiles } = useFiles()
  const { currentPath, refreshContents, bucket } = useFileBrowser()

  const UploadSchema = object().shape({ files: array().required(t`Please select a file to upload`) })

  const onFileNumberChange = useCallback((filesNumber: number) => {
    setIsDoneDisabled(filesNumber === 0)
  }, [])

  const onSubmit = useCallback(async (values: {files: Array<File & {path: string}>}, helpers) => {
    if (!bucket) return
    helpers.setSubmitting(true)
    try {
      close()
      const paths = [...new Set(values.files.map(f => f.path.substring(0, f.path.lastIndexOf("/"))))]
      paths.forEach(async p => {
        const filesToUpload = values.files.filter((f => f.path.substring(0, f.path.lastIndexOf("/")) === p))
        await uploadFiles(bucket, filesToUpload, getPathWithFile(currentPath, p))
      })
      refreshContents && refreshContents()
      helpers.resetForm()
    } catch (error: any) {
      console.error(error)
    }
    helpers.setSubmitting(false)
  }, [close, currentPath, uploadFiles, refreshContents, bucket])

  return (
    <CustomModal
      active={modalOpen}
      closePosition="none"
      maxWidth="sm"
      injectedClass={{
        inner: classes.modalInner
      }}
    >
      <Formik
        initialValues={{ files: [] }}
        validationSchema={UploadSchema}
        onSubmit={onSubmit}
      >
        <Form
          data-cy="form-upload-file"
          className={classes.root}
        >
          <FileInput
            multiple={true}
            className={classes.input}
            classNames={{
              closeIcon: classes.closeIcon,
              filelist: classes.fileList,
              item: classes.item,
              addFiles: classes.addFiles
            }}
            label={t`Click or drag to upload files`}
            moreFilesLabel={t`Add more files`}
            maxSize={2 * 1024 ** 3}
            name="files"
            onFileNumberChange={onFileNumberChange}
            testId="fileUpload"
          />
          <footer className={classes.footer}>
            <Button
              testId="cancel-upload"
              onClick={close}
              size="medium"
              className={classes.cancelButton}
              variant="outline"
              type="reset"
            >
              <Trans>Cancel</Trans>
            </Button>
            <Button
              testId="start-upload"
              size="medium"
              type="submit"
              variant="primary"
              className={clsx(classes.okButton, "wide")}
              disabled={isDoneDisabled}
            >
              <Trans>Start Upload</Trans>
            </Button>
          </footer>
        </Form>
      </Formik>
    </CustomModal>
  )
}

export default UploadFileModule
