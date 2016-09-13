/* eslint-disable babel/no-await-in-loop */

const points = {
  async makeString (amount) {
    const inputAmount = parseInt(amount)
    if (inputAmount === 1) {
      // singular
      return `${inputAmount} ${await this.settings.getPointName(true)}`
    } else {
      // plural
      return `${inputAmount} ${await this.settings.getPointName()}`
    }
  },
  async getCommandPrice (cmd, sub = null) {
    return (sub)
      ? await $.db.get('subcommands', 'price', { name: cmd })
      : await $.db.get('commands', 'price', { name: cmd })
  },
  async setCommandPrice (cmd, price, sub = null) {
    const cost = parseInt(price)
    if (sub) {
      await $.db.set('subcommands', { name: cmd, price: cost }, { name: cmd })
    } else {
      await $.db.set('commands', { name: cmd, price: cost }, { name: cmd })
    }
  },
  async getUserPoints (user, makeString) {
    if (makeString) {
      return await this.makeString(await $.db.get('users', 'points', { name: user }))
    } else {
      return await $.db.get('users', 'points', { name: user })
    }
  },
  async setUserPoints (user, amount) {
    const inputAmount = parseInt(amount)
    await $.db.set('users', { points: inputAmount }, { name: user })
  },
  async add (user, amount) {
    const inputAmount = parseInt(amount)
    await $.db.incr('users', 'points', inputAmount, { name: user })
  },
  async sub (user, amount) {
    const inputAmount = parseInt(amount)
    await $.db.decr('users', 'points', inputAmount, { name: user })
  },
  async run () {
    const now = Date.now()
    const nextLivePayout = this.lastPayout + (await this.settings.getPayoutInterval() * 60 * 1000)
    const nextOfflinePayout = this.lastPayout + (await this.settings.getPayoutInterval(true) * 60 * 1000)
    let payout = 0

    if ($.stream.isLive) {
      if (await this.settings.getPayoutAmount() > 0 &&
        await this.settings.getPayoutInterval() > 0) {
        if (nextLivePayout >= now) {
          return
        } else {
          payout = await this.settings.getPayoutAmount()
        }
      }
    } else {
      if (await this.settings.getPayoutAmount(true) > 0 &&
        await this.settings.getPayoutInterval(true) > 0) {
        if (nextOfflinePayout >= now) {
          return
        } else {
          payout = await this.settings.getPayoutAmount(true)
        }
      } else {
        return
      }
    }

    const userList = $.user.list || []

    for (let user of userList) {
      let bonus = 0

      if (user !== $.channel.botName) {
        if (await this.settings.lastUserList.includes(user)) {
          const userDB = await $.db.getRow('users', { name: user })

          if (userDB) {
            if (this.settings.getRankBonus(userDB.rank)) {
              bonus = await this.settings.getRankBonus(userDB.rank)
            } else {
              bonus = await this.settings.getGroupBonus(userDB.permission)
            }
          }

          await $.db.incr('users', 'points', payout + bonus, { name: user })
        } else {
          await this.settings.lastUserList.push(user)
        }
      }
    }

    this.settings.lastPayout = now

    $.tick.setTimeout('pointPayouts', ::this.run, 60 * 1000)
  },
  settings: {
    lastPayout: 0,
    lastUserList: [],
    async getPointName (singular = false) {
      return (singular)
        ? await $.settings.get('pointName', 'point')
        : await $.settings.get('pointNamePlural', 'points')
    },
    async setPointName (name, singular = false) {
      if (singular) {
        await $.settings.set('pointName', name)
      } else {
        await $.settings.set('pointNamePlural', name)
      }
    },
    async getPayoutAmount (offline) {
      if (!offline) {
        return await $.settings.get('pointsPayoutLive', 6)
      } else {
        return await $.settings.get('pointsPayoutOffline', -1)
      }
    },
    async setPayoutAmount (amount, offline) {
      const amt = parseInt(amount)
      if (!offline) {
        await $.settings.set('pointsPayoutLive', amt)
      } else {
        await $.settings.set('pointsPayoutOffline', amt)
      }
    },
    async getPayoutInterval (offline) {
      if (!offline) {
        return await $.settings.get('pointsIntervalLive', 5)
      } else {
        return await $.settings.get('pointsIntervalOffline', -1)
      }
    },
    async setPayoutInterval (time, offline) {
      const _time = parseInt(time)
      if (!offline) {
        await $.settings.set('pointsIntervalLive', _time)
      } else {
        await $.settings.set('pointsIntervalOffline', _time)
      }
    },
    async getRankBonus (rank) {
      const _storedRankBonus = await $.db.get('ranks', 'bonus', { name: rank })
      if (_storedRankBonus) {
        return _storedRankBonus
      } else {
        return false
      }
    },
    async setRankBonus (rank, bonus) {
      await $.db.set('ranks', { name: rank, bonus }, { name: rank })
    },
    async getGroupBonus (group) {
      let _storedGroupBonus

      if (typeof group === 'number') {
        _storedGroupBonus = await $.db.get('groups', 'bonus', { level: group })
      } else if (typeof group === 'string') {
        _storedGroupBonus = await $.db.get('groups', 'bonus', { name: group })
      } else return 0

      return _storedGroupBonus || 0
    },
    async setGroupBonus (group, bonus) {
      if (typeof group === 'number') {
        await $.db.set('groups', { level: group, bonus }, { level: group })
      } else if (typeof group === 'string') {
        await $.db.set('groups', { name: group, bonus }, { name: group })
      }
    }
  }
}

/**
 * Add methods to the global core object
 **/
const exportAPI = {
  getPrice: points.getCommandPrice,
  setPrice: points.setCommandPrice
}

$.on('bot:ready', () => {
  Object.assign($.command, exportAPI)

  $.points = {
    add: ::points.add,
    sub: ::points.sub,
    get: ::points.getUserPoints,
    set: points.setUserPoints,
    str: ::points.makeString,
    getName: points.settings.getPointName,
    setName: points.settings.setPointName
  }

  setTimeout(() => {
    points.run()
  }, 5 * 1000)
})

export default points
