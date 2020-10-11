const router = require('express').Router();
const crypto = require('crypto');
const fs = require('fs');
const qrcode = require('qrcode');

const auth = require('../middleware/auth')
const private_key = fs.readFileSync(`${process.env.PATH_DB}/keys/private.key`, 'utf-8');

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

    try{
        const qrResponse = await qrcode.toDataURL(signature);
        res.json({ fileName: file.name, qrcode: qrResponse });
    } catch(err){
        res.status(500).json({ error: err.message });
    }
});

router.post('/encrypt', auth, (req, res) => {
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

    fs.writeFileSync(`${process.env.PATH_DB}/db/${prefix}/signed/${fileName}-encrypted.enc`, result);
    res.json({ fileName: file.name });
});

router.get('/sign/all', auth, (req, res) => {
    let prefix = ""
    if(req.user)
        prefix = req.user;
    
    var files = fs.readdirSync(`${process.env.PATH_DB}/db/${prefix}/signed/`);
    res.json({files})
})

module.exports = router;