const hdkey = require('ethereumjs-wallet/hdkey');
const lightwallet = require("eth-lightwallet");

function getWallet(seed) {
    const keyFromSeed = hdkey.fromMasterSeed(seed);
    return keyFromSeed.getWallet();
}

function getWalletAddress(wallet, encode = 'hex') {
    return `0x${wallet.getAddress().toString(encode)}`;
}

function getWalletPublicKey(wallet, encode = 'hex') {
    return wallet.getPublicKey().toString(encode);
}

function getWalletPrivateKey(wallet, encode = 'hex') {
    return wallet.getPrivateKey().toString(encode);
}

function getWalletKeys(wallet) {
    return {
        public: getWalletPublicKey(wallet),
        private: getWalletPrivateKey(wallet)
    }
}

function createWallet() {
    const seed = lightwallet.keystore.generateRandomSeed();
    const wallet = getWallet(seed);
    return {
        seed,
        address: getWalletAddress(wallet),
        public: getWalletPublicKey(wallet),
        private: getWalletPrivateKey(wallet)
    };
}

module.exports = {
    getWallet,
    getWalletAddress,
    getWalletPublicKey,
    getWalletPrivateKey,
    getWalletKeys,
    createWallet
};
