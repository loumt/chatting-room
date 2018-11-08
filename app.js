const express = require('express');
const app = express();
const _ = require('lodash');
const expressWs = require('express-ws')(app);
const users = require('./config/user.config');

const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const version = require('./package.json').version;
var session = require('express-session');


//init connection
// let mqTool = require('./connects/mq.conn');
// let redisTool = require('./connects/redis.conn');
// let mysqlTool = require('./connects/mysql.conn');


// Promise.all([
    // mqTool.createValidate(),
    // redisTool.createValidate(),
    // mysqlTool.createValidate(version)
// ]).then((result) => {
//     console.dir(result);
// }).catch((error) => {
//     console.log(`Server Error : ${error.message}`);
//     throw new Error(crashMsg);
// })

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({secret: 'wilson',resave:true,saveUninitialized:true}));
app.use(express.static(path.join(__dirname, 'public')));

// app.all('*', function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", ['http://192.168.20.91:3005','http://192.168.16.3:3005']);
//     res.header("Access-Control-Allow-Headers", "X-Requested-With");
//     res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
//     res.header("X-Powered-By",' 3.2.1');
//     res.header("Content-Type", "application/json;charset=utf-8");
//     next();
// });

app.use(function (req, res, next) {
    req.testing = 'testing';
    next();
});

app.use('/csp/index',(req,res)=>{
    res.header('Content-Security-Policy',"default-src 'self'; frame-src 'self' blob:; script-src 'unsafe-inline' 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; object-src blob:; img-src 'self' data: http://192.168.20.91:3100; frame-ancestors http://192.168.20.91:3100")
  //http://192.168.20.91:3100 file://*
    res.render('home')
})

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
        ws.send(`M: ${message}`);
    });

    ws.on('close', () => {
        console.log('ws close');
    });
});

// error handler
app.use(function (err, req, res, next) {
    console.log(err)
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


module.exports = app;


