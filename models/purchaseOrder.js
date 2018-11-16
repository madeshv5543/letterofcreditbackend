const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = Schema({
    seller : { type: Schema.Types.ObjectId, ref:'User'},
    buyer : {type: Schema.Types.ObjectId, ref:'User'},
    orderId : { type: String, unique:true},
    createdDate : {
        type: Date,
        default: Date.now
    },
    items : [],
    totalCost : Number,
    paymentTerm : String,
    status : String
});


module.exports = mongoose.model('Order', orderSchema);