import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  Button,
  GithubLogoIcon,
  MailIcon,
  GoogleLogoIcon,
  Loading,
  Typography,
  FormikTextInput,
  EthereumLogoIcon,
  useLocation,
  ExclamationCircleIcon,
  useHistory
} from "@chainsafe/common-components"
import { createStyles, makeStyles, useThemeSwitcher } from "@chainsafe/common-theme"
import { CSFTheme } from "../../../Themes/types"
import { t, Trans } from "@lingui/macro"
import { useFilesApi } from "../../../Contexts/FilesApiContext"
import { useWeb3 } from "@chainsafe/web3-context"
import { useThresholdKey } from "../../../Contexts/ThresholdKeyContext"
import { LOGIN_TYPE } from "@toruslabs/torus-direct-web-sdk"
import { LINK_SHARING_BASE, ROUTE_LINKS } from "../../FilesRoutes"
import clsx from "clsx"
import { IdentityProvider } from "@chainsafe/files-api-client"
import PasswordlessEmail from "./PasswordlessEmail"
import { Form, FormikProvider, useFormik } from "formik"
import { emailValidation } from "../../../Utils/validationSchema"
import { getJWT } from "../../../Utils/pathUtils"
import jwtDecode from "jwt-decode"
import { DecodedNonceJwt } from "../LinkSharingModule"
import dayjs from "dayjs"

const useStyles = makeStyles(
  ({ constants, palette, breakpoints, typography }: CSFTheme) =>
    createStyles({
      root: {
        backgroundColor: constants.loginModule.background,
        border: `1px solid ${constants.landing.border}`,
        boxShadow: constants.landing.boxShadow,
        alignItems: "center",
        borderRadius: 6,
        [breakpoints.up("md")]:{
          minHeight: "64vh",
          width: 440
        },
        [breakpoints.down("md")]: {
          padding: `${constants.generalUnit * 4}px ${constants.generalUnit * 2}px`,
          justifyContent: "center",
          width: `calc(100vw - ${constants.generalUnit * 2}px)`
        }
      },
      buttonSection: {
        display: "flex",
        flexDirection: "column",
        marginBottom: constants.generalUnit * 2,
        alignItems: "center",
        flex: 1
      },
      connectingWallet: {
        textAlign: "center",
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        "& > *": {
          fontWeight: 400
        },
        [breakpoints.up("md")]: {
          padding: `${constants.generalUnit * 20}px ${constants.generalUnit * 8}px`,
          "& > *": {
            paddingBottom: `${constants.generalUnit * 5}px`
          }
        },
        [breakpoints.down("md")]: {
          justifyContent: "space-evenly"
        }
      },
      button: {
        width: 240,
        fontWeight: typography.fontWeight.medium,
        marginBottom: constants.generalUnit * 2,
        "& .icon" : {
          fontSize: 25
        },
        "&:last-child": {
          marginBottom: 0
        }
      },
      error: {
        color: palette.error.main,
        paddingBottom: constants.generalUnit * 2,
        maxWidth: 240
      },
      headerText: {
        textAlign: "center",
        [breakpoints.up("md")]: {
          paddingTop: constants.generalUnit * 4,
          paddingBottom: constants.generalUnit * 8
        },
        [breakpoints.down("md")]: {
          paddingTop: constants.generalUnit * 3,
          paddingBottom: constants.generalUnit * 3
        }
      },
      footer: {
        backgroundColor: constants.landing.footerBg,
        color: constants.landing.footerText,
        padding: `${constants.generalUnit * 2.5}px ${constants.generalUnit * 1.5}px`,
        width: "100%",
        "& > *": {
          marginRight: constants.generalUnit * 3.5
        },
        [breakpoints.down("md")]: {
          display: "none"
        }
      },
      connectWalletFooter: {
        backgroundColor: constants.landing.background,
        color: constants.landing.footerText,
        padding: `${constants.generalUnit * 4.375}px ${constants.generalUnit * 7}px`,
        width: "100%",
        textAlign: "center",
        "& > *": {
          fontWeight: 400
        },
        [breakpoints.down("md")]: {
          display: "none"
        }
      },
      loader: {
        marginTop: constants.generalUnit,
        padding: 0
      },
      buttonLink: {
        color: palette.additional["gray"][10],
        outline: "none",
        textDecoration: "underline",
        cursor: "pointer",
        textAlign: "center"
      },
      web3Button: {
        minHeight: 41
      },
      input: {
        margin: 0,
        width: "100%",
        marginBottom: constants.generalUnit
      },
      inputLabel: {
        fontSize: "16px",
        lineHeight: "24px",
        marginBottom: constants.generalUnit
      },
      secondaryLoginText: {
        paddingTop: constants.generalUnit * 2
      },
      exclamationIcon: {
        fontSize: 48,
        "& svg": {
          marginRight: constants.generalUnit,
          fill: palette.additional["gray"][7]
        }
      },
      maintenanceMessage: {
        display: "block",
        textAlign: "justify",
        width: 240
      },
      maintenanceActiveMessage: {
        color: palette.error.main
      },
      connectWalletRoot: {
        display: "flex",
        flexDirection: "column",
        flex: 1
      }
    })
)

