const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const campaignSchema = new Schema({
    fromaddress: {
        type: String
    },
    toaddress: {
        type: String
    },
    fromuser: {
        type: String
    },
    toUser:{
        type: String
    },
    value: {
        type: Number
    },
    campaign: {
        type: String
    }
});

module.exports = mongoose.model('User', userSchema);

