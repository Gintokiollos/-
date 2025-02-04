const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const dbConfig = require('../config/db');
const { authenticateToken } = require('./auth'); // 认证中间件

/**
 * 创建数据库连接
 * @returns {mysql.Connection} 数据库连接对象
 */
function createConnection() {
    return mysql.createConnection(dbConfig);
}

/**
 * 获取所有店铺
 * @name GET /shops
 * @function
 * @memberof module:routes/shops
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 */
router.get('/', authenticateToken, (req, res) => {
    const connection = createConnection();
    connection.connect();

    const query = 'SELECT * FROM shop';
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching shops:', error);
            res.status(500).send({ message: 'Error fetching shops', error });
            connection.end();
            return;
        }
        res.json(results);
        connection.end();
    });
});

/**
 * 获取当前用户的店铺
 * @name GET /shops/token
 * @function
 * @memberof module:routes/shops
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 * @param {string} req.user.id - 从 JWT 中获取的用户 ID
 */
router.get('/token', authenticateToken, (req, res) => {
    const user_id = req.user.id; // 从 JWT 中获取用户 ID
    const connection = createConnection();
    connection.connect();

    const query = 'SELECT * FROM shop WHERE user_id = ?';
    connection.query(query, [user_id], (error, results) => {
        if (error) {
            console.error('Error fetching shop:', error);
            res.status(500).send({ message: 'Error fetching shop', error });
            connection.end();
            return;
        }
        if (results.length > 0) {
            results[0].label = JSON.parse(results[0].label);
            results[0].img = JSON.parse(results[0].img);
            res.json(results[0]);
        } else {
            res.status(404).send({ message: 'Shop not found' });
        }
        connection.end();
    });
});

/**
 * 根据 ID 获取单个店铺
 * @name GET /shops/:id
 * @function
 * @memberof module:routes/shops
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 * @param {string} req.params.id - 店铺的 ID
 */
router.get('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const connection = createConnection();
    connection.connect();

    const query = 'SELECT * FROM shop WHERE id = ?';
    connection.query(query, [id], (error, results) => {
        if (error) {
            console.error('Error fetching shop:', error);
            res.status(500).send({ message: 'Error fetching shop', error });
            connection.end();
            return;
        }
        if (results.length > 0) {
            results[0].label = JSON.parse(results[0].label);
            results[0].img = JSON.parse(results[0].img);
            res.json(results[0]);
        } else {
            res.status(404).send({ message: 'Shop not found' });
        }
        connection.end();
    });
});

/**
 * 创建店铺
 * @name POST /shops
 * @function
 * @memberof module:routes/shops
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 * @param {Object} req.body - 店铺数据
 * @param {string} req.body.name - 店铺名称
 * @param {string} req.body.phone - 店铺电话
 * @param {string} req.body.intro - 店铺简介
 * @param {string} req.body.logo - 店铺 Logo
 * @param {string} req.body.img - 店铺图片
 * @param {string} req.body.label - 店铺标签
 * @param {string} req.body.create_by - 创建者
 * @param {string} [req.body.remark] - 备注
 */
router.post('/', authenticateToken, (req, res) => {
    const user_id = req.user.id; // 从 JWT 中获取用户 ID
    const { name, phone, intro, logo, img, label, create_by, remark } = req.body;
    const connection = createConnection();
    connection.connect();

    const query = `INSERT INTO shop (user_id, name, phone, intro, logo, img, label, create_by, create_time, update_by, update_time, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, NOW(), ?)`;
    const values = [user_id, name, phone, intro, logo, img, label, create_by, remark];

    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error creating shop:', error);
            res.status(500).send({ message: 'Error creating shop', error });
            connection.end();
            return;
        }

        const query2 = 'SELECT * FROM shop WHERE id = ?';
        connection.query(query2, [results.insertId], (error, results) => {
            if (error) {
                console.error('Error fetching shop:', error);
                res.status(500).send({ message: 'Error fetching shop', error });
                connection.end();
                return;
            }
            if (results.length > 0) {
                results[0].label = JSON.parse(results[0].label);
                results[0].img = JSON.parse(results[0].img);
                res.status(200).json(results[0]);
            } else {
                res.status(404).send({ message: 'Shop not found' });
            }
            connection.end();
        });
    });
});

