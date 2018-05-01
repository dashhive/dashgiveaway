import React from 'react'
import Button from 'atoms/Button'
import s from './Generate.css'

class Generate extends React.Component {
  render() {
    return (
      <div className={s.root}>
        <h3>Import existing wallets or generate new ones</h3>
        <div className={s.wrapper}>
          <div className={s.existing}>
            <h4>Import Existing</h4>
            <p>Upload or paste CSV file to import an existing batch of wallets</p>
            <div className={s.dropzone} style={{ display: 'none' }}>
              <img src="/img/icon-upload-arrow.svg" />
            </div>
            <div className={s.importButtons}>
              <Button primary>Paste CSV</Button>
              <Button primary>Upload CSV</Button>
              <input type="file" className={s.file} accept="text/*" />
            </div>
          </div>

          <div className={s.or}>OR</div>

          <div className={s.new}>
            <h4>Generate New</h4>
            <p>Input how many new, empty wallets you'd like to generate.</p>
            <label className={s.round}>
              {' '}
              Number of wallets
              <input type="number" placeholder="ex: 10" />
            </label>
            <Button primary type="button">
              Generate
            </Button>
          </div>
        </div>
      </div>
    )
  }
}

export default Generate
