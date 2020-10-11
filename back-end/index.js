const express = require('express');
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config()

// Express
const app = express();
app.use(express.json());
app.use(cors());
app.use(fileUpload());

const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log(`Running at port: ${PORT}`));

// Mongoose
mongoose.connect(process.env.MONGODB_CONNECTION_STRING, {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useCreateIndex: true
}, (err) => {
    if(err) throw err;
    console.log('MongoDB Connection')
});

// Routes
app.use('/users', require('./routes/userRouter'));
app.use('/doc', require('./routes/docRouter'));