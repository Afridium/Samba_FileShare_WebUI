const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const smbClient = require('./smbClient');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({dest: 'uploads/'});

