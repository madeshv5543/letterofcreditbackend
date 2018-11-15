const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const encrypt = (algorithm, password, text) => {
    const cipher = crypto.createCipher(algorithm, password);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};

const decrypt = (algorithm, password, encrypted) => {
    const decipher = crypto.createDecipher(algorithm, password);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}



module.exports = {encrypt,decrypt};