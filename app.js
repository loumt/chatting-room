const express = require('express');
const app = express();
const _ = require('lodash');
const expressWs = require('express-ws')(app);
const users = require('./config/user.config');

const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
var session = require('express-session');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({secret: 'wilson'}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    console.log('middleware');
    req.testing = 'testing';
    return next();
});

app.use('/room/:userId', (req, res, next) => {
    let userId = req.params.userId;
    console.log(`get userId :${userId}`);
    let username = '';
    for (let user of users) {
        if (user.userId === parseInt(userId)) {
            console.log('login :' + user.username);
            username = user.username;
            req.session.user = user;
        }
    }
    res.render('index', {username: username});
})

app.ws('/ws', function (ws, req) {
    ws.on('open', () => {
        console.log('ws open');
    });
    ws.on('error', (err) => {
        console.log('ws err' + err);
    });

    ws.on('message', message => {
        console.log('Received -', message);
        ws.send(message);
    });

    ws.on('close', () => {
        console.log('ws close');
    });
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;


