const router = require('express').Router();
const crypto = require('crypto');
const fs = require('fs');
const qrcode = require('qrcode');

const auth = require('../middleware/auth')
const private_key = fs.readFileSync(`${process.env.PATH_DB}/keys/private.key`, 'utf-8');

const Logger = require('../models/loggerModel');

router.post('/upload', auth, async (req, res) => {
    if(req.files === null)
        return res.status(400).json({ msg: 'No file selected'})
    let prefix = ""
    if(req.user)
        prefix = req.user;
    const file = req.files.file;

    file.mv(`${process.env.PATH_DB}/db/${prefix}/uploads/${file.name}`, err => {
        if(err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.json({ fileName: file.name });
    })
});

router.post('/sign', auth, async (req, res) => {
    if(req.files === null)
        return res.status(400).json({ msg: 'No file selected'})
    let prefix = ""
    if(req.user)
        prefix = req.user;
    const file = req.files.file;
    const fileName = file.name.replace('.txt', '');
    
    const doc = fs.readFileSync(`${process.env.PATH_DB}/db/${prefix}/uploads/${file.name}`);

    const signer = crypto.createSign('RSA-SHA256');
    signer.write(doc);
    signer.end();

    const signature = signer.sign(private_key, 'base64')
    fs.writeFileSync(`${process.env.PATH_DB}/db/${prefix}/signed/${fileName}-signed.pem`, signature);

    const newLog = new Logger({
            userID: prefix,
            action: `${fileName} SIGNED`,
            date: new Date()
        });
    const savedLog = await newLog.save();

    try{
        const qrResponse = await qrcode.toDataURL(signature);
        fs.writeFileSync(`${process.env.PATH_DB}/db/${prefix}/qrcodes/${fileName}-qr.txt`, qrResponse);
        res.json({ fileName: file.name, qrcode: qrResponse });
    } catch(err){
        res.status(500).json({ error: err.message });
    }
});

router.post('/encrypt', auth, async (req, res) => {
    if(req.files === null)
        return res.status(400).json({ msg: 'No file selected'})
    let prefix = ""
    if(req.user)
        prefix = req.user;
    const file = req.files.file;
    const fileName = file.name.replace('.txt', '');

    const doc = fs.readFileSync(`${process.env.PATH_DB}/db/${prefix}/uploads/${file.name}`);

    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(String(prefix)).digest('base64').substr(0, 32);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const result = Buffer.concat([iv, cipher.update(doc), cipher.final()]);

    const newLog = new Logger({
            userID: prefix,
            action: `${fileName} ENCRYPTED`,
            date: new Date()
        });
    await newLog.save();

    fs.writeFileSync(`${process.env.PATH_DB}/db/${prefix}/encrypted/${fileName}-encrypted.enc`, result);
    res.json({ fileName: file.name });
});

router.post('/decrypt', auth, async (req, res) => {
    const { encryptedFilename } = req.body;
    let prefix = ""
    if(req.user)
        prefix = req.user;
    
    const key = crypto.createHash('sha256').update(String(prefix)).digest('base64').substr(0, 32);

    fs.readFile(`${process.env.PATH_DB}/db/${prefix}/encrypted/${encryptedFilename}`, (err, data) => {
        if(err) console.log(err);

        const iv = data.slice(0, 16);
        data = data.slice(16);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        const result = Buffer.concat([decipher.update(data), decipher.final()]);

        const newLog = new Logger({
            userID: prefix,
            action: `${encryptedFilename} DECRYPTED`,
            date: new Date()
        });
        newLog.save();

        res.json({ secret: result.toString()});
    });
});

router.get('/signed/all', auth, async (req, res) => {
    let prefix = ""
    if(req.user)
        prefix = req.user;
    
    var files = fs.readdirSync(`${process.env.PATH_DB}/db/${prefix}/qrcodes/`);

    let signedInfo = files.map( value => {
        const data = fs.readFileSync(`${process.env.PATH_DB}/db/${prefix}/qrcodes/${value}`, {encoding: 'utf-8'});
        var info = { name: value, qrcode: data, isHidden: true }
        return info
    })

    const newLog = new Logger({
        userID: prefix,
        action: `REQUEST: ALL SIGNED DOCS`,
        date: new Date()
    });
    await newLog.save();

    res.json(signedInfo)
})

router.get('/encrypted/all', auth, async (req, res) => {
    let prefix = ""
    if(req.user)
        prefix = req.user;
    
    var files = fs.readdirSync(`${process.env.PATH_DB}/db/${prefix}/encrypted/`);
    
    let encryptedInfo = files.map( value => {
        var info = { name: value }
        return info
    })

    const newLog = new Logger({
        userID: prefix,
        action: `REQUEST: ALL ENCRYPTED DOCS`,
        date: new Date()
    });
    await newLog.save();

    res.json(encryptedInfo)
})

module.exports = router;