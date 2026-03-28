const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const smbClient = require('./smbClient');
const port = process.env.PORT || 5000;



const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({dest: 'uploads/'});

app.get('/files', (req, res)=>{
    const directory = req.query.path || '';

    smbClient.readdir(directory, (err, files)=>{
        if (err) return res.status(500).send(err);
        console.log(files);

        let result = [];

        if (!files || files.length == 0) return res.json([]);
        let pending = files.length;
        if (!pending) return res.json([]);

        files.forEach(file => {
            const filepath = directory == '' ? file : `${directory}\\${file}`;
           smbClient.stat(filepath, (err,stats) => {
            if(err){
                console.error(`Error reading stats for ${file}: `, err);
            }else{
                result.push({
                name: file,
                isFolder: stats.isDirectory()
            });
            }
            
            pending--;
            if(!pending) res.json(result);
           }); 
        });
    });
});


app.listen(port, () => {
    console.log(`Server is running at the port ${port}`);
})
