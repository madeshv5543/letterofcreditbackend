const config = require('config');
const verify = require('../middleware/verify');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const upload = require('../utils/utils');
const provider =   config.get('etheriumhost'); 
const web3 = require('../utils/web3.singleton')(`${provider}`);
const Campaign =  require('../models/campaign');
const walletUtils= require('../utils/wallet');
const tokenOneAbi = config.get('indabi');
const Tx = require('ethereumjs-tx');
function decryptSeed (seed, password) {
    const encrypt = require('../utils/crypto');
    return encrypt.decrypt('aes256',password,seed)
}

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

const icontractAddress = config.get('indcontractAddress');
const inContract =  web3.eth.contract(tokenOneAbi).at(icontractAddress)

module.exports = function(router) {
    router.get('/user',
        verify,
        (req, res) => {
            const { user } = req;
            User.findOne({"address":user.address})
            .then(
                userDetails => {
                    if(!userDetails){
                        return res.json({ message: 'User Not found', status: 401, type: 'Failure' })
                    }
                    return res.json({data:userDetails, status:200, type:'Success' } )
                },
                err =>{
                    return res.json({ message: 'User details cannot find . please try again later', status: 500, type: 'Failure'})
                }
            )
        }
    );

    router.get('/balance',
        verify,
        (req, res) => {
            const { user} = req;
            let balance;
            try{
                 balance = inContract.balanceOf(user.address);
            }catch(e) {
                console.log("err",e)
                return res.json({message: 'Cannot get user balance', status: 400, type: "Failure"})
            }
            balance = balance ? balance/1e18:0
            return res.json({data: balance, status: 200, type:"Suucess"})
        }
    )

    router.post('/edituser',
        verify,
        upload.any(),
        (req, res) =>{
            const { user } = req;
            const userUpdateDetails = req.body;
            if(userUpdateDetails.fieldname1) {
                userUpdateDetails.filename1 = req.files[0].filename
            }
            if(userUpdateDetails.fieldname2 && userUpdateDetails.fieldname1){
                userUpdateDetails.filename2 = req.files[1].filename;
            }
            if(userUpdateDetails.filename2 && !userUpdateDetails.fieldname1) {
                userUpdateDetails.filename2 = req.files[0].filename;
            }
            if('fieldname1' in req.body){
                delete userUpdateDetails.fieldname1
            }
            if('fieldname2' in req.body){
                delete userUpdateDetails.fieldname2
            }
            User.findOne({"address":user.address})
            .then(
                userDetails => {
                    if(!userDetails){
                        return res.json({ message: 'User Not found', status: 401, type: 'Failure' })
                    }
                    User.findOneAndUpdate({"address":user.address},userUpdateDetails)
                        .then( doc => {
                            return res.json({ message: "User details updated successfully.", status: 200, type:'Success' })
                        },
                        err => {
                            return res.json({ message: 'User details cannot update. please try again later', status: 500, type: 'Failure'})
                        })
                },
                err =>{
                    return res.json({ message: 'User details cannot find . please try again later', status: 500, type: 'Failure'})
                }
            )
        }
    )

    router.post('/transfer',
        verify,
        (req, res, next) => {
            const requireParams = [
                'from',
                'to',
                'value',
                'campaign',
                'password'
            ]; 
            let isValid =  requireParams.reduce((acc, p) => (  acc & p in req.body), true)
            if(!isValid) {
                return res.json({message: 'A require Param is not present ', status: 400, type: 'Failure'});
            }
            const { user } = req;
            if(user.address !== req.body.from) {
                return res.json({message: 'invalid from address', status: 400, type: 'Failure'});
            }
            if(user.phrase !== req.body.password) {
                return res.json({message: 'Invalid password', status:401, type: 'Failure'})
            }
            Campaign.findById(req.body.campaign)
            .then (
                tcamp => {
                    if(!tcamp){
                        return res.json({message:'Transfer details are invalid', status: 400, type:'Failure'})
                    }
                    if(tcamp.value != req.body.value) {
                        return res.json({message: 'transfer amount is mismatch', status:400, type:'Failure'})
                    }
                    next()
                },
                err => {
                    return res.json({message: 'Cannot find the campaign details', status: 400, type:'Failure'})
                }
            )
            
        },
        (req, res) => {
            let { from, to, value:amount, campaign, password} = req.body;
            const { user } = req;
            let balance;
            try{
                 balance = inContract.balanceOf(user.address);
            }catch(e) {
                return res.json({message: 'Cannot get user balance', status: 400, type: "Failure"})
            }
            if(balance <  amount) {
                return res.json({message: 'Insufficient balance', status: 400, type:'Failure'})
            }
            const {address, seed, phrase} = user;
            const seedw = decryptSeed(seed, phrase);
            const wallet = walletUtils.getWallet(seedw);
            const skey = walletUtils.getWalletPrivateKey(wallet)
            amount= amount * 1e18;
            const secret = new Buffer(skey, 'hex');
            const rawTransaction = {  
                "nonce": checkhex(web3.toHex(web3.eth.getTransactionCount(address))),
                "gasPrice": 0, 
                "gasLimit": "0x0153df",
                "to": icontractAddress,
                "value": '0x00',
                data : inContract.transfer.getData(to, amount, {from: address})
            }
            const tx = new Tx(rawTransaction);
            tx.sign(secret);
            const serializedTx = tx.serialize();
            let sendString = serializedTx.toString('hex');
            web3.eth.sendRawTransaction(`0x${sendString}`,
                function(err, result) {
                    if(!err) {
                        let txhash = result;
                        let newTransaction = new Transaction({
                            hash: result,
                            from: address,
                            nonce: web3.eth.getTransactionCount(address),
                            to,
                            value: amount / 1e18,
                            timestamp: Date.now(),
                            campaign:campaign
                        })
                        newTransaction.save((err, result) => {
                            Campaign.findByIdAndUpdate(campaign, { status:'Completed', txhash})
                            .then(
                                doccam => {
                                    return res.json({status: 'Success', status: 200, type:'Success'})
                                },
                                err => {
                                    return res.json({message: 'Cannot find the campaign details', status: 400, type:'Failure'})
                                }
                            )
                        })
                    }else{
                        console.log("err",err)
                        return res.json({message: 'Cannot find the campaign details', status: 400, type:'Failure'})
                    }
                }
            )

        }
    )

}