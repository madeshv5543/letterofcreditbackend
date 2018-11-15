const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    email: {
        type: String,
        unique:true
    },
    username: {
        type:String
    },
    firstName: {
        type:String
    },
    lastName: {
        type:String
    },
    password: {
        type:String
    },
    country: {
        type:String
    },
    city: {
        type:String
    },
    companyName : {
        type:String
    },
    accountType: {
        type: String
    },
    filename1: {
        type: String
    },
    filename2: {
        type: String
    },
    pincode : {
        type: String
    },
    physicaladdress: {
        type: String
    },
    phoneNumber: {
        type:String
    },
    seed: {
        type:String
    },
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);

/**
 * Compare the passed password with the value in the database. A model method.
 *
 * @param {string} password
 * @returns {object} callback
 */
userSchema.methods.comparePassword = function comparePassword(password, callback) {
    bcrypt.compare(password, this.password, callback);
};


/**
 * The pre-save hook method.
 */
userSchema.pre('save',function(next) {
    const user = this;

    // proceed further only if the password is modified or the user is new
    if (!user.isModified('password')) return next();


    return bcrypt.genSalt((saltError, salt) => {
        if (saltError) { return next(saltError); }

        return bcrypt.hash(user.password, salt, (hashError, hash) => {
            if (hashError) { return next(hashError); }

            // replace a password string with hash value
            user.password = hash;

            return next();
        });
    });
});