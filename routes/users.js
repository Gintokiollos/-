const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const dbConfig = require('../config/db');
const { authenticateToken } = require('./auth');

// 创建数据库连接
/**
 * 创建并返回数据库连接
 * @returns {mysql.Connection} 数据库连接对象
 */
function createConnection() {
    return mysql.createConnection(dbConfig);
}

// 查询用户
/**
 * 查询用户信息，根据查询参数 `openid` 来筛选用户
 * @name GET /users
 * @function
 * @memberof module:routes/users
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 * @param {string} [req.query.openid] - 用户的 openid，用于筛选特定用户
 */
router.get('/', authenticateToken, function (req, res, next) {
    const connection = createConnection();
    connection.connect();

    const openid = req.query.openid;
    let query = 'SELECT * FROM users';
    const values = [];

    if (openid) {
        query += ' WHERE openid = ?';
        values.push(openid);
    }

    connection.query(query, values, function (error, results) {
        if (error) {
            console.error('Error fetching users:', error);
            res.status(500).send({ message: 'Error fetching users', error });
            connection.end();
            return;
        }
        res.json(results);
        connection.end();
    });
});

// 添加用户
/**
 * 添加新的用户
 * @name POST /users
 * @function
 * @memberof module:routes/users
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 * @param {Object} req.body - 请求体数据
 * @param {string} req.body.openid - 用户的 openid
 * @param {string} [req.body.avatar_url] - 用户的头像 URL
 * @param {string} [req.body.nickname] - 用户的昵称
 * @param {string} [req.body.phone] - 用户的电话
 * @param {string} [req.body.shop_info] - 用户的商店信息
 */
router.post('/', authenticateToken, function (req, res, next) {
    const { openid, avatar_url, nickname, phone, shop_info } = req.body;

    const connection = createConnection();
    connection.connect();

    const query = 'INSERT INTO users (openid, avatar_url, nickname, phone, shop_info) VALUES (?, ?, ?, ?, ?)';
    const values = [openid, avatar_url, nickname, phone, shop_info];

    connection.query(query, values, function (error, results) {
        if (error) {
            console.error('Error adding user:', error);
            res.status(500).send({ message: 'Error adding user', error });
            connection.end();
            return;
        }
        res.json({ id: results.insertId, message: 'User added successfully' });
        connection.end();
    });
});

// 更新用户信息
/**
 * 更新用户信息，根据请求体中的字段更新用户数据
 * @name PUT /users
 * @function
 * @memberof module:routes/users
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 * @param {Object} req.body - 请求体数据
 * @param {string} req.body.openid - 用户的 openid，指定要更新的用户
 * @param {string} [req.body.avatar_url] - 新的头像 URL
 * @param {string} [req.body.nickname] - 新的昵称
 * @param {string} [req.body.phone] - 新的电话
 * @param {string} [req.body.shop_info] - 新的商店信息
 */
router.put('/', authenticateToken, function (req, res, next) {
    const { openid, avatar_url, nickname, phone, shop_info } = req.body;

    const connection = createConnection();
    connection.connect();

    let query = 'UPDATE users SET';
    const values = [];
    const updates = [];

    if (avatar_url !== undefined) {
        updates.push('avatar_url = ?');
        values.push(avatar_url);
    }

    if (nickname !== undefined) {
        updates.push('nickname = ?');
        values.push(nickname);
    }

    if (phone !== undefined) {
        updates.push('phone = ?');
        values.push(phone);
    }

    if (shop_info !== undefined) {
        updates.push('shop_info = ?');
        values.push(shop_info);
    }

    if (updates.length === 0) {
        res.status(400).json({ message: 'No fields to update' });
        connection.end();
        return;
    }

    query += ` ${updates.join(', ')}, updated_at = NOW() WHERE openid = ?`;
    values.push(openid);

    connection.query(query, values, function (error, results) {
        if (error) {
            console.error('Error updating user:', error);
            res.status(500).send({ message: 'Error updating user', error });
            connection.end();
            return;
        }
        res.json({ message: 'User updated successfully' });
        connection.end();
    });
});

// 删除用户
/**
 * 删除指定用户
 * @name DELETE /users
 * @function
 * @memberof module:routes/users
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 * @param {Object} req.body - 请求体数据
 * @param {string} req.body.openid - 用户的 openid，用于删除用户
 */
router.delete('/', authenticateToken, function (req, res, next) {
    const { openid } = req.body;

    const connection = createConnection();
    connection.connect();

    const query = 'DELETE FROM users WHERE openid = ?';
    const values = [openid];

    connection.query(query, values, function (error, results) {
        if (error) {
            console.error('Error deleting user:', error);
            res.status(500).send({ message: 'Error deleting user', error });
            connection.end();
            return;
        }
        res.json({ message: 'User deleted successfully' });
        connection.end();
    });
});

module.exports = router;
