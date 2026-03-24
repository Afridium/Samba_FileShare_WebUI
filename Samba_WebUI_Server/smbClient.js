require('dotenv').config();
const { default: SMB2 } = require("@marsaud/smb2");

const smbclient = new SMB2({
    share: process.env.SMB_SHARE,
    domain: process.env.SMB_DOMAIN,
    username: process.env.SMB_USER,
    password: process.env.SMB_PASS
})

module.exports = smbclient;