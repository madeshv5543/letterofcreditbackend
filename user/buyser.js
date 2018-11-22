const config = require('config');
const verify = require('../middleware/verify');
const User = require('../models/user');
const Order = require('../models/purchaseOrder');
const Timeline = require('../models/orderTimeline');
const uuidv1 = require('uuid/v1');
const UserPopulate = ['accountType', 'address', 'city', 'companyName', 'country', 'created', 'email', 'firstName', 'lastName', 'phoneNumber', 'pincode', 'username']
const web3 = require('web3');
const adhi = require('web3-adhi');
const AdhiUrl = config.adhiUrl;
const ABI = config.abi;
const Tx = require('ethereumjs-tx');
const { adminAddress, privateKey } = config;

function checkhex (word) {
    console.log('before add', word)
    if(word.length % 2 != 0){
        let  w1 = word.substring(0, 2);
        let w2 = word.substring(2, word.length);
        return w1+'0'+w2;
    }else{
        return word;
    }
}

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
                          totalCost : totalCost,
                          status:'Pending'
                      });
                    let  events = [{
                        from:sellerId,
                        date: Date.now,
                        action: 'Order Created By seller',
                        blockchain:false
                      }]
                      let newTimeline = new Timeline({
                        orderId: orderId
                      })
                      newTimeline.save()
                      .then(
                          timeline => {
                            newOrder.timeline = timeline._id;
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
                query =  {$and : [ { seller : loggedUser._id},{status : { $ne: "Pending" } }]}
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
    .populate('timeline')
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

const sentToBlockchain = function(req, res, next) {
    let { user }  = req;
    let { orderId } = req.params;
    User.findOne({email: user.email}) 
    .then(
        doc => {
            if(doc) {
                if(!doc) {
                    return res.json({message: 'Cannot find user details', status:404, type: 'Failure'})
                }
                if(!doc.blockchainExplore || !doc.blockchainHost) {
                    return res.json({ message: 'Update the blockchain details in profile infromation.' })
                }
                Order.findById(orderId)
                .populate('buyer', UserPopulate)
                .populate('seller', UserPopulate)
                .populate('timeline')
                .then(
                    orderDetails => {
                        if(!orderDetails){
                            return res.json({message: 'Cannot find the order details', status:404, type:'Failure'})
                        }
                        if(doc.blockchainHost === AdhiUrl) {
                            deployInAdhi(req, res, next, doc, orderDetails)
                        }else {
                            deployInOrderChain(req, res, next, doc, orderDetails)
                        }
                    },
                    err => {
                        return res.json({message: 'Cannot find the order details', status:404, type:'Failure'})
                    }
                )
            }
        },
        err => { 
            return res.json({message: 'Cannot find user details', status:404, type: 'Failure'})
        }
    )
}

const deployInAdhi = function(req, res, next, doc, orderDetails ) {
    try{
        const httpProv = new adhi.providers.HttpProvider(doc.blockchainHost);
        const blockchainInstance = new adhi(httpProv);
        const  smartcontrat = blockchainInstance.adh.contract(ABI).at(doc.contractAddress)
        const key = require('crypto').createHash('md5').update(orderDetails.orderId.trim()).digest("hex")
        console.log("key", key)
        // smartcontrat.enterStructData(orderDetails.orderId, doc.walletAddress, 'PO', JSON.stringify(orderDetails))  
        const rawTransaction = {  
            "nonce": checkhex(blockchainInstance.toHex(blockchainInstance.adh.getTransactionCount(adminAddress))),
            "gasPrice": 1000000000, 
            "gasLimit": 3000000,
            "to": doc.contractAddress,
            "value": '0x00',
            "chainId":1,
            "data" :smartcontrat.enterStructData.getData(key, doc.walletAddress, 'PO', JSON.stringify(orderDetails),{from : adminAddress})
        }
        const secret = new Buffer(privateKey, 'hex');
        const tx = new Tx(rawTransaction);
        tx.sign(secret);
        const serializedTx = tx.serialize();
        let sendString = serializedTx.toString('hex');
        blockchainInstance.adh.sendRawTransaction(`0x${sendString}`,
            function(err, result) {
                if(err) {
                    return res.json({message: 'Cannot add order details in blockchain', status:400, type:'Failure'})
                }
                req.details = {
                    txhash : doc.blockchainExplore + result,
                    host: doc.blockchainHost,
                    contractAddress: doc.contractAddress
                }
                next()
            })
    }catch(e) {
        return res.json({message: 'Cannot put the data in blockchain', status: 400, type: "Failure"})
    }
}

const deployInOrderChain =function(req, res, next, doc, orderDetails ) {
    try{
        const httpProv = new web3.providers.HttpProvider(doc.blockchainHost);
        const blockchainInstance = new web3(httpProv);
        const  smartcontrat = blockchainInstance.eth.contract(ABI).at(doc.contractAddress)
        const key = require('crypto').createHash('md5').update(orderDetails.orderId.trim()).digest("hex")
        console.log("key", key)
        // smartcontrat.enterStructData(orderDetails.orderId, doc.walletAddress, 'PO', JSON.stringify(orderDetails))  
        const rawTransaction = {  
            "nonce": checkhex(blockchainInstance.toHex(blockchainInstance.eth.getTransactionCount(adminAddress))),
            "gasPrice": 10000000000, 
            "gasLimit": 3000000,
            "to": doc.contractAddress,
            "value": '0x00',
            "data" :smartcontrat.enterStructData.getData(key, doc.walletAddress, 'PO', JSON.stringify(orderDetails),{from : adminAddress})
        }
        console.log("raw transaction", rawTransaction)
        const secret = new Buffer(privateKey, 'hex');
        const tx = new Tx(rawTransaction);
        tx.sign(secret);
        const serializedTx = tx.serialize();
        let sendString = serializedTx.toString('hex');
        blockchainInstance.eth.sendRawTransaction(`0x${sendString}`,
            function(err, result) {
                if(err) {
                    return res.json({message: 'Cannot add order details in blockchain', status:400, type:'Failure'})
                }
                req.details = {
                   txhash : doc.blockchainExplore + result,
                   host: doc.blockchainHost,
                   contractAddress: doc.contractAddress
                }

                next()
            })
    }catch(e) {
        return res.json({message: 'Cannot put the data in blockchain', status: 400, type: "Failure"})
    }
}

const updateOrderDetails = function(req, res) {
    let { orderId } = req.params;
    let {txhash, host, contractAddress }  = req.details;
    Order.findByIdAndUpdate(orderId, { status:'Active' })
    .then(
        orderupdate => {
          Timeline.findOneAndUpdate({orderId: orderupdate.orderId},{sentToseller: true, buyerblockchain : txhash, buyerhost : host, buyerContract : contractAddress })
          .then(
              timeline =>{
                return res.json({message: 'Order Details updated Successfully.', status: 200, type:'Success'})
              },
              err => {
                return res.json({ message: 'Cannot update Order Details', status: 404, type:'Failure' })
              }
          )
        },
        err => {
          return res.json({ message: 'Cannot update Order Details', status: 404, type:'Failure' })
        }
    )
}

const sellerconfirm = function(req, res) {
    let { orderId } = req.params;
    let {txhash, host, contractAddress }  = req.details;
    Order.findByIdAndUpdate(orderId, { status:'Completed' })
    .then(
        orderupdate => {
          Timeline.findOneAndUpdate({orderId: orderupdate.orderId},{sellerConfirm: true, sellerblockchain : txhash, sellerContract : contractAddress, sellerhost : host })
          .then(
              timeline =>{
                return res.json({message: 'Order Details updated Successfully.', status: 200, type:'Success'})
              },
              err => {
                return res.json({ message: 'Cannot update Order Details', status: 404, type:'Failure' })
              }
          )
        },
        err => {
          return res.json({ message: 'Cannot update Order Details', status: 404, type:'Failure' })
        }
    )
}



const verifySeller = function(req, res, next) {
    let { user } = req;
    if(user.accountType !== 'Seller') {
        return res.status(403).send({ auth: false, message: "Access Restricted" });    
    }
    next()
}

const verifybuyer = function(req, res, next) {
    let { user } = req;
    if(user.accountType !== 'Buyer') {
        return res.status(403).send({ auth: false, message: "Access Restricted" });    
    }
    next()
}

const getDatafromBlochain = function(req, res) {
    let { user } = req;
    let {host}  = req.body;
    if(host === AdhiUrl) {
        formAdhi(req, res)
    }else{
        fromOtherChain(req, res)
    }
}

const formAdhi  = function(req, res) {
    let {host, contract, orderId} = req.body;
    try{
        const Web3 = require('web3-adhi')
        const web3 = new Web3(new Web3.providers.HttpProvider(host)); 
        const smartContract = web3.adh.contract(ABI).at(contract);
        const doc_no = orderId.trim();
        const key = require('crypto').createHash('md5').update(doc_no).digest("hex") 
        const dataHash = smartContract.verifyData(key);
        if(!dataHash) {
            return res.json({message: 'Data not found in blockchain', status: 404, type: "Failure"})
        }else{
            return res.json({data: dataHash, status: 200, type:'Success'})
        }
    }catch(e) {
        return res.json({message: 'Cannot get data from blockchain', status: 400, type: "Failure"})
    }
}

const fromOtherChain = function(req, res) {
    let {host, contract, orderId} = req.body;
    try{
        const Web3 = require('web3')
        const web3 = new Web3(new Web3.providers.HttpProvider(host)); 
        const smartContract = web3.eth.contract(ABI).at(contract);
        const doc_no = orderId.trim();
        const key = require('crypto').createHash('md5').update(doc_no).digest("hex") 
        const dataHash = smartContract.verifyData(key);
        if(!dataHash) {
            return res.json({message: 'Data not found in blockchain', status: 404, type: "Failure"})
        }else{
            return res.json({data: dataHash, status: 200, type:'Success'})
        }
    }catch(e) {
        return res.json({message: 'Cannot get data from blockchain', status: 400, type: "Failure"})
    }
}

module.exports = function(router) {
    router.get('/sellerlist',
        verify,
        sellerDetails
    );
    router.post('/placeOrder',
        verify,
        verifybuyer,
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
        verifybuyer,
        updateOrder
    );
    router.post('/deleteOrder/:orderId',
        verify,
        verifybuyer,
        deleteOrder
    );
    router.post('/senttoseller/:orderId',
        verify,
        verifybuyer,
        sentToBlockchain,
        updateOrderDetails
    );
    router.post('/sellerconfirm/:orderId',
        verify,
        verifySeller,
        sentToBlockchain,
        sellerconfirm
    ),
    router.post('/datafromblochain',
        verify,
        getDatafromBlochain
    )
}