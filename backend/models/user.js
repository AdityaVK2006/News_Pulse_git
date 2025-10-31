const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    categories: [{
        type: String,
        trim: true
    }],
    emailNotifications: {
        type: Boolean,
        default: true
    },
    preferences: {
        darkMode: {
            type: Boolean,
            default: false
        },
        emailFrequency: {
            type: String,
            enum: ['daily', 'weekly', 'never'],
            default: 'daily'
        },
        language: {
            type: String,
            default: 'en'
        },
        newsCount: {
            type: Number,
            default: 5,
            min: 1,
            max: 20
        }
    },
    bookmarks: [{
        title: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        description: String,
        imageUrl: String,
        source: String,
        publishedAt: Date,
        addedAt: {
            type: Date,
            default: Date.now
        }
    }]
});

// Add timestamps for createdAt and updatedAt
userSchema.set('timestamps', true);

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

// Generate auth token method
userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { _id: this._id.toString() },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
    );
};

// Compare password method
userSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

// Generate auth token
userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign(
        { _id: this._id.toString() },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
    );
    return token;
};

// Check password
userSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
};


const User = mongoose.model('User', userSchema);

module.exports = User;