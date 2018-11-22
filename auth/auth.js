const config = require('config');
const walletUtils = require('../utils/wallet');
const lightwallet = require("eth-lightwallet");
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken'); 
const encrypt = require('../utils/crypto');

function createToken(user, res) {
    return jwt.sign(user, config.secret, {
        expiresIn:86400
    })
}

function encryptSeed(seed, password) {
    return encrypt.encrypt('aes256', password, seed.toString());
}

function decryptSeed (seed, password) {
    return encrypt.decrypt('aes256',password,seed)
}
 
module.exports = function(router) {
    router.post('/signUp',
        (req, res, next) => {
            if(!req.body.hasOwnProperty('email')) {
               next({message: 'Email is Required.', status:400, type: "Failure"})
            };
            if(!req.body.hasOwnProperty('username')) {
                next({message: 'username is Required.', status:400, type: "Failure"})
             };
            if(!req.body.hasOwnProperty('password')) {
                next({message: 'Password is Required.', status:400, type: "Failure"})
            };
            if(!req.body.hasOwnProperty('accountType')) {
                next({message: 'Account type is Required.', status:400, type: "Failure"})
            };
            if(req.body.password != req.body.confirmPassword) {
                next({message: 'password and Confirmpassword  is Mismatch.', status:400, type: "Failure"})
            }
            next();
        },
        function(req, res, next) {
            const User = require('../models/user');
            req.body.email = req.body.email.toLowerCase();
            const { email,  password, accountType, username} = req.body;
            User.findOne({'email':email})
            .then(
                user => {
                    if(user){
                         res.json({ message: 'This Email already Exists.', status: 400, type: "Failure"})
                    }else{
                        const seed  = lightwallet.keystore.generateRandomSeed();
                        const wallet = walletUtils.getWallet(seed);
                        const seedHash = encryptSeed(seed, password);
                        const address =walletUtils.getWalletAddress(wallet)
                        const user = new User({
                            email,
                            password,
                            accountType,
                            seed:seedHash,
                            walletAddress:address,
                            username
                        })
                        const data = {
                            address,
                            accountType,
                            seed:seedHash,
                            email,
                            username
                        };
                        user.save()
                        .then( result => {
                                token = createToken({address: data.address, seed: seedHash, email: email, phrase:password, accountType}, res);
                                res.json({data, token, seed, status: 200, type: 'Success'});
                            },err=>{
                                res.json({message: err, status: 400, type: "Failure"})
                            }
                        )
                    }
                },
                err =>{
                    res.json({message: err, status: 500, type: "Failure"})
                }
            )
        }
    )

    router.post('/login',
        (req,res,next) => {
            if( !('email' in req.body) ){
                next({message: 'Email is Required', status:400, type: 'failure'})
            };
            if( !('password' in req.body) ){
                next({message: 'Password is Required', status:400, type: 'failure'})
            }
            next()
        },
        (req,res,next) => {
            req.body.email = req.body.email.toLowerCase();
            const { email, password } = req.body;
            const User = require('../models/user');

            User.findOne({'email':email})
                .then((user) => {
                    console.log("user",user)
                    if(!user){
                      return  res.json(
                            {
                                message: 'User not found with this email.',
                                status: 404,
                                type: 'failure'
                            }
                        )
                    }

                    if(!user.accountType) {
                        return  res.json(
                            {
                                message: 'User not have access to this site',
                                status: 404,
                                type: 'failure'
                            }
                        )
                    }

                    bcrypt.compare(password,user.password,
                        (passwordErr, isMatch) => {
                            if (!isMatch || passwordErr){
                                    res.json( { message: 'Password is Incorrect.', status:400, type: 'failure' })
                                }else{
                                    const data = {
                                        email:user.email,
                                        username:user.username,
                                        accountType:user.accountType
                                    };
                                    token = createToken({email:data.email,  phrase:password, accountType:user.accountType}, res);
                                    res.json({data, token, status: 200, type: 'success'})
                                }
                        }
                    ) 
                },
                err => {
                    res.json( { message: 'Email or Password is incorrect.', status:400, type: 'failure'})
                }
                
            )

        }
    )
}
