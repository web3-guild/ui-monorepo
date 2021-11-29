import React, { useEffect, useState } from "react"
import { makeStyles, createStyles } from "@chainsafe/common-theme"
import clsx from "clsx"
import { Button, ExternalSvg, Loading, Typography } from "@chainsafe/common-components"
import { Trans } from "@lingui/macro"
import { CSFTheme } from "../../../../../Themes/types"
import { useBilling } from "../../../../../Contexts/BillingContext"
import { Product } from "@chainsafe/files-api-client"

const useStyles = makeStyles(({  constants, palette, typography }: CSFTheme) =>
  createStyles({
    root:  {
      margin: `${constants.generalUnit * 2}px 0px`
    },
    header: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    loadingContainer: {
      margin: `${constants.generalUnit * 4}px 0`,
      display: "flex",
      justifyContent: "center"
    },
    panels: {
      display: "grid",
      gridColumnGap: constants.generalUnit,
      gridTemplateColumns: "1fr 1fr 1fr",
      margin: `${constants.generalUnit * 4}px 0`
    },
    planBox: {
      border: `2px solid ${palette.additional["gray"][5]}`,
      padding: constants.generalUnit * 3,
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    },
    priceSpace: {
      height: 22
    },
    tag: {
      display: "block",
      padding: `${constants.generalUnit * 0.25}px ${constants.generalUnit}px`,
      borderRadius: `${constants.generalUnit * 2}px`,
      height: 24,
      backgroundColor: palette.primary.main,
      color: constants.changeProduct.currentTag.text,
      margin: `${constants.generalUnit * 0.5}px 0`
    },
    link: {
      display: "flex",
      justifyContent: "flex-start",
      alignItems: "center",
      "& svg": {
        marginLeft: constants.generalUnit,
        stroke: palette.additional.gray[10],
        width: constants.generalUnit * 2,
        height: constants.generalUnit * 2
      }
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
      justifyContent: "space-between",
      alignItems: "center"
    },
    planTitle: {
      fontWeight: "bold",
      marginBottom: constants.generalUnit
    },
    priceSubtitle: {
      ...typography.body2,
      color: palette.additional["gray"][9]
    },
    description: {
      margin: `${constants.generalUnit * 3}px 0`
    },
    priceYearlyTitle: {
      fontWeight: "bold"
    }
  })
)

interface ISelectPlan {
  className?: string
  close: () => void
  next: (newPriceId: string) => void
}

const SelectPlan = ({ close, className }: ISelectPlan) => {
  const classes = useStyles()
  const { getAvailablePlans, currentSubscription } = useBilling()
  const [plans, setPlans] = useState<Product[] | undefined>()

  useEffect(() => {
    if(!plans) {
      getAvailablePlans()
        .then((plans) => setPlans(plans))
        .catch(console.error)
    }
  })

  return (
    <article className={clsx(classes.root, className)}>
      <header className={classes.header}>
        <Typography
          component="p"
          variant="h4"
        >
          <Trans>
            Switch Plans
          </Trans>
        </Typography>
      </header>
      {!plans && <div className={classes.loadingContainer}>
        <Loading
          type="inherit"
        />
      </div>
      }
      <section className={classes.panels}>
        {plans && plans.map((plan) => {
          const monthly = plan.prices.find((price) => price.recurring.interval === "month")
          const yearly = plan.prices.find((price) => price.recurring.interval === "year")

          return <div
            className={classes.planBox}
            key={`plan-${plan.id}`}
          >
            <Typography
              component="p"
              variant="body1"
              className={classes.planTitle}
            >
              {plan.name}
            </Typography>
            {monthly && <Typography component="h4"
              variant="h4">
              {monthly.unit_amount ? <>
                {monthly.currency.toUpperCase()} {monthly.unit_amount}
                <span className={classes.priceSubtitle}>/month</span>
              </> : "Free"}
            </Typography>
            }
            {monthly && yearly ? <Typography variant="body2"
              className={classes.priceYearlyTitle}>
              {yearly.currency.toUpperCase()} {yearly.unit_amount}
              <span className={classes.priceSubtitle}>/year</span>
            </Typography> : <div className={classes.priceSpace} />
            }
            <Typography
              component="p"
              variant="body1"
              className={classes.description}
            >
              {
                plan.description
              }
            </Typography>
            {plan.id  === currentSubscription?.product.id
              ? <Typography
                component="p"
                variant="body2"
                className={clsx(classes.tag, "current")}
              >
                <Trans>
                  Current plan
                </Trans>
              </Typography> : <Button variant="primary">
                <Trans>Select plan</Trans>
              </Button>
            }
          </div>
        })
        }
      </section>
      <section className={classes.bottomSection}>
        <a
          className={classes.link}
          href="http://chainsafe.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Typography
            component="span"
            variant="h5"
          >
            <Trans>
              Not sure what to pick? Learn more about our plans
            </Trans>
          </Typography>
          <ExternalSvg />
        </a>
        <div className={classes.buttons}>
          <Button
            onClick={() => close()}
            variant="secondary"
          >
            <Trans>
              Cancel
            </Trans>
          </Button>
        </div>
      </section>
    </article>
  )
}

export default SelectPlan