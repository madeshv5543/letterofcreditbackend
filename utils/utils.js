const multer = require('multer');
let filepath = `public/img`;
const Storage = multer.diskStorage({
    destination: function (req, file, cb) {
     cb(null, filepath);
        },
     filename: function (req, file, cb) {
        var originalname = file.originalname;
        var extension = originalname.split(".");
        filename = 'img'+Date.now() + '.' + extension[extension.length-1];
        cb(null, filename);
      }
    });
const upload = multer({storage:Storage })
module.exports = upload;