interface IInitialScreen {
  className?: string
}

const InitialScreen = ({ className }: IInitialScreen) => {
  const { selectWallet, resetAndSelectWallet } = useFilesApi()
  const { desktop } = useThemeSwitcher()
  const { wallet } = useWeb3()
  const { login, status, resetStatus } = useThresholdKey()
  const classes = useStyles()
  const [loginMode, setLoginMode] = useState<"web3" | "email" | LOGIN_TYPE | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [errorEmail, setErrorEmail] = useState("")
  const maintenanceMode = process.env.REACT_APP_MAINTENANCE_MODE === "true"
  const maintenanceWindowTimestamp = Number(process.env.REACT_APP_MAINTENANCE_TIMESTAMP)
  const [isConnecting, setIsConnecting] = useState(false)
  const { filesApiClient } = useFilesApi()
  const [email, setEmail] = useState("")
  const { state } = useLocation<{from?: string}>()
  const isSharing = useMemo(() => state?.from?.includes(LINK_SHARING_BASE), [state])
  const [isValidNonce, setIsValidNonce] = useState<boolean | undefined>()
  const { redirect } = useHistory()

  useEffect(() => {
    if (!isSharing) return

    const jwt = getJWT(state?.from)
    let nonce = ""

    try {
      nonce = (jwt && jwtDecode<DecodedNonceJwt>(jwt).nonce_id) || ""
    }catch (e) {
      setError(t`The link you typed in looks malformed. Please verify it.`)
      console.error(e)
    }

    if (!nonce) return

    filesApiClient.isNonceValid(nonce)
      .then((res) => {
        setIsValidNonce(res.is_valid)
      })
      .catch(console.error)
  }, [filesApiClient, isSharing, state])

  const handleSelectWalletAndConnect = async () => {
    setError(undefined)
    try {
      await selectWallet()
    } catch (error) {
      setError(t`There was an error connecting your wallet`)
    }
  }

  const handleResetAndSelectWallet = async () => {
    setError(undefined)
    try {
      await resetAndSelectWallet()
    } catch (error) {
      setError(t`There was an error connecting your wallet`)
    }
  }

  const resetLogin = async () => {
    setError(undefined)
    setErrorEmail("")
    setLoginMode(undefined)
    resetStatus()
    setIsValidNonce(undefined)
  }

  const handleLogin = async (loginType: IdentityProvider) => {
    setError("")
    setIsConnecting(true)
    setLoginMode(loginType)
    try {
      await login(loginType)
    } catch (error: any) {
      let errorMessage = t`There was an error authenticating`

      // Invalid signature, or contract wallet not deployed
      if (error?.error?.code === 403 && error?.error?.message?.includes("Invalid signature")) {
        errorMessage = t`Failed to validate signature.
            If you are using a contract wallet, please make 
            sure you have activated your wallet.`
      }

      // User rejected the signature request (WalletConnect be sassy)
      if (error?.message === "Just nope" || error?.code === 4001) {
        errorMessage = t`Failed to get signature`
      }

      // DirectAuth popup was closed
      if (error?.message === "user closed popup") {
        errorMessage = t`The authentication popup was closed`
      }

      setError(errorMessage)
    }
    setIsConnecting(false)
  }

  const onSubmitEmail = useCallback((values: {email: string}) => {
    setIsConnecting(true)
    setErrorEmail("")
    const trimmedEmail = values.email.trim()

    filesApiClient
      .getIdentityEmailToken({ email: trimmedEmail })
      .then(() => {
        setEmail(trimmedEmail)
        setLoginMode("email")
      })
      .catch((e) => {
        setErrorEmail(t`Something went wrong with email login! Please try again.`)
        console.error(e)
      })
      .finally(() => setIsConnecting(false))
  }, [filesApiClient])

  const formik = useFormik({
    initialValues: {
      email: ""
    },
    validationSchema: emailValidation,
    onSubmit: onSubmitEmail
  })

  const ConnectWallet = () => {
    if (!wallet) {
      console.error("No wallet found")
      return null
    }

    return (
      <div className={classes.connectWalletRoot}>
        <section className={classes.buttonSection}>
          <Button
            data-cy="button-sign-in-with-web3"
            onClick={() => {handleLogin("web3")}}
            className={classes.button}
            variant="primary"
            size="large"
            disabled={maintenanceMode}
          >
            <Trans>Sign-in with {wallet.name}</Trans>
          </Button>
          <Button
            onClick={handleResetAndSelectWallet}
            className={classes.button}
            variant="primary"
            size="large"
            disabled={maintenanceMode}
          >
            <Trans>Connect a new wallet</Trans>
          </Button>
          <div
            className={classes.buttonLink}
            onClick={resetLogin}
          >
            <Typography>
              <Trans>Go back</Trans>
            </Typography>
          </div>
        </section>
        <Footer/>
      </div>
    )}

  const WalletConnection = () => {
    return (
      <section className={classes.connectingWallet}>
        <Typography variant='h2'><Trans>Connect Wallet to Files</Trans></Typography>
        {status === "awaiting confirmation" &&
          <Typography variant='h5'>
            <Trans>You will need to sign a message in your wallet to complete sign in.</Trans>
          </Typography>}
        {status === "logging in" && <>
          <Typography variant='h5'>
            <Trans>Hold on, we are logging you in…</Trans>
          </Typography>
          <Loading
            className={classes.loader}
            size={50}
            type="initial"
          />
        </>}
      </section>
    )
  }

  const WalletSelection = () => {
    return (
      <>
        <section className={classes.buttonSection}>
          <Button
            onClick={handleResetAndSelectWallet}
            className={classes.button}
            variant="primary"
            size="large"
            disabled={maintenanceMode}
          >
            <Trans>Select a wallet</Trans>
          </Button>
          <Button
            onClick={() => setLoginMode(undefined)}
            className={classes.button}
            variant="primary"
            size="large"
            disabled={maintenanceMode}
          >
            <Trans>Use a different login method</Trans>
          </Button>
        </section>
        <Footer/>
      </>
    )
  }

  const Footer = () => (
    <footer className={classes.connectWalletFooter}>
      <Typography variant='h5'>
        <Trans>By connecting your wallet, you agree to our <a
          href={ROUTE_LINKS.Terms}
          target="_blank"
          rel="noopener noreferrer"
        >
            Terms of Service
        </a> and <a
          href={ROUTE_LINKS.PrivacyPolicy}
          target="_blank"
          rel="noopener noreferrer"
        >
            Privacy Policy
        </a></Trans>
      </Typography>
    </footer>
  )

  return (
    <div className={clsx(classes.root, className)}>
      {isValidNonce !== false &&
      loginMode !== "email" &&
      ((desktop && !isConnecting && !error) || (isConnecting && loginMode !== "web3")) && (
        <Typography
          variant="h6"
          component="h1"
          className={classes.headerText}
        >
          {isSharing && status !== "logging in"
            ? <span data-cy="label-sign-in-to-access-share" >
              <Trans>Sign in/up to access the shared folder</Trans>
            </span>
            : <span data-cy="label-get-started" >
              <Trans>Get Started</Trans>
            </span>
          }
        </Typography>
      )}
      {!error && isValidNonce !== false && (
        loginMode !== "web3" && loginMode !== "email"
          ? <>
            <section className={classes.buttonSection}>
              <FormikProvider value={formik}>
                <Form>
                  <FormikTextInput
                    className={classes.input}
                    name="email"
                    label={t`Using an email:`}
                    labelClassName={classes.inputLabel}
                  />
                  {!!errorEmail && (
                    <Typography
                      component="p"
                      variant="body1"
                      className={classes.error}
                    >
                      {error}
                    </Typography>
                  )}
                  <Button
                    className={clsx(classes.button)}
                    variant="primary"
                    fullsize
                    type="submit"
                    disabled={maintenanceMode || isConnecting || status !== "initialized" || !formik.isValid}
                  >
                    <MailIcon className="icon"/>
                    <Trans>Continue with Email</Trans>
                  </Button>
                </Form>
              </FormikProvider>
              <Typography
                variant="body1"
                component="p"
                className={clsx(classes.inputLabel, classes.secondaryLoginText)}
              >
                <Trans>Or using one of the following:</Trans>
              </Typography>
              <Button
                data-cy="button-web3"
                onClick={() => {
                  setLoginMode("web3")
                  handleSelectWalletAndConnect()
                }}
                className={clsx(classes.button, classes.web3Button)}
                variant="secondary"
                size="large"
                disabled={maintenanceMode || isConnecting || status !== "initialized"}
              >
                <EthereumLogoIcon className="icon"/>
                <Trans>Continue with Web3 Wallet</Trans>
              </Button>
              <Button
                className={classes.button}
                size="large"
                onClick={() => handleLogin("github")}
                disabled={maintenanceMode || isConnecting || status !== "initialized"}
                loading={isConnecting && loginMode === "github"}
                variant="secondary"
              >
                <GithubLogoIcon className="icon"/>
                <Trans>Continue with Github</Trans>
              </Button>
              <Button
                className={classes.button}
                size="large"
                onClick={() => handleLogin("google")}
                disabled={maintenanceMode || isConnecting || status !== "initialized"}
                loading={isConnecting && loginMode === "google"}
                variant="secondary"
              >
                <GoogleLogoIcon className="icon"/>
                <Trans>Continue with Google</Trans>
              </Button>
              {maintenanceMode && (
                <Typography className={clsx(classes.maintenanceMessage, classes.maintenanceActiveMessage)}>
                  <Trans>We are performing routine maintenance of the system. Service status updates will be posted on the{" "}
                    <a
                      href={ROUTE_LINKS.DiscordInvite}
                      target="_blank"
                      rel='noreferrer noopener'>Files Support Channel</a>{" "}
                      on Discord
                  </Trans>
                </Typography>
              )}
              {!maintenanceMode && !!maintenanceWindowTimestamp && dayjs.unix(maintenanceWindowTimestamp).isAfter(dayjs()) && (
                <Typography className={classes.maintenanceMessage}>
                  <Trans>
                    System maintenance is scheduled to start at{" "}
                    {dayjs.unix(maintenanceWindowTimestamp).format("YYYY-MM-DD HH:mm")}.{" "}
                    The system will be unavailable.
                  </Trans>
                </Typography>
              )}
            </section>
            <footer className={classes.footer}>
              <a
                href={ROUTE_LINKS.PrivacyPolicy}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Typography>
                  <Trans>Privacy Policy</Trans>
                </Typography>
              </a>
              <a
                href={ROUTE_LINKS.Terms}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Typography>
                  <Trans>Terms and Conditions</Trans>
                </Typography>
              </a>
            </footer>
          </>
          : loginMode === "email"
            ? <PasswordlessEmail
              resetLogin={resetLogin}
              email={email}
            />
            : wallet
              ? !isConnecting
                ? <ConnectWallet />
                : <WalletConnection />
              : <WalletSelection />
      )}
      {!!error && (
        <section className={classes.connectingWallet}>
          <Typography variant='h2'>
            <Trans>Connection failed</Trans>
          </Typography>
          <Typography variant='h5'>
            {error}
          </Typography>
          <Button
            variant="primary"
            onClick={resetLogin}
          >
            <Trans>Try again</Trans>
          </Button>
        </section>
      )}
      {isValidNonce === false && status !== "logging in" && (
        <section className={classes.connectingWallet}>
          <ExclamationCircleIcon
            className={classes.exclamationIcon}
            size={48}
            data-cy="icon-link-error"
          />
          <Typography
            variant='h2'
            data-cy="label-invalid-link"
          >
            <Trans>This link is not valid any more.</Trans>
          </Typography>
          <Button
            variant="primary"
            onClick={() => {
              resetLogin()
              redirect("/")
            }}
            data-cy="button-go-to-login"
          >
            <Trans>Go to login</Trans>
          </Button>
        </section>
      )}
    </div>
  )
}

export default InitialScreen
