const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();
const config = require('../config/auth');
const mysql = require('mysql');
const dbConfig = require('../config/db');

const APPID = 'wxb7b8e368d642fd9a';
const SECRET = 'c7a377002b03f4f82cb1b54440932076';
const JWT_SECRET = config.jwt.JwtsecreyKey;

// 创建数据库连接
function createConnection() {
    return mysql.createConnection(dbConfig);
}

// 登录接口
router.post('/login', async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).send({ message: 'Code is required' });
    }

    try {
        const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
            params: {
                appid: APPID,
                secret: SECRET,
                js_code: code,
                grant_type: 'authorization_code'
            }
        });

        if (response.data.errcode) {
            console.error('Error fetching openid:', response.data.errmsg);
            return res.status(500).send({ message: 'Error fetching openid', error: response.data.errmsg });
        }

        const { openid, session_key } = response.data;

        // 创建数据库连接
        const connection = createConnection();
        connection.connect();

        // 查询用户是否存在
        const checkUserQuery = 'SELECT id FROM users WHERE openid = ?';
        connection.query(checkUserQuery, [openid], (error, results) => {
            if (error) {
                connection.end();
                return res.status(500).send({ message: 'Error checking user', error });
            }

            if (results.length > 0) {
                // 用户已存在
                const id = results[0].id;
                const token = jwt.sign({ openid, id }, JWT_SECRET, { expiresIn: config.jwt.expiresIn });
                connection.end();
                return res.send({ token, openid, id });
            }

            // 用户不存在，插入新用户
            const insertUserQuery = 'INSERT INTO users (openid, avatar_url, nickname, phone, shop_info) VALUES (?, ?, ?, ?, ?)';
            const values = [openid, '', '微信用户', '', ''];

            connection.query(insertUserQuery, values, (error, results) => {
                if (error) {
                    connection.end();
                    return res.status(500).send({ message: 'Error adding user', error });
                }

                // 获取新插入的用户 ID
                const id = results.insertId;
                const token = jwt.sign({ openid, id }, JWT_SECRET, { expiresIn: config.jwt.expiresIn });
                connection.end();
                res.send({ token, openid, id });
            });
        });
    } catch (error) {
        if (error.response) {
            console.error('Error response from WeChat API:', error.response.data);
            res.status(500).send({ message: 'Error logging in', error: error.response.data });
        } else {
            console.error('Error logging in:', error.message);
            res.status(500).send({ message: 'Error logging in', error: error.message });
        }
    }
});


// 中间件：验证Token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).send({message: '拒绝访问'});

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send({message: '令牌无效'});
        req.user = user;
        next();
    });
}

// 受保护的路由
router.get('/protected', authenticateToken, (req, res) => {
    res.send({message: '这是一条受保护的路由'});
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
