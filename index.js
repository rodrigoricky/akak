require('dotenv').config();
const express = require('express');
const app = express();
require('express-ws')(app);

const auth = require('./apis/auth');
const gateway = require('./routes/gateway');

// Middlewares
app.use(require('cookie-parser')());
app.use(express.static(__dirname + '/public'));
app.use(express.json());
// Authentication
app.use(async function (req, res, next) {
    // Allow files using regex: /{img,css,js,fonts}/*.{png,jpg,css,js,ttf}
    if (req.path.match(/\/(img|css|js|fonts)\/.*\.(png|jpg|css|js|ttf)/)) {
        next();
        return
    }

    // Check if the user is logged in
    var user = auth.getUser(req.cookies?.auth);

    // Let people login
    if ((req.path === '/login' || req.path === '/api/login') && !user) {
        next();
        return;
    }

    if (user) {
        req.user = user;
        next();
    } else {
        // Either the user is not logged in or the authentication token is invalid
        if (req.path.startsWith('/api')) {
            res.status(401).json({ error: 'Unauthorized' });
        } else {
            res.redirect('/login');
        }
    }
});
// Routes
app.use('/api', require('./routes/users'));
app.ws('/api/gateway', gateway);

app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/login', (req, res) => {
    console.log(req.user);
    if (req.user) {
        res.redirect('/home');
    } else {
        var loginHTML = require("fs").readFileSync(__dirname + '/src/login.html', 'utf8');
        loginHTML = require('html-minifier').minify(loginHTML, {
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true
        });
        res.send(loginHTML);
    }
});

app.get('/*', (req, res) => {
    var validPaths = ['/home', '/students', '/vouchers', '/balance', '/parents', '/payments', '/allocations', '/payables', '/print', '/users'];
    if (!validPaths.includes(req.path)) {
        res.status(404).send('404 Not Found');
    } else {
        res.sendFile(__dirname + '/src/home.html');
    }
});

app.listen(80, () => {
    console.log('Server is running at 192.168.1.10');
});

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', function (err) {
    console.log('Caught exception:', err);
});
