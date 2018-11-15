const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const transactionSchema = new Schema({
    hash: {
        type: String,
        unique: true
    },
    from: String,
    to: String,
    value : String,
    timestamp : String,
    nonce: String,
    campaign: String,
    nonce:String
})

module.exports = mongoose.model('campaigntransaction', transactionSchema);