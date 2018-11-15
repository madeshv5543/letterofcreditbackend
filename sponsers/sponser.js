const config = require('config');
const verify = require('../middleware/verify');
const Campaign =  require('../models/campaign');
const provider =   config.get('etheriumhost'); 
const web3 = require('../utils/web3.singleton')(`${provider}`);
const tokenOneAbi = config.get('indabi');
const icontractAddress = config.get('indcontractAddress');
const inContract =  web3.eth.contract(tokenOneAbi).at(icontractAddress)

module.exports = function(router) {
    router.get('/sponsercampaign',
        verify,
        (req, res) => {
            Campaign.find({sponser: user._id})
            .then (
                campaigns => {
                    return res.json({ data: campaigns, status: 200, type: 'Success' })
                },
                err => {
                    return res.json({ message: 'Cannot get campaigns list. Try after some time', status: 500, type: 'Failure'})
                }
            )
        }
    ),

    router.post('/sponsercampaign/:campaignId',
        verify,
        (req, res) =>{ 
            const { campaignId } = req.params;
            const { activeTotal } = req.body;
            const {user} = req;
            let balance;
            try{
                 balance = inContract.balanceOf(user.address);
            }catch(e) {
                return res.json({message: 'Cannot get user balance', status: 400, type: "Failure"})
            }
            Campaign.findById(campaignId)
            .then(
                dbres => {
                    //
                    if(balance - activeTotal < dbres.value) {
                        return res.json({ message: "Insufficient balance", status:400, type:'Failure' })
                    }
                    if(!dbres) {
                        return res.json({ message: "cannot find campaign details", status:401, type:'Failure' })
                    };
                    Campaign.findOneAndUpdate({_id:dbres._id},{'sponser':user.address, 'status':'Active'})
                    .then( camp => {
                        return res.json({message:'Campaign added to your sponser list', status:200, type:'Success'})
                    },
                    err => {
                        return res.json({ message: "cannot update campaign details", status:400, type:'Failure' })
                    })
                    //transaction function
                },
                err =>{
                    return res.json({ message: 'Cannot process your request. Try after some time', status: 500, type: 'Failure'})
                }
            )
        }
    )

    router.get('/sponserDashboard',
        verify,
        (req, res) => {
            const {user} = req
            Campaign.aggregate([
                {
                    $match: {
                    sponser: user.address, status:'Active'
                }
            },
            { $group: { _id: null, count: { $sum: "$value" } } }
            ])
            .then(
                totalvalue => {
                    if(totalvalue.length) {
                      return  res.json({
                            data:totalvalue[0].count,
                            status: 200,
                            type: "Success"
                        })
                    }else {
                        return  res.json({
                            data:0,
                            status: 200,
                            type: "Success"
                        })
                    }
                },
                err => {
                    return res.json({message: "Cannot get active campaign total value", status: 500, type:"Failure"})
                }
            )
        }
    )

    router.get('/getPendingCamapigns',
        verify,
        (req, res) => {
            let today = new Date();
            Campaign.find({status:'Pending', startdate: {$gt: today}})
            .then(
                campaigns => {
                    return res.json({data:campaigns, status:200, type:'Success'})
                },
                err => {
                    return res.json({message:'Cannot get pending campaign list', status:400, type:"Failure"})
                }
            )
        }
    )

    router.get('/sponseredCampaign',
        verify,
        (req, res) => {
            const { user } = req;
            Campaign.find({sponser:user.address})
            .then(
                campaigns => {
                    return res.json({data:campaigns, status:200, type:'Success'})
                },
                err=> {
                    return res.json({message: 'Cannot get sponserd campaign list'})
                }
            )
        }
    )

    router.get('/sponserActiveCampaign',
        verify,
        (req, res) => {
            const {user} = req
            Campaign.find({sponser: user.address, status:'Active'})
            .then (
                campaigns => {
                    return res.json({ data: campaigns, status: 200, type: 'Success' })
                },
                err => {
                    return res.json({ message: 'Cannot get campaigns list. Try after some time', status: 500, type: 'Failure'})
                }
            )
        }
    )
}