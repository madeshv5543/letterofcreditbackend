const config = require('config');
const verify = require('../middleware/verify');
const User = require('../models/user');
const Order = require('../models/purchaseOrder');
const uuidv1 = require('uuid/v1');
const UserPopulate = ['accountType', 'address', 'city', 'companyName', 'country', 'created', 'email', 'firstName', 'lastName', 'phoneNumber', 'pincode', 'username']


const sellerDetails = function(req, res) {
    User.find({accountType:'Seller'},{password:0})
    .then(
        docs => {
            res.json({data:docs, status:200, type:'Success'})
        },
        err => {
            res.json({message:'Cannot get Seller list', status: 400, type: 'Failure'})
        }
    )
}

const placeOrder = function(req, res) {
    let {user}  = req;
    const {items, totalCost, sellerId } = req.body;
    if(!items || !items.length) {
        return res.json({message: 'Cannot place the empty Order', status: 400, type: 'Failure'})
    }
    User.findOne({email: user.email}) 
    .then(
        doc => {
            if(doc) {
                if(!doc) {
                    return res.json({message: 'Cannot find user details', status:404, type: 'Failure'})
                }
                User.findById(sellerId)
                .then(
                  seller => {
                      if(!seller) {
                        return res.json({message: 'Cannot find seller details', status:404, type: 'Failure'})
                      }
                     let checkCost = items.reduce((a,b) => {
                        return parseFloat(a) + parseFloat(b.total)
                      }, 0)
                      if(checkCost !== parseFloat(totalCost)) {
                          return res.json({message: 'Order details are Mis match', status: 400, type: 'Failure'})
                      }
                    let sellerid = seller._id;
                    let buyerId = doc._id;
                    let orderId = uuidv1()
                    let newOrder = new Order({
                          seller : sellerid,
                          buyer : buyerId,
                          orderId: orderId,
                          items : items,
                          totalCost : totalCost
                      });
                      newOrder.save()
                      .then(
                          order => {
                            return res.json({message: 'Order Details Saved.', status: 200, type: 'Success'})
                          },
                          err => {
                              return res.json({message: 'Cannot save order details', status: 500, type:'Failure'})
                          }
                      )
                  },
                  err => {
                    return res.json({message: 'Cannot find seller details', status:404, type: 'Failure'})
                  }
                )
            }
        },
        err => { 
            return res.json({message: 'Cannot find user details', status:404, type: 'Failure'})
        }
    )
}

const myOrders = function (req, res) {
    let { user } = req;
    User.findOne({email: user.email})
    .then(
        loggedUser => {
            if(!loggedUser) {
                return res.json({message: 'Cannot find user details', status: 404, type: 'Failure'})
            }
            let query;
            if(user.accountType  === 'Seller') {
                query = { seller : loggedUser._id}
            }else{
                query = { buyer : loggedUser._id}
            }
            Order.find(query)
            .populate('buyer', 'username')
            .populate('seller', 'username')
            .then(
                orders => {
                    return res.json({data: orders, status: 200, type: 'Success'})
                },
                err => {
                    return res.json({ message : 'Cannot get the orders list', status: 404, type: 'Failure' })
                }
            )
        },
        err => {
            return res.json({message: 'Cannot find user details', status: 404, type: 'Failure'})
        }
    )
}

const getOrderDetails = function(req, res) {
    let  { user } = req;
    let { orderId }  = req.params;
    Order.findById(orderId)
    .populate('buyer', UserPopulate)
    .populate('seller', UserPopulate)
    .then(
        order => {
            if(!order) {
                return res.json({ message: 'Order Not Found', status: 404, type: 'Failure'})
            }
            return res.json({ data: order, status: 200, type:'Success'})
        },
        err => {
            return res.json({message: 'Cannot find the Order details', status: 404, type: 'Failure'})
        }
    )  
}

const deleteOrder = function( req, res) {
    let { user } = req;
    let { orderId } = req.params;
    User.findOne({email: user.email})
    .then(
        loggedUser => {
            if(!loggedUser) {
                return res.json({ message: 'User not found. Canot delete the order', status: 404, type: 'Failure'})
            }
            Order.findOneAndRemove({_id:orderId,  buyer: loggedUser._id})
            .then(
                deleteItem => {
                    return res.json({ message: 'Order Deleted Successfully.', status: 200, type:'Success' })
                },
                err => {
                    return res.json({ message: 'Cannot delete the order', status: 400, type:'Failure'})
                }
            )
        },
        err => {
            return res.json({message: 'Cannot delete the order', status: 500, type:'Failure'})
        }
    )
}

const updateOrder = function(req, res) {
    let { user }  = req;
    let { orderId } = req.params;
    const {items, totalCost, sellerId } = req.body;
    if(!items || !items.length) {
        return res.json({message: 'Cannot place the empty Order', status: 400, type: 'Failure'})
    }
    User.findOne({email: user.email}) 
    .then(
        doc => {
            if(doc) {
                if(!doc) {
                    return res.json({message: 'Cannot find user details', status:404, type: 'Failure'})
                }
                User.findById(sellerId)
                .then(
                  seller => {
                      if(!seller) {
                        return res.json({message: 'Cannot find seller details', status:404, type: 'Failure'})
                      }
                     let checkCost = items.reduce((a,b) => {
                        return parseFloat(a) + parseFloat(b.total)
                      }, 0)
                      if(checkCost !== parseFloat(totalCost)) {
                          return res.json({message: 'Order details are Mis match', status: 400, type: 'Failure'})
                      }
                    let sellerid = seller._id;
                    let newOrder = {
                          seller : sellerid,
                          items : items,
                          totalCost : totalCost
                      };
                      Order.findByIdAndUpdate(orderId, newOrder)
                      .then(
                          orderupdate => {
                            return res.json({message: 'Order Details updated Successfully.', status: 200, type:'Success'})
                          },
                          err => {
                            return res.json({ message: 'Cannot update Order Details', status: 404, type:'Failure' })
                          }
                      )
                  },
                  err => {
                    return res.json({message: 'Cannot find seller details', status:404, type: 'Failure'})
                  }
                )
            }
        },
        err => { 
            return res.json({message: 'Cannot find user details', status:404, type: 'Failure'})
        }
    )
}

module.exports = function(router) {
    router.get('/sellerlist',
        verify,
        sellerDetails
    );
    router.post('/placeOrder',
        verify,
        placeOrder
    );
    router.get('/myOrder',
        verify,
        myOrders
    );
    router.get('/order/:orderId',
        verify,
        getOrderDetails
    );
    router.post('/editOrder/:orderId',
        verify,
        updateOrder
    );
    router.post('/deleteOrder/:orderId',
        verify,
        deleteOrder
    );
}