const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const User = require('../models/userModel');
const Logger = require('../models/loggerModel');
const auth = require('../middleware/auth');

router.post('/register', async (req, res) => {
    try{
        let { email, password, passwordCheck, displayName } = req.body;
        // Validations
        if(!email || !password || !passwordCheck)
            return res.status(400).json({msg: 'Incomplete register form'});
        if(password.length < 5)
            return res.status(400).json({msg: 'Password need to be more than 5 char long'})
        if(password !== passwordCheck)
            return res.status(400).json({msg: 'Passwords do not match'})

        const existingUser = await User.findOne({email: email})
        if(existingUser)
            return res.status(400).json({ msg: 'Email already in use'});

        if(!displayName) displayName = email;

        // Password encryption
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);
        
        // Saved user
        const newUser = new User({
            email,
            password: passwordHash,
            displayName: displayName
        });
        const savedUser = await newUser.save();
        const newLog = new Logger({
            userID: savedUser._id,
            action: 'REGISTRATION',
            date: new Date()
        });
        const savedLog = await newLog.save();

        if (!fs.existsSync(`${process.env.PATH_DB}/db/${savedUser._id}`)){
            fs.mkdirSync(`${process.env.PATH_DB}/db/${savedUser._id}`);
            fs.mkdirSync(`${process.env.PATH_DB}/db/${savedUser._id}/uploads`);
            fs.mkdirSync(`${process.env.PATH_DB}/db/${savedUser._id}/signed`);
        }

        res.json(savedUser);
    } catch(err) {
        res.status(500).json({error: err.message});
    }
});

router.post('/login', async (req, res) => {
    try {
        let { email, password } = req.body;

        // Validate
        if(!email || !password)
            return res.status(400).json({msg: 'Incomplete login form'});
        
        const user = await User.findOne({email: email})
        if(!user)
            return res.status(400).json({ msg: 'No account found'});

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            const newLog = new Logger({
                userID: user._id,
                action: 'FAILED LOGIN',
                date: new Date()
            });
            const savedLog = await newLog.save();

            return res.status(400).json({ msg: 'Invalid credentials'});
        }
        
        const token = jwt.sign({ id: user._id }, process.env.SECRET);

        const newLog = new Logger({
            userID: user._id,
            action: 'LOGIN',
            date: new Date()
        });
        const savedLog = await newLog.save();

        res.json({token, user: {
            id: user._id,
            display: user.displayName
        }})

    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/tokenIsValid', async (req, res) => {
    try {
        const token = req.header('auth-token');
        if(!token)
            return res.json(false)

        const verified = jwt.verify(token, process.env.SECRET);
        if(!verified)
            return res.json(false)

        return res.json(true);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', auth, async (req, res) => {
    const user = await User.findById(req.user);
    res.json({
        displayName: user.displayName,
        id: user._id
    });
});

router.post('/2fa-login', async (req, res) => {
    const { userToken } = req.body;
    console.log(userToken);

    const secret = speakeasy.generateSecret({
        name: userToken
    })
    qrcode.toDataURL(secret.otpauth_url, (err, data) => {
        if(err)
            console.log(err);
        res.json({ secret: secret, qrcode: data });
    })
});

router.post('/2fa-verify', async (req, res) => {
    const { secret, tokenCode } = req.body;
    console.log(secret)
    console.log(tokenCode)

    try {
        const verify = speakeasy.totp.verify({
            secret: secret.ascii,
            encoding: 'ascii',
            token: tokenCode
        })
        console.log(verify);

        return res.json(verify);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;