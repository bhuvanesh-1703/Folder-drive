const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');

exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields (name, email, password)' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({success:false, message: 'User already exists with this email'});
        }

        user = new User({
            name,
            email,
            password
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            success:true, message:"User registered successfully",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Registration Error:', err.message);
        res.status(500).json({ success:false, message: 'Server error during registration',error:err });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success:false,message: 'Please enter both email and password' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success:false,message: 'User does not exist' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success:false,message: 'Invalid credentials (wrong password)' });
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ success:false,message: 'Server error during login',error:err });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user).select('-password');
        res.json(user);
    } catch (err) {
        console.error('Get User Profile Error:', err.message);
        res.status(500).json({ success:true,message: 'Server error fetching user details',error:err });
    }
};
