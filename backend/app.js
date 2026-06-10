const express = require("express");
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const app = express();

const cors = require('cors');
const PORT = process.env.PORT || 5100;

app.use(express.json());
app.use(cors());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const connectDB = () => {
    const maskedUri = process.env.MONGO_URI ? process.env.MONGO_URI.replace(/:([^@]+)@/, ':****@') : 'undefined';
    console.log('Connecting to:', maskedUri);
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log(' MongoDB Connected'))
        .catch(err => console.log('mongo db connection failed:', err));
}

connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});