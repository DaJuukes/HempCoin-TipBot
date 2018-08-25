const Processor = require('../../lib/payment_processor.js')
const processor = new Processor({ agenda: global.agenda })
const {User} = require('../../db')

module.exports = bot => {
  bot.getNewAddress = async function (id) {
    const user = await User.findOne({ id })
    if (user && user.addr) return Promise.resolve({addr: user.addr, old: true})
    else return processor.getAddress()
  }

  bot.updateUserAddress = async function (id, addr) {
    let user = await User.findOne({ id })
    if (!user) user = await bot.createUser({id}, false)
    return User.findOneAndUpdate({ id }, { addr })
  }

  bot.withdraw = async function (id, amount, addr) {
    return new Promise(async (resolve, reject) => {
      let user = await User.findOne({ id })
      if (!user) reject(new Error('You did not have a tipbot account, so I created one for you!'))
      else {
        const job = agenda.create('withdraw_order', { userId: user._id, recipientAddress: addr, amount: amount })
        job.save().then(result => {
          resolve(true)
        }).catch(err => {
          if (err) reject(new Error('Error saving Agenda job'))
        })
      }
    })
  }

  bot.depositMessage = async function (data) {
    const user = await bot.fetchUser(data.id)

    return user.send(`:white_check_mark: Your deposit of **${data.amount} THC** is complete, and funds are ready to use.`)
  }

  bot.withdrawMessage = async function (data) {
    const user = await bot.fetchUser(data.id)

    return user.send(`:white_check_mark: Your withdraw of **${data.amount} THC** to ${data.address} is sent. The transaction ID is:\n${data.txid}`)
  }
}
