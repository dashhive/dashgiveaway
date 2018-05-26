import React from 'react'
import Button from '../../atoms/button/Button'
import Generate from '../generate/Generate'
import ActionCard from '../../molecules/action-card/action-card'
import APICard from '../../molecules/api-card/api-card'
import s from './Giveaway.css'

class Giveaway extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      url: 'https://insight.dash.org/api',
    }
  }

  handleChange(url) {
    this.setState({ ...this.state, url })
  }

  render() {
    return (
      <div className={s.root}>
        <div className={s.actions}>
          <ActionCard
            title="Disburse Funds"
            description="Choose a Funding Source and destination addreses. Generate and print secure wallets or import CSV from paper.dash.org"
            banners={[
              {
                src: 'icon-generate.svg',
                alt: '',
                title: 'Generate Paper Wallets',
              },
              {
                src: 'icon-import-csv.svg',
                alt: '',
                title: 'Import Paper CSV',
              },
            ]}
            buttonText="Spread Dash →"
          />
          <ActionCard
            title="Review Giveaway"
            description="See the impact your giveaway has had. Reclaim unused wallets for another round."
            banners={[
              {
                src: 'icon-measure.svg',
                alt: '',
                title: 'Measure Outreach',
              },
              {
                src: 'icon-reclaim.svg',
                alt: '',
                title: 'Recycle Unused Wallets',
              },
            ]}
            buttonText="Check Status →"
          />
        </div>
        <APICard
          title="Insight API URL"
          placeholder="ex: https://api.example.com/insight-api-dash"
        >
          <p>
            Want to run a private instance of this app? Install{' '}
            <a href="https://github.com/dashhive/dashd-installer.sh" target="_blank">
              dashd
            </a>, the{' '}
            <a
              href="https://github.com/dashhive/dash-insight-installer.sh"
              target="_blank"
            >
              Dash Insight API
            </a>, and host{' '}
            <a href="https://github.com/dashhive/dashdrop.html" target="_blank">
              DashDrop
            </a>.
          </p>
        </APICard>
        <Generate/>
      </div>
    )
  }
}

export default Giveaway
