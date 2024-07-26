const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const userRequestsRouter = require('./routes/user_requests');
const productRouter = require('./routes/product')
const categoryRouter = require('./routes/category')
const bannerRouter = require('./routes/banner')
const collectRouter = require('./routes/collect')
const shopRouter = require('./routes/shop')
const app = express();

// 设置视图引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter)
app.use('/users', usersRouter)
app.use('/auth', authRouter)
app.use('/user_requests', userRequestsRouter)
app.use('/product', productRouter)
app.use('/category', categoryRouter)
app.use('/banner', bannerRouter)
app.use('/user/product/collect', collectRouter)
app.use('/shop', shopRouter)

// 捕获404并转发到错误处理程序
app.use(function (req, res, next) {
    next(createError(404));
});

// 错误处理程序
app.use(function (err, req, res, next) {
    // 仅在开发环境提供错误信息
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // 渲染错误页面
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
