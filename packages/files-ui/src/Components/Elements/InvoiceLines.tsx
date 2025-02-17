import React, { useMemo } from "react"
import { makeStyles, createStyles } from "@chainsafe/common-theme"
import { CSFTheme } from "../../Themes/types"
import { Typography, Loading, Button } from "@chainsafe/common-components"
import { Trans } from "@lingui/macro"
import dayjs from "dayjs"
import { useBilling } from "../../Contexts/BillingContext"
import clsx from "clsx"

const useStyles = makeStyles(
  ({ constants, breakpoints, palette, typography }: CSFTheme) =>
    createStyles({
      heading: {
        marginBottom: constants.generalUnit * 4,
        marginTop: constants.generalUnit * 2,
        [breakpoints.down("md")]: {
          marginBottom: constants.generalUnit * 2
        }
      },
      loader: {
        marginTop: constants.generalUnit
      },
      centered: {
        textAlign: "center"
      },
      root: {
        [breakpoints.down("md")]: {
          padding: `0 ${constants.generalUnit}px`
        }
      },
      invoiceLine: {
        width: "100%",
        backgroundColor: palette.additional["gray"][4],
        color: palette.additional["gray"][9],
        padding: constants.generalUnit * 1.5,
        borderRadius: 10,
        marginTop: constants.generalUnit * 1.5,
        "& > div": {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          "& > *": {
            width: "100%",
            lineHeight: "16px",
            fontWeight: typography.fontWeight.regular,
            marginLeft: constants.generalUnit,
            marginRight: constants.generalUnit
          },
          "& > button": {
            maxWidth: 100
          }
        }
      },
      unpaidInvoice: {
        border: `1px solid ${palette.additional["volcano"][7]}`,
        color: palette.additional["volcano"][7]
      },
      price: {
        fontWeight: "bold !important" as "bold"
      },
      link: {
        color: constants.settingsPage.linkButton.color,
        paddingRight: "0px !important"
      }
    })
)

interface  IInvoiceProps {
  lineNumber?: number
  payInvoice: (invoiceId: string) => void
}

const InvoiceLines = ({ lineNumber, payInvoice }: IInvoiceProps) => {
  const classes = useStyles()
  const { invoices, downloadInvoice } = useBilling()
  const invoicesToShow = useMemo(() => {
    if (!invoices) return

    return lineNumber
      ? invoices.slice(0, lineNumber)
      : invoices
  }, [invoices, lineNumber])

  return (
    <>
      {!invoicesToShow && (
        <div className={classes.centered}>
          <Loading
            className={classes.loader}
            type="initial"
            size={32}
          />
        </div>
      )}
      {invoicesToShow && !invoicesToShow.length && (
        <div>
          <Typography
            className={classes.heading}
            variant="body1"
            component="p"
          >
            <Trans>No invoice found</Trans>
          </Typography>
        </div>
      )}
      {!!invoicesToShow?.length && (
        invoicesToShow.map(({ amount, currency, uuid, period_start, status, product }) =>
          <section
            className={clsx(classes.invoiceLine, status === "open" && classes.unpaidInvoice)}
            key={uuid}
          >
            <div>
              <Typography variant="body1">
                {product.name} {product.price.recurring.interval_count} {product.price.recurring.interval}
              </Typography>
              <Typography variant="body1">
                {dayjs.unix(period_start).format("MMM D, YYYY")}
              </Typography>
              <Typography
                variant="body1"
                className={classes.price}
              >
                {amount.toFixed(2)} {currency.toUpperCase()}
              </Typography>
              {(status === "paid") && (
                <Button
                  onClick={() => downloadInvoice(uuid)}
                  variant="link"
                  testId="download-invoice"
                  className={classes.link}
                >
                  <Trans>View PDF</Trans>
                </Button>
              )}
              {(status === "open") && (
                <Button
                  onClick={() => uuid && payInvoice(uuid)}
                  variant="link"
                  testId="pay-invoice"
                  className={classes.link}
                >
                  <Trans>Pay now</Trans>
                </Button>
              )}
            </div>
          </section>
        )
      )}
    </>
  )
}

export default InvoiceLines