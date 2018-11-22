var contractAddress = "0x9a4318CB1AAeb30d767398a6e2F44dD44Cd8B8c9"
var abiDefinition = [
	{
		"constant": true,
		"inputs": [
			{
				"name": "_key",
				"type": "bytes24"
			}
		],
		"name": "verifyData",
		"outputs": [
			{
				"name": "",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "_key",
				"type": "bytes24"
			},
			{
				"name": "_owner",
				"type": "address"
			},
			{
				"name": "_doctype",
				"type": "string"
			},
			{
				"name": "_dochash",
				"type": "string"
			}
		],
		"name": "enterStructData",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "bytes24"
			}
		],
		"name": "myStructs",
		"outputs": [
			{
				"name": "owner",
				"type": "address"
			},
			{
				"name": "doctype",
				"type": "string"
			},
			{
				"name": "dochash",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_key",
				"type": "bytes24"
			}
		],
		"name": "readStructData",
		"outputs": [
			{
				"name": "",
				"type": "address"
			},
			{
				"name": "",
				"type": "string"
			},
			{
				"name": "",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	}
]

Web3 = require('web3')
web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/4vsHVZygsQz7d5rxTVqG")); 
var smartContract = web3.eth.contract(abiDefinition).at(contractAddress);
                                        
var doc_no = '410e4490-ed54-11e8-b0b9-6d36c4484f70'.trim();


var key = require('crypto').createHash('md5').update(doc_no).digest("hex") 
var dataHash = smartContract.verifyData(key);
console.log(dataHash);