/**
 * 更新店铺
 * @name PUT /shops/:id
 * @function
 * @memberof module:routes/shops
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 * @param {string} req.params.id - 店铺的 ID
 * @param {Object} req.body - 更新的数据
 * @param {string} [req.body.name] - 店铺名称
 * @param {string} [req.body.phone] - 店铺电话
 * @param {string} [req.body.intro] - 店铺简介
 * @param {string} [req.body.logo] - 店铺 Logo
 * @param {string} [req.body.img] - 店铺图片
 * @param {string} [req.body.label] - 店铺标签
 * @param {string} [req.body.update_by] - 更新者
 * @param {string} [req.body.remark] - 备注
 */
router.put('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, phone, intro, logo, img, label, update_by, remark } = req.body;
    const connection = createConnection();
    connection.connect();

    // 生成更新的字段及其值
    let fieldsToUpdate = [];
    let values = [];

    if (name !== undefined) {
        fieldsToUpdate.push('name = ?');
        values.push(name);
    }
    if (phone !== undefined) {
        fieldsToUpdate.push('phone = ?');
        values.push(phone);
    }
    if (intro !== undefined) {
        fieldsToUpdate.push('intro = ?');
        values.push(intro);
    }
    if (logo !== undefined) {
        fieldsToUpdate.push('logo = ?');
        values.push(logo);
    }
    if (img !== undefined) {
        fieldsToUpdate.push('img = ?');
        values.push(img);
    }
    if (label !== undefined) {
        fieldsToUpdate.push('label = ?');
        values.push(label);
    }
    if (update_by !== undefined) {
        fieldsToUpdate.push('update_by = ?');
        values.push(update_by);
    }
    if (remark !== undefined) {
        fieldsToUpdate.push('remark = ?');
        values.push(remark);
    }

    // 如果没有字段需要更新，直接返回
    if (fieldsToUpdate.length === 0) {
        res.status(400).send({ message: 'No fields to update' });
        connection.end();
        return;
    }

    // 添加 update_time 字段
    fieldsToUpdate.push('update_time = NOW()');
    values.push(id);

    const query = `UPDATE shop SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error updating shop:', error);
            res.status(500).send({ message: 'Error updating shop', error });
            connection.end();
            return;
        }
        const query2 = 'SELECT * FROM shop WHERE id = ?';
        connection.query(query2, [id], (error, results) => {
            if (error) {
                console.error('Error fetching shop:', error);
                res.status(500).send({ message: 'Error fetching shop', error });
                connection.end();
                return;
            }
            if (results.length > 0) {
                results[0].label = JSON.parse(results[0].label);
                results[0].img = JSON.parse(results[0].img);
                res.status(200).json(results[0]);
            } else {
                res.status(404).send({ message: 'Shop not found' });
            }
            connection.end();
        });
    });
});

/**
 * 删除店铺
 * @name DELETE /shops/:id
 * @function
 * @memberof module:routes/shops
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 * @param {string} req.params.id - 店铺的 ID
 */
router.delete('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const connection = createConnection();
    connection.connect();

    const query = 'DELETE FROM shop WHERE id = ?';
    connection.query(query, [id], (error, results) => {
        if (error) {
            console.error('Error deleting shop:', error);
            res.status(500).send({ message: 'Error deleting shop', error });
            connection.end();
            return;
        }
        if (results.affectedRows > 0) {
            res.send({ message: 'Shop deleted successfully' });
        } else {
            res.status(404).send({ message: 'Shop not found' });
        }
        connection.end();
    });
});

module.exports = router;
