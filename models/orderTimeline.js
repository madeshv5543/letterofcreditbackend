const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderTimeline = new Schema({
        sentToseller: {
            type:Boolean,
            default: false
        },
        sellerConfirm: {
            type:Boolean,
            default: false
        },
        buyerblockchain:String,
        sellerblockchain:String,
        buyerhost:String,
        sellerhost: String,
        buyerContract:String,
        sellerContract:String,
        orderId:String
});
module.exports = mongoose.model('Timeline', orderTimeline);