const web3 = require('web3');
let web3Instance;

module.exports = function getTnstance(provider){
    const httpProv = new web3.providers.HttpProvider(provider);
    if(web3Instance){
        return web3Instance;
    }
    if(!provider){
        throw 'Ethereum provider expected';
    }else{
        web3Instance = new web3(httpProv);
        return web3Instance;
    }
}