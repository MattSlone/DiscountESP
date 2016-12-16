'use strict';

require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const router = require('./routes/index');
const users = require('./routes/users');

let app = express();
//'mongodb://localhost:27017/test' ||
mongoose.connect(
  process.env.DATABASE
);

app.set('views', path.resolve(__dirname, 'resources', 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.resolve(__dirname, 'public')));
app.use(express.static(path.resolve(__dirname, 'node_modules', 'validate-js')));
app.use('/enroll', express.static(path.resolve(__dirname, 'public')));
app.use('/enroll', express.static(path.resolve(__dirname, 'node_modules', 'validate-js')));

app.use(logger('short'));
app.use(bodyParser.urlencoded({ extended: false }));

/* ROUTERS */
app.use('/', router);
app.use('/users', users);

http.createServer(app).listen(process.env.PORT || 3000)
