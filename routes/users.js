const express = require('express');
const router = express.Router();
const auth = require('../apis/auth');

router.use(require('cookie-parser')());
router.use(express.json());

router.get('/user', (req, res) => {
    if (req.user) {
        res.json(req.user);
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

router.post('/login', (req, res) => {
    var { username, password } = req.body;
    auth.loginUser(username, password).then(result => {
        if (result.success) {
            res.cookie('auth', result.auth, {
                httpOnly: true
            });
            res.json({ success: true });
        } else {
            res.json({ success: false, message: result.message });
        }
    });
});

router.get('/logout', (req, res) => {
    auth.logoutUser(req.cookies.auth);
    res.clearCookie('auth');
    res.redirect('/login');
});

module.exports = router;