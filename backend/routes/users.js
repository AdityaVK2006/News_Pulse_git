const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');

/* POST signup new user */
router.post('/signup', async (req, res) => {
  try {
    console.log('Signup request received:', req.body); // Debug log
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      console.log('Missing required fields'); // Debug log
      return res.status(400).json({ error: 'Please provide username, email and password' });
    }

    // Check password length
    if (password.length < 6) {
      console.log('Password too short'); // Debug log
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email },
        { username: username }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      categories: req.body.categories || [],
      emailNotifications: true
    });

    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        categories: user.categories
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error); // Debug log
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({ error: 'Database error. Please try again.' });
    }
    res.status(400).json({ error: error.message });
  }
});

/* GET user profile */
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            username: user.username,
            email: user.email,
            categories: user.categories,
            emailNotifications: user.emailNotifications,
            bookmarks: user.bookmarks
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* PUT update user profile */
router.put('/profile', auth, async (req, res) => {
    try {
        const updates = req.body;
        const user = await User.findById(req.user._id);

        // Handle password change
        if (updates.currentPassword && updates.newPassword) {
            const isMatch = await user.comparePassword(updates.currentPassword);
            if (!isMatch) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }
            user.password = updates.newPassword;
        }

        // Update other fields
        if (updates.username) user.username = updates.username;
        if (updates.email) user.email = updates.email;
        if (updates.categories) user.categories = updates.categories;
        if (typeof updates.emailNotifications === 'boolean') {
            user.emailNotifications = updates.emailNotifications;
        }

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                username: user.username,
                email: user.email,
                categories: user.categories,
                emailNotifications: user.emailNotifications
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/* POST user logout */
router.post('/logout', auth, async (req, res) => {
    try {
        // In a real application, you might want to invalidate the token here
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* GET user bookmarks */
router.get('/bookmarks', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            bookmarks: user.bookmarks
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* POST add bookmark */
router.post('/bookmarks', auth, async (req, res) => {
    try {
        const { title, url, description, imageUrl, source, publishedAt } = req.body;
        
        if (!title || !url) {
            return res.status(400).json({ error: 'Title and URL are required' });
        }

        const user = await User.findById(req.user._id);
        
        // Check if article is already bookmarked
        const isBookmarked = user.bookmarks.some(bookmark => bookmark.url === url);
        if (isBookmarked) {
            return res.status(400).json({ error: 'Article already bookmarked' });
        }

        user.bookmarks.push({
            title,
            url,
            description,
            imageUrl,
            source,
            publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
            addedAt: new Date()
        });

        await user.save();
        res.status(201).json({
            message: 'Bookmark added successfully',
            bookmark: user.bookmarks[user.bookmarks.length - 1]
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/* DELETE remove bookmark */
router.delete('/bookmarks/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const bookmarkIndex = user.bookmarks.findIndex(b => b._id.toString() === req.params.id);
        
        if (bookmarkIndex === -1) {
            return res.status(404).json({ error: 'Bookmark not found' });
        }

        user.bookmarks.splice(bookmarkIndex, 1);
        await user.save();
        
        res.json({ message: 'Bookmark removed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


/* POST add bookmark */
router.post('/bookmarks', auth, async (req, res) => {
    try {
        const { title, url, description, imageUrl, source, publishedAt } = req.body;

        if (!title || !url) {
            return res.status(400).json({ error: 'Title and URL are required' });
        }

        const newBookmark = {
            title,
            url,
            description,
            imageUrl,
            source,
            publishedAt: publishedAt ? new Date(publishedAt) : undefined
        };

        req.user.bookmarks.push(newBookmark);
        await req.user.save();

        res.status(201).json({
            message: 'Bookmark added successfully',
            bookmark: newBookmark
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/* DELETE bookmark */
router.delete('/bookmarks/:bookmarkId', auth, async (req, res) => {
    try {
        const bookmarkId = req.params.bookmarkId;
        req.user.bookmarks = req.user.bookmarks.filter(bookmark => 
            bookmark._id.toString() !== bookmarkId
        );
        await req.user.save();

        res.json({
            message: 'Bookmark removed successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* POST login user */
router.post('/login', async (req, res,next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user by email
    const foundUser = await User.findOne({ email });

    if (!foundUser) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await foundUser.comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = foundUser.generateAuthToken();

    res.json({
      message: 'Login successful',
      user: {
        id: foundUser._id,
        username: foundUser.username,
        email: foundUser.email,
        categories: foundUser.categories
      },
      token
    });

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email },
        { username: username }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists with this email or username' 
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      categories: categories || [] // if categories is not provided, default to empty array
    });

    // Save user to database
    await user.save();

    // Return success response
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        categories: user.categories
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
