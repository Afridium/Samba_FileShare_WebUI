const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const smbClient = require('./smbClient');
const port = process.env.PORT || 5000;
const os = require('os');


function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const CURRENT_IP = getLocalIp();

const app = express();
app.use(cors({
    origin: '*', // Allows your phone to connect
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

//loading existing files
app.get('/files', (req, res) => {
    const directory = req.query.path || '';

    smbClient.readdir(directory, (err, files) => {
        if (err) return res.status(500).send(err);

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
                        isFolder: stats.isDirectory(),
                        mtime: stats.mtime
                    });
                }

                pending--;
                if (pending === 0) {
                    //THE SORTING LOGIC
                    result.sort((a, b) => {
                        return new Date(b.mtime) - new Date(a.mtime);
                    });

                    res.json(result);
                }
            });
        });
    });
});

//downloading
app.get('/download', (req, res) => {
    
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


//uploading
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(500).send({ error: "No file was uploaded!" });
    }
    const parsedFile = path.parse(req.file.originalname);
    const uniqueFileName = `${parsedFile.name}_${Date.now()}${parsedFile.ext}`;
    const targetDir = req.query.path || '';
    const targetPath = targetDir == '' ? uniqueFileName : `${targetDir}\\${uniqueFileName}`;

    console.log(`Uploading ${req.file.originalname} to ${targetPath}...`);

    //Read the temp file into memory
    fs.readFile(req.file.path, (readErr, data) => {
        if (readErr) {
            console.error("Local read error:", readErr);
            fs.unlinkSync(req.file.path);
            return res.status(500).send({ error: "Could not process file locally." });
        }

        //Write the entire file directly to Samba in one go
        smbClient.writeFile(targetPath, data, (writeErr) => {
            // Always clean up the local temp file when done
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            // Handle Errors
            if (writeErr) {
                // Handle actual duplicate files
                if (writeErr.code === 'STATUS_OBJECT_NAME_COLLISION') {
                    return res.status(400).send({ error: "File already exists!" });
                }

                // INTERCEPT AND IGNORE THE FAKE ERROR
                if (writeErr.code === 'STATUS_PENDING') {
                    console.log(`Upload finished in background (Ignored STATUS_PENDING): ${uniqueFileName}`);
                    // Tell the frontend it was a success!
                    return res.send({ message: "Upload Succeed" });
                }

                //Handle actual real crashes
                console.error("Samba write error:", writeErr);
                return res.status(500).send({ error: "Failed to save file to Samba." });
            }

            // Normal Success
            console.log(`Upload Successful: ${uniqueFileName}`);
            res.send({ message: "Upload Succeed" });
        });
    });
});
//delete


app.delete('/delete', (req, res) => {
    const filePath = req.query.path;
    const isFolder = req.query.isFolder === 'true';

    if (!filePath) return res.status(400).send({ error: "no filepath was found" });

    // Internal helper for retrying
    const attemptDelete = (retriesLeft) => {
        const action = isFolder ? smbClient.rmdir : smbClient.unlink;

        action.call(smbClient, filePath, (err) => {
            if (err) {
                // If it's a sharing violation, wait 300ms and try again
                if (err.code === 'STATUS_SHARING_VIOLATION' && retriesLeft > 0) {
                    console.log(`Lock detected on ${filePath}. Retrying... (${retriesLeft} attempts left)`);
                    return setTimeout(() => attemptDelete(retriesLeft - 1), 300);
                }

                console.error("Delete failed:", err);
                return res.status(500).send({ error: "Deletion failed after retries", details: err.code });
            }
            
            res.send({ message: isFolder ? "Folder deleted!" : "File deleted!" });
        });
    };

    attemptDelete(5); // Try 5 times before giving up
});
app.listen(port, '0.0.0.0', () => {
    console.log(`-----------------------------------------`);
    console.log(`Server is running!`);
    console.log(`Local:   http://localhost:5000`);
    console.log(`Network: http://${CURRENT_IP}:5000`);
    console.log(`-----------------------------------------`);
});