import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { makeStyles, createStyles, debounce } from "@chainsafe/common-theme"
import { CSFTheme } from "../../../../../Themes/types"
import { ProductPrice, InvoiceResponse } from "@chainsafe/files-api-client"
import {
  BitcoinIcon,
  Button,
  CircularProgressBar,
  CopyIcon,
  DaiIcon,
  Divider,
  EthereumIcon,
  InfoCircleIcon,
  Loading,
  Typography,
  UsdcIcon
} from "@chainsafe/common-components"
import { t, Trans } from "@lingui/macro"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import { useBilling } from "../../../../../Contexts/BillingContext"
import { useFilesApi } from "../../../../../Contexts/FilesApiContext"
import QRCode from "react-qr-code"
import { useWeb3 } from "@chainsafe/web3-context"
import { utils } from "ethers"
import clsx from "clsx"

dayjs.extend(duration)

const useStyles = makeStyles(({ constants, palette, zIndex, animation, breakpoints }: CSFTheme) =>
  createStyles({
    root: {
      margin: `${constants.generalUnit * 2}px ${constants.generalUnit * 2}px`
    },
    heading: {
      marginTop: constants.generalUnit * 3,
      marginBottom: constants.generalUnit * 2
    },
    subheading: {
      marginBottom: constants.generalUnit * 3
    },
    boldText: {
      fontWeight: "bold"
    },
    normalWeightText: {
      fontWeight: "normal"
    },
    rowBox: {
      display: "flex",
      alignItems: "center",
      padding: `${constants.generalUnit * 0.5}px 0px`
    },
    middleRowBox: {
      display: "flex",
      alignItems: "center",
      padding: `${constants.generalUnit * 0.5}px 0px`
    },
    pushRightBox: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      flex: 1
    },
    buttons: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      "& > *": {
        marginLeft: constants.generalUnit
      }
    },
    bottomSection: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      margin: `${constants.generalUnit * 3}px 0px`
    },
    divider: {
      margin: `${constants.generalUnit}px 0`
    },
    textButton: {
      color: palette.primary.background,
      cursor: "pointer",
      textDecoration: "underline"
    },
    creditCardIcon: {
      marginRight: constants.generalUnit,
      fill: palette.additional["gray"][9]
    },
    featuresBox: {
      marginTop: constants.generalUnit,
      marginBottom: constants.generalUnit * 2
    },
    creditCardRow: {
      display: "flex",
      alignItems: "center",
      marginTop: constants.generalUnit,
      marginBottom: constants.generalUnit
    },
    featureSeparator: {
      marginBottom: constants.generalUnit
    },
    error: {
      marginTop: constants.generalUnit,
      color: palette.error.main
    },
    qrCode: {
      display: "flex",
      justifyContent: "center"
    },
    qrCodeLabel: {
      display: "flex",
      justifyContent: "center",
      textAlign: "center",
      color: "#AFAFAF"
    },
    availableCurrencies: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between"
    },
    currencyButton: {
      width: "calc(50% - 8px)",
      backgroundColor: "var(--gray4)",
      color: "var(--gray10)",
      borderRadius: 10,
      marginTop: 4,
      marginBottom: 4,
      "&:hover": {
        backgroundColor: "var(--gray4)",
        color: "var(--gray10)"
      }
    },
    currencyIcon: {
      "& > svg": {
        fill: "var(--gray10)",
        height: 16
      }
    },
    copiedFlag: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      left: "50%",
      bottom: "calc(100% + 8px)",
      position: "absolute",
      transform: "translate(-50%, 0%)",
      zIndex: zIndex?.layer1,
      transitionDuration: `${animation.transform}ms`,
      opacity: 0,
      visibility: "hidden",
      backgroundColor: palette.additional["gray"][9],
      color: palette.additional["gray"][1],
      padding: `${constants.generalUnit / 2}px ${constants.generalUnit}px`,
      borderRadius: 2,
      "&:after": {
        transitionDuration: `${animation.transform}ms`,
        content: "''",
        position: "absolute",
        top: "100%",
        left: "50%",
        transform: "translate(-50%,0)",
        width: 0,
        height: 0,
        borderLeft: "5px solid transparent",
        borderRight: "5px solid transparent",
        borderTop: `5px solid ${palette.additional["gray"][9]}`
      },
      "&.active": {
        opacity: 1,
        visibility: "visible"
      }
    },
    copyIcon: {
      fontSize: "16px",
      fill: palette.additional["gray"][9],
      [breakpoints.down("md")]: {
        fontSize: "18px",
        fill: palette.additional["gray"][9]
      }
    },
    copyRow: {
      position: "relative",
      cursor: "pointer",
      borderRadius: 10,
      backgroundColor: "var(--gray4)",
      padding: "5px 10px",
      "& > span": {
        width: "100%",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis"
      }
    },
    loadingContainer: {
      margin: `${constants.generalUnit * 4}px 0`,
      display: "flex",
      justifyContent: "center"
    },
    warningText: {
      marginTop: constants.generalUnit * 3,
      maxWidth: constants.generalUnit * 56,
      color: palette.additional["gray"][7]
    },
    icon : {
      verticalAlign: "middle",
      "& > svg": {
        fill: palette.additional["gray"][7],
        height: constants.generalUnit * 2.25
      }
    }
  })
)

