require('dotenv').config();
const SMB2 = require("@marsaud/smb2");

const options = {
    share: process.env.SMB_SHARE,
    username: process.env.SMB_USER,
    password: process.env.SMB_PASS,
    domain: process.env.SMB_DOMAIN || 'WORKGROUP'
}

const smbclient = new SMB2(options)

module.exports = smbclient;