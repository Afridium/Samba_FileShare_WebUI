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

const upload = multer({ dest: 'uploads/' });

//loading existing files
app.get('/files', (req, res) => {
    const directory = req.query.path || '';

    smbClient.readdir(directory, (err, files) => {
        if (err) return res.status(500).send(err);
        console.log(files);

        let result = [];

        if (!files || files.length == 0) return res.json([]);
        let pending = files.length;
        if (!pending) return res.json([]);

        files.forEach(file => {
            const filepath = directory == '' ? file : `${directory}\\${file}`;
            smbClient.stat(filepath, (err, stats) => {
                if (err) {
                    console.error(`Error reading stats for ${file}: `, err);
                } else {
                    result.push({
                        name: file,
                        isFolder: stats.isDirectory()
                    });
                }

                pending--;
                if (!pending) res.json(result);
            });
        });
    });
});

//downloading
app.get('/download', (req, res) => {
    /*
    Step1: get the file path
    Step2: extract file name from the path using split for downloads
    Step3: tell the browser to download the file instead of displaying it
    step4: ask smb client to open a read stream
    step5: pipe the sambas tream directly into the express response stream
    */
    const filePath = req.query.path; //step1
    if (!filePath) return res.status(500).send({ error: "File path is required" });

    const fileName = filePath.split('\\').pop(); //step2

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`); //step3

    //step4
    smbClient.createReadStream(filePath, (err, readStream) => {
        if (err) {
            console.log(`Error opening stream for ${filePath}`, err);
            return res.status(500).send({ error: "Could not download file" });
        }
        readStream.pipe(res); //step5

        readStream.on('end', () => console.log(`Finished downloading: ${fileName}`));
        readStream.on('error', (streamErr) => console.error(`Stream error:`, streamErr));
    })
})

//uploading
//we will use upload.single('file') to tell multer to look for an uploaded file named file
app.post('/upload', upload.single('file'), (req, res) => {
    /*
    step1: verify a file was actually uploaded
    step2: get the target directory on the samba share
    step3: read from the temporary file multer just created (req.file.path)
    step4: ask smb client to open a write stream
    */
    if (!req.file) {
        return res.status(500).send({ error: "No file was uploaded!" });
    } //step1

    //step2
    const targetDir = req.query.path || '';
    const targetPath = targetDir == '' ? req.file.originalname : `${targetDir}\\${req.file.originalname}`;

    console.log(`Uploading ${req.file.originalname} to ${targetPath}...`);

    //step3
    const localReadStream = fs.createReadStream(req.file.path);

    //step4
    smbClient.createWriteStream(targetPath, (err, smbWriteStream) => {
        if (err) {
            console.log(`Error creating stream: `, err);
            fs.unlinkSync(req.file.path);
            return res.status(500).send({ error: ' cannot upload the file' });
        }
        localReadStream.pipe(smbWriteStream);

        localReadStream.on('end', () => {
            console.log(`Upload Successful: ${req.file.originalname} `);
            fs.unlinkSync(req.file.path);
            res.send({ message: "Upload Succeed" });
        });
        localReadStream.on('error', (streamErr) => {
            console.error(`Error piping file:`, streamErr);
            fs.unlinkSync(req.file.path);
            res.status(500).send({ error: "Error transferring file" });
        });
    })

})

//delete
app.delete('/delete', (req, res) => {
    const filePath = req.query.path;
    const isFolder = req.query.isFolder === 'true';

    if (!filePath) {
        console.log("No file found");
        return res.status(500).send({ error: "no filepath was found" })
    }

    if (isFolder) {
        smbClient.rmdir(filePath, (err) => {
            if (err) {
                console.log("Cannot delete: ", err);
                return res.status(500).send({ error: "deletion failed" })
            }
            res.send({ message: "Folder deleted successfully!" });
        });

    } else {
        smbClient.unlink(filePath, (err) => {
            if (err) {
                console.log("Cannot delete: ", err);
                return res.status(500).send({ error: "deletion failed" })
            }
            res.send({ message: "File deleted successfully!" });
        })
    }
})
app.listen(port, () => {
    console.log(`Server is running at the port ${port}`);
})
