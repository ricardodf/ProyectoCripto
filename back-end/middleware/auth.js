const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const token = req.header('auth-token');

        if(!token)
            return res.status(401).json({msg: 'No authentication token'})
        
        const verified = jwt.verify(token, process.env.SECRET);
        if(!verified)
            return res.status(401).json({msg: 'Invalid token'})
        
        req.user = verified.id;
        next();
    } catch(err) {
        res.status(500).json({ error: err.message })
    }
}

module.exports = auth;