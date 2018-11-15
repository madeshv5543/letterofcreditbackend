const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const campaignSchema = new Schema({
    title:{
        type: String,
        required: [true, 'Title should not be empty']
    },
    description: {
        type: String
    },
    category: {
        type: String
    },
    startdate : {
        type: Date
    },
    enddate: {
        type: Date
    },
    value: {
        type: Number
    },
    campaignImage: {
        type: String
    },
    user: {
        type: String
    },
    place: {
        type: String
    },
    sponser : {
        type: String
    },
    txhash: {
        type: String
    },
    status: {

    },
    images :[],
    created: {
        type: Date,
        default: Date.now
    },
    events: [{
        type:Schema.Types.ObjectId, ref: 'Event'
    }]
});

module.exports = mongoose.model('Campaign', campaignSchema);

