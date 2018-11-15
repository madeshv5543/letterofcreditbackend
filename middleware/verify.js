var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const config = require('config'); // get our config file

function verifyCampainer( req, res, next) {
  // check header or url parameters or post parameters for token
  var token = req.headers['x-access-token'];
  if (!token)
    return res.status(403).send({ auth: false, message: 'No token provided.' });
  // verifies secret and checks exp
  jwt.verify(token, config.secret, function(err, decoded) {      
    if (err) 
      return res.status(403).send({ auth: false, message: 'Failed to authenticate token.' });    
    // if everything is good, save to request for use in other routes
    req.user = decoded;
    next();
  });

}

function verifySponser( req, res, next) {
  // check header or url parameters or post parameters for token
  var token = req.headers['x-access-token'];
  if (!token)
    return res.status(403).send({ auth: false, message: 'Not authorized . Confirm that your account is login.' });
  // verifies secret and checks exp
  jwt.verify(token, config.secret, function(err, decoded) {      
    if (err) 
      return res.status(403).send({ auth: false, message: 'Access token expired. Please Login' });    
    // if everything is good, save to request for use in other routes
    req.user = decoded;
    next();
  });

}

function verifyToken( req, res, next) {
  // check header or url parameters or post parameters for token
  var token = req.headers['x-access-token'];
  if (!token)
    return res.status(403).send({ auth: false, message: 'Not authorized . Confirm that your account is login.' });
  // verifies secret and checks exp
  jwt.verify(token, config.secret, function(err, decoded) {      
    if (err) 
      return res.status(403).send({ auth: false, message: 'Access token expired. Please Login' });    
    // if everything is good, save to request for use in other routes
    req.user = decoded;
    next();
  });


}
module.exports = verifyToken
// module.exports = {
//   verifyToken,
//   verifyCampainer,
//   verifySponser
// }