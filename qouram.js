
 Web3 = require('web3')

 let USER = "u0kecqp66h";
 let PASS = "lvrtLi0iXrUd8V7zCwyl7AiNiOoPwiz3ZaDz05WjCe0";
 let RPC_ENDPOINT = "u0axpwa7cm-u0ik0mfj0o-rpc.us-east-2.kaleido.io";
 let url ="https://" + USER + ":" + PASS + "@" + RPC_ENDPOINT;
 console.log("url", url)
 web3 = new Web3(new Web3.providers.HttpProvider(url));
 console.log("web3",  web3._requestManager.provider.user)
 web3._requestManager.provider.user = USER
 web3._requestManager.provider.password = PASS
 const Tx = require('ethereumjs-tx');
 web3.eth.getBlock("latest", function(err, res) {
     console.log("err", err, res)
 })
// var sender = "0x7dDF0ECE39A7d18AB1E95DEc8997D6361B87155b";

// var reciver ="0x57147417854afe512a333AA7fE3d757Bff8e1488";
// var privatekey = "640E4055170D9FF2B503CC1B1CF3A21C7BEF53809D61062387DA0BBD720DFC80"


// console.log(web3.eth.getTransactionCount(sender))
// var secret = new Buffer(privatekey, 'hex');
// var transArray = []
    
//        var rawTransaction = {  
//         "nonce":web3.toHex(web3.eth.getTransactionCount(sender)),
//         "gasPrice":0, 
//         "gasLimit":"0xdac0",
//         "to":reciver,
//         "value":1,
//         data:'0x',
//         privateFor:["0x69F1C363e34Ad4A4D29A5eef2cd87348A5314f7f"]
//     }
//     var tx = new Tx(rawTransaction);
//     tx.sign(secret);
//     var serializedTx = tx.serialize();
//     var sendString = serializedTx.toString('hex');
//     web3.eth.sendRawTransaction(`0x${sendString}`,function(err,result){
//         if(!err){
//             var txhas = result;
//             console.log({status:'Success',recepit:result})
//         }else{
//             console.log("err",err)
//             console.log({status:'Failure',recepit:null})
//         }
//     })