interface ICryptoPayment {
  planPrice?: ProductPrice
}

const iconMap: { [key: string]: React.FC<any> } = {
  ethereum: EthereumIcon,
  bitcoin: BitcoinIcon,
  dai: DaiIcon,
  usdc: UsdcIcon
}

const symbolMap: { [key: string]: string } = {
  ethereum: "ETH",
  bitcoin: "BTC",
  dai: "DAI",
  usdc: "USDC"
}

const CryptoPayment = ({ planPrice }: ICryptoPayment) => {
  const classes = useStyles()
  const { selectWallet } = useFilesApi()
  const { isReady, network, provider, wallet, tokens, switchNetwork, checkIsReady, ethBalance } = useWeb3()
  const { filesApiClient } = useFilesApi()
  const { currentSubscription, fetchCurrentSubscription, isPendingInvoice, invoices } = useBilling()
  const [cryptoPayment, setCryptoPayment] = useState<InvoiceResponse["crypto"] | undefined>()
  const [error, setError] = useState<string | undefined>(undefined)
  const [cryptoChargeLoading, setCryptoChargeLoading] = useState(false)
  const [transferActive, setTransferActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<duration.Duration | undefined>()
  const pageLoadTimestamp = useRef(dayjs().unix())
  const [copiedDestinationAddress, setCopiedDestinationAddress] = useState(false)
  const [copiedAmount, setCopiedAmount] = useState(false)
  const debouncedSwitchCopiedDestinationAddress = debounce(() => setCopiedDestinationAddress(false), 3000)
  const debouncedSwitchCopiedAmount = debounce(() => setCopiedAmount(false), 3000)
  const pendingCryptoInvoice = useMemo(() =>
    invoices?.find((i) => i.payment_method === "crypto" && i.status === "open")
  , [invoices])
  const currencies = useMemo(() => cryptoPayment?.payment_methods.map(c => c.currency), [cryptoPayment])
  const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!currentSubscription || !planPrice || isPendingInvoice) return

    setCryptoChargeLoading(true)

    filesApiClient.updateSubscription(currentSubscription.id, {
      price_id: planPrice.id,
      payment_method: "crypto"
    }).then(() => {
      fetchCurrentSubscription()
    }).catch((error) => {
      console.error(error)
      setError(t`There was a problem creating a charge ${error}`)
    }).finally(() => setCryptoChargeLoading(false))
  }, [currentSubscription, fetchCurrentSubscription, filesApiClient, isPendingInvoice, planPrice])

  useEffect(() => {
    if (!pendingCryptoInvoice) return

    pendingCryptoInvoice?.uuid && filesApiClient.payInvoice(pendingCryptoInvoice.uuid)
      .then(r => {
        setCryptoPayment(r.crypto)
        pageLoadTimestamp.current = dayjs().unix()
      })
      .catch(console.error)
  }, [filesApiClient, pendingCryptoInvoice])

  useEffect(() => {
    const timer = setInterval(() => {
      if (cryptoPayment) {
        setTimeRemaining(dayjs.duration(cryptoPayment.expires_at - dayjs().unix(), "s"))
      }
    }, 1000)

    return () => {
      timer && clearInterval(timer)
    }
  }, [cryptoPayment])

  const selectedPaymentMethod = useMemo(() =>
    cryptoPayment && selectedCurrency && cryptoPayment.payment_methods.find(p => p.currency === selectedCurrency)
  , [cryptoPayment, selectedCurrency])

  const onCopyDestinationAddress = useCallback(() => {
    if (!selectedPaymentMethod) return

    navigator.clipboard.writeText(selectedPaymentMethod.address)
      .then(() => {
        setCopiedDestinationAddress(true)
        debouncedSwitchCopiedDestinationAddress()
      }).catch(console.error)
  }, [debouncedSwitchCopiedDestinationAddress, selectedPaymentMethod])

  const onCopyAmount = useCallback(() => {
    if (!selectedPaymentMethod) return

    navigator.clipboard.writeText(selectedPaymentMethod.amount)
      .then(() => {
        setCopiedAmount(true)
        debouncedSwitchCopiedAmount()
      }).catch(console.error)
  }, [debouncedSwitchCopiedAmount, selectedPaymentMethod])

  const isBalanceSufficient = useMemo(() => {
    if (selectedCurrency === "bitcoin") {
      return false
    } else if (selectedCurrency === "ethereum") {
      return ethBalance && selectedPaymentMethod && ethBalance > Number(selectedPaymentMethod.amount)
    } else {
      const token = Object.values(tokens).find(t => t.symbol?.toLowerCase() === selectedCurrency)
      return token && selectedPaymentMethod && token.balance >= Number(selectedPaymentMethod.amount)
    }
  }, [selectedCurrency, ethBalance, selectedPaymentMethod, tokens])

  const handlePayment = useCallback(async () => {
    if (!provider || !selectedCurrency || !selectedPaymentMethod) return

    const signer = provider.getSigner()
    try {
      setTransferActive(true)
      if (selectedCurrency === "ethereum") {
        await (await signer.sendTransaction({
          to: selectedPaymentMethod.address,
          value: utils.parseEther(selectedPaymentMethod.amount)
        })).wait(1)
      } else {
        const token = Object.values(tokens).find(t => t.symbol?.toLowerCase() === selectedCurrency)
        if (!token || !token.transfer) return
        await (await token.transfer(
          selectedPaymentMethod.address,
          utils.parseUnits(selectedPaymentMethod.amount, token.decimals)
        )).wait(1)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setTransferActive(false)
    }
  }, [provider, selectedCurrency, selectedPaymentMethod, tokens])

  const handleSwitchNetwork = useCallback(async () => {
    await switchNetwork(1)
    await checkIsReady()
  }, [checkIsReady, switchNetwork])

  return (
    <article className={classes.root}>
      <div className={classes.rowBox}>
        <Typography
          variant="h5"
          component="h4"
          className={classes.heading}
        >
          <Trans>Pay with crypto</Trans>
        </Typography>
        {cryptoPayment && <div className={classes.pushRightBox}>
          <CircularProgressBar
            progress={(timeRemaining?.as("s") || 0) / 3600 * 100}
            width={23}
            label={timeRemaining?.format("mm:ss") || ""}
            variant="secondary"
          />
        </div>}
      </div>
      {(cryptoChargeLoading || !cryptoPayment) && <div className={classes.loadingContainer}>
        <Loading type='initial' />
      </div>}
      {error &&
        <Typography
          component="p"
          variant="body1"
          className={classes.error}
        >
          <Trans>Failed to create a charge</Trans>
        </Typography>
      }
      {cryptoPayment && pendingCryptoInvoice &&
        <>
          <div className={classes.rowBox}>
            <Typography>Total</Typography>
            <div className={classes.pushRightBox}>
              <Typography>
                {pendingCryptoInvoice.currency?.toUpperCase()} {pendingCryptoInvoice.amount}
              </Typography>
            </div>
          </div>
          <Divider />
          {!selectedCurrency && currencies &&
            <>
              <Typography>Select a cryptocurrency</Typography>
              <div className={classes.availableCurrencies}>
                {currencies.map(c => {
                  const CurrencyIcon = iconMap[c] || null
                  return <Button
                    key={c}
                    onClick={() => setSelectedCurrency(c)}
                    className={classes.currencyButton}
                  >
                    <CurrencyIcon className={classes.currencyIcon} />
                    {c.replace(/(^|\s)\S/g, letter => letter.toUpperCase())}
                  </Button>
                })}
              </div>
            </>
          }
          {selectedCurrency && selectedPaymentMethod &&
            <>
              <div className={classes.qrCode}>
                <QRCode
                  value={selectedPaymentMethod.address}
                  size={128}
                />
              </div>
              <div className={classes.qrCodeLabel}>
                <Typography>
                  <Trans>Only send {selectedCurrency} to this address</Trans>
                </Typography>
              </div>
              <Divider />
              <Typography><Trans>Destination Address</Trans></Typography>
              <div
                className={clsx(classes.rowBox, classes.copyRow)}
                onClick={onCopyDestinationAddress}>
                <Typography>{selectedPaymentMethod.address}</Typography>
                <div className={classes.pushRightBox}>
                  <CopyIcon className={classes.copyIcon} />
                  <div className={clsx(classes.copiedFlag, { "active": copiedDestinationAddress })}>
                    <span>
                      <Trans>
                        Copied!
                      </Trans>
                    </span>
                  </div>
                </div>
              </div>
              <Typography><Trans>Total Amount</Trans></Typography>
              <div
                className={clsx(classes.rowBox, classes.copyRow)}
                onClick={onCopyAmount}
              >
                <Typography>
                  {selectedPaymentMethod.amount} {symbolMap[selectedCurrency]}
                </Typography>
                <div className={classes.pushRightBox}>
                  <CopyIcon className={classes.copyIcon} />
                  <div className={clsx(classes.copiedFlag, { "active": copiedAmount })}>
                    <span>
                      <Trans>
                        Copied!
                      </Trans>
                    </span>
                  </div>
                </div>
              </div>
              <Typography
                variant="body1"
                component="p"
                className={classes.warningText}
                data-cy="label-crypto-payment-warning"
              >
                <InfoCircleIcon className={classes.icon} />
                <Trans>
                  All crypto payments are final and ineligible for credits,
                  exchanges or refunds. If you wish to change your plan, your funds will not be reimbursed.
                </Trans>
              </Typography>
            </>
          }
        </>
      }
      <section className={classes.bottomSection}>
        <div className={classes.buttons}>
          {!!selectedCurrency && <Button
            onClick={() => setSelectedCurrency(undefined)}
            variant="text"
          >
            <Trans>Go back</Trans>
          </Button>}
          {selectedCurrency && selectedCurrency !== "bitcoin" && !isReady &&
            <Button onClick={selectWallet}><Trans>Connect Wallet</Trans></Button>
          }
          {selectedCurrency && selectedCurrency !== "bitcoin" && isReady && network !== 1 &&
            <Button onClick={handleSwitchNetwork}>
              <Trans>Switch Network</Trans>
            </Button>
          }
          {selectedCurrency && selectedCurrency !== "bitcoin" && isReady && network === 1 &&
            <Button
              onClick={handlePayment}
              disabled={!isBalanceSufficient || transferActive}
              loading={transferActive}>
              {isBalanceSufficient
                ? <Trans>Pay with {wallet?.name}</Trans>
                : <Trans>Insufficient balance</Trans>}
            </Button>
          }
        </div>
      </section>
    </article>
  )
}

export default CryptoPayment