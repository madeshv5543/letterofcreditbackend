const config = require('config');
const verify = require('../middleware/verify');
const Campaign =  require('../models/campaign');
const User = require('../models/user');
const Event = require('../models/events');
const upload = require('../utils/utils');
const mongoose = require('mongoose')

module.exports = function(router) {
    router.post('/addCampaign',
        verify,
        upload.single('camimg'),
        (req, res) => {
            const { user } = req;
            const requireParams = [
                'title',
                'description',
                'category',
                'startdate',
                'enddate',
                'value',
                'place'
            ];
            let isValid =  requireParams.reduce((acc, p) => (  acc & p in req.body), true)
            if(!isValid) {
                return res.json({message: 'A require Param is not present ', status: 400, type: 'Failure'});
            };
            const {title, description, category, startdate, enddate, value, place} = req.body
            const newcampaign = new Campaign({
                title,
                description,
                category,
                startdate,
                enddate,
                value,
                place,
                status:'Pending'
            });
            if(req.file){
                newcampaign.campaignImage = req.file.filename
            }
            newcampaign.user = user.address
            newcampaign.save()
            .then(
                doc => {
                    return res.json({message: 'Campaign added successfully', status: 200, type: 'Success'})
                },
                err => {
                    return res.json({message: 'Cannot save a campaign details. Try after sometime', status:500, type: 'Failure'})
                }
            )
        }
    );

   router.get('/mycampaigns',
        verify,
        (req, res) => {
            const { user } = req;
            let params = {
                user:user.address
            }
            Campaign.find(params)
            .then(
                docs => {
                    return res.json({data:docs, status:200, type:'success'})
                },
                err => {
                    return res.json({message: 'Cannot get campaign list. Try after sometime', status:500, type: 'Failure'})
                }
            )
        }
   ) 

    router.get('/campaigns',
        verify,
        (req, res) => {
            Campaign.find({status:"pending"})
            .then( docs => {
                return res.json({data: docs, status: 200, type: 'Success'})
            },
            err => {
                return res.json({message: 'Cannot get campaign list. Try after sometime', status:500, type: 'Failure'})
            })
        }
    )

    router.get('/campaign/:campaignId',
        verify,
        (req, res) => {
            const { campaignId}  = req.params
            Campaign.findById(campaignId)
            .then(
                doc => {
                    if(!doc) {
                        return res.json({message: "Cannot find camapign details", status: '204', type: 'Failure'})
                    }
                    res.json({data: doc, status: 200, type: 'Failure'})
                },
                err => {
                    return res.json({message: 'Cannot find campaign details. Try after sometime', status:500, type: 'Failure'})
                }
            )
        }
    )

    router.post('/updateCampaign/:campaignId',
        verify,
        upload.single('camimg'),
        (req, res) => {
            const { campaignId } = req.params;
            const requireParams = [
                'title',
                'description',
                'category',
                'startdate',
                'enddate',
                'value',
                'place'
            ]; 
            let campaigndata = req.body
            if(req.file) {
                campaigndata.campaignImage = req.file.filename
            }
            let isValid =  requireParams.reduce((acc, p) => (  acc & p in req.body), true)
            if(!isValid) {
                return res.json({message: 'A require Param is not present ', status: 400, type: 'Failure'});
            }
            Campaign.findById(campaignId)
            .then( doc => {
                if(!doc) {
                    return res.json({message: "Cannot find camapign details", status: '204', type: 'Failure'})
                }
                Campaign.findByIdAndUpdate(campaignId, campaigndata)
                .then( saveres => {
                    console.log("res",saveres)
                    return res.json({data:saveres, status: 200, type: 'Success'})
                },
                err => {
                    return res.json({message: 'Cannot update campaign details. Try after sometime', status:500, type: 'Failure'})
                })
            },
            err => {
                return res.json({message: 'Cannot update campaign details. Try after sometime', status:500, type: 'Failure'})
            })
        }
    )

    router.get('/allcampaigns',
        verify,
        (req, res) => {
            Campaign.find({})
            .then( 
                docs => {
                    return res.json({data:docs, status:200, type:"Success"})
                },
                err => {
                    return res.json({data:[], status:200, type:"Success"})
                }
            )
        }
    )

    router.get('/campaigndetails/:id',
        verify,
        (req, res) => {
            const {id} = req.params;
            Campaign.findById(id).lean()
            .populate('events')
            .then(
                doc => {
                    if(!doc) {
                        return res.json({message:"cannot find the campoaign details", status:400, type:"Failure"})
                    }
                    User.findOne({address:doc.user}).lean()
                    .then(
                        user => {
                            if(!user) {
                                return res.json({message: 'Cannot get campaign user details', status: 403, type:"Failure"})
                            }
                            let campaigndetails = {
                                ...doc,
                                user
                            }
                            return res.json({data:campaigndetails, status:200, type:"Success"})
                        },
                        err => {
                            return res.json({message: 'Cannot get campaign user details', status: 403, type:"Failure"})
                        }
                    )
                },
                err => {
                    return res.json({message:`can't get campaign details`, status:400, type:"Failure"})
                }
            )
        }
    )

    router.get('/usercampaigndetails/:id',
        verify,
        (req, res) => {
            const {id} = req.params;
            Campaign.findById(id).lean()
            .populate('events')
            .then(
                doc => {
                    if(!doc) {
                        return res.json({message:"cannot find the campoaign details", status:400, type:"Failure"})
                    }
                    if(doc.sponser) {
                        User.findOne({address:doc.sponser}).lean()
                        .then(
                            user => {
                                if(!user) {
                                    return res.json({message: 'Cannot get campaign user details', status: 403, type:"Failure"})
                                }
                                let campaigndetails = {
                                    ...doc,
                                    user
                                }
                                return res.json({data:campaigndetails, status:200, type:"Success"})
                            },
                            err => {
                                return res.json({message: 'Cannot get campaign user details', status: 403, type:"Failure"})
                            }
                        )
                    }else {
                        return res.json({data:doc, status:200, type:"Success"})
                    }
                },
                err => {
                    return res.json({message:`can't get campaign details`, status:400, type:"Failure"})
                }
            )
        }
    )
        
    router.post('/addImages/:campaignId',
        verify,
        upload.any(),
        (req, res) => {
            const {user} = req;
            const campaignId = req.params.campaignId;
            let imagesArray =[];
            if(req.files.length) {
                for(let i=0;i<req.files.length;i++) {
                    imagesArray.push(req.files[i].filename);
                }
            }
            if(!imagesArray.length) {
                return res.json({message:'No files uploaded', status:400, type:'Failure'})
            }
            Campaign.findByIdAndUpdate(campaignId,{ $push : { images : { $each : imagesArray } } })
            .then(result=> {
                return res.json({data:imagesArray, status:200, type:'Success'})
            },
            err => {
                return res.json({message:'Cannot update the imges', status:400, type:'Failure'})
            })
        }
    )

    router.post('/deleteimgs/:campaignId',
        verify,
        (req, res) => {
            const { images } = req.body;
            if(!images || !images.length){
                return res.json({message: 'No images added to delete', status:400, type:'Failure'})
            }
            let {campaignId} = req.params;
            Campaign.findByIdAndUpdate(campaignId, {
                $pull: { images: { $in : images}   }
            })
            .then(
                result => {
                    return res.json({message: 'Images removed.', status: 200, type:'Success'})
                },
                err => {
                    return res.json({message: 'Cannot remove the images', status: 400, type:'Failure' })
                }
            )
        }
    )

    router.post('/addevent',
        verify,
        upload.single('eventimg'),
        (req, res) => {
            const { user } = req;
            const {
                title,
                description,
                id
            } = req.body;
            let tdate = new Date();
            let newEvent = new Event(
                {
                    title,
                    description,
                    campaign:id,
                    from:user.address
                }
            )
            if(req.file)
            newEvent.image = req.file.filename
            newEvent.save()
            .then(
                event => {
                    Campaign.findById(id)
                    .then(
                        camp => {
                            if(!camp) {
                                return res.json({message: "Cannpt add the event.", status:400, type:'Failure' })
                            }
                            camp.events.push(event)
                            camp.save()
                            .then(
                                camd => {
                                    return res.json({message:'Event added to the Campaign successfully.', status:200, type:'Success'})
                                },
                                err => {
                                    return res.json({message: "Cannpt add the event.", status:400, type:'Failure' })
                                }
                            )
                        },
                        err => {

                        }
                    )
                },
                err => {
                    return res.json({message: "Cannpt add the event.", status:400, type:'Failure' })
                }
            )
        }
    )
}