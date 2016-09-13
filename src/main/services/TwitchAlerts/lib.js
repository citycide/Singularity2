import { defaults } from 'lodash'
import API from './API'

export default class TwitchAlerts {
  constructor (options) {
    this.options = options || {}
    this.token = this.options.token || ''
    this.apiVersion = this.options.apiVersion || ''
    this.API = new API(this)
  }

  getRecentDonations (options) {
    const opts = { name: 'donations' }
    return this.API.request(defaults(opts, options))
  }

  /**
   * Doesn't work right now
   */
  /*
  getDonationGoal (options) {
    const opts = { name: 'donationGoal' }
    return this.API.request(defaults(opts, options))
  }
  */
}
