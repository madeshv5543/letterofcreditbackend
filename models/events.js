const mongoose = require('mongoose');
const Schema  = mongoose.Schema;

const eventSchema = new Schema({
    date:{
        type:Date,
        default:new Date
    },
    title: String,
    from: String,
    description:String,
    image:String,
    campaign:{
        type:Schema.Types.ObjectId, 
        ref: 'Campaign'
    }
})

module.exports = mongoose.model('Event', eventSchema);
