const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const dbConfig = require('../config/db');
const { authenticateToken } = require('./auth');

/**
 * 创建数据库连接
 * @returns {mysql.Connection} MySQL数据库连接实例
 */
function createConnection() {
    return mysql.createConnection(dbConfig);
}

/**
 * 获取所有 banners
 * @route GET /
 * @group Banners - Banner 操作
 * @security JWT
 * @param {string} req.headers.authorization - JWT token
 * @returns {Array.<object>} 200 - 成功获取 banners 列表
 * @returns {Error} 500 - 服务器错误
 */
router.get('/', authenticateToken, function (req, res, next) {
    const connection = createConnection();
    connection.connect();

    const query = 'SELECT * FROM `banners`';

    connection.query(query, function (error, results, fields) {
        if (error) {
            console.error('Error fetching banners:', error);
            res.status(500).send({ message: 'Error fetching banners', error });
            connection.end();
            return;
        }
        res.json(results);
        connection.end();
    });
});

/**
 * 获取指定 banner
 * @route GET /:id
 * @group Banners - Banner 操作
 * @security JWT
 * @param {string} req.headers.authorization - JWT token
 * @param {string} req.params.id - Banner ID
 * @returns {object} 200 - 成功获取指定 banner
 * @returns {Error} 404 - Banner not found
 * @returns {Error} 500 - 服务器错误
 */
router.get('/:id', authenticateToken, function (req, res, next) {
    const { id } = req.params;
    const connection = createConnection();
    connection.connect();

    const query = 'SELECT * FROM `banners` WHERE banner_id = ?';

    connection.query(query, [id], function (error, results, fields) {
        if (error) {
            console.error('Error fetching banner:', error);
            res.status(500).send({ message: 'Error fetching banner', error });
            connection.end();
            return;
        }

        if (results.length === 0) {
            res.status(404).send({ message: 'Banner not found' });
        } else {
            res.json(results[0]);
        }
        connection.end();
    });
});

/**
 * 创建新的 banner
 * @route POST /
 * @group Banners - Banner 操作
 * @security JWT
 * @param {string} req.headers.authorization - JWT token
 * @param {object} req.body - Banner 信息
 * @param {string} req.body.image_url - 图片 URL
 * @param {string} req.body.link - 链接
 * @returns {object} 201 - 成功创建 banner，返回新 banner 的 ID
 * @returns {Error} 500 - 服务器错误
 */
router.post('/', authenticateToken, function (req, res, next) {
    const { image_url, link } = req.body;
    const connection = createConnection();
    connection.connect();

    const query = 'INSERT INTO `banners` (image_url, link) VALUES (?, ?)';

    connection.query(query, [image_url, link], function (error, results, fields) {
        if (error) {
            console.error('Error creating banner:', error);
            res.status(500).send({ message: 'Error creating banner', error });
            connection.end();
            return;
        }
        res.status(201).json({ banner_id: results.insertId });
        connection.end();
    });
});

/**
 * 更新指定 banner
 * @route PUT /:id
 * @group Banners - Banner 操作
 * @security JWT
 * @param {string} req.headers.authorization - JWT token
 * @param {string} req.params.id - Banner ID
 * @param {object} req.body - 更新的 banner 信息
 * @param {string} req.body.image_url - 图片 URL
 * @param {string} req.body.link - 链接
 * @returns {object} 200 - 成功更新 banner
 * @returns {Error} 404 - Banner not found
 * @returns {Error} 500 - 服务器错误
 */
router.put('/:id', authenticateToken, function (req, res, next) {
    const { id } = req.params;
    const { image_url, link } = req.body;
    const connection = createConnection();
    connection.connect();

    const query = 'UPDATE `banners` SET image_url = ?, link = ? WHERE banner_id = ?';

    connection.query(query, [image_url, link, id], function (error, results, fields) {
        if (error) {
            console.error('Error updating banner:', error);
            res.status(500).send({ message: 'Error updating banner', error });
            connection.end();
            return;
        }

        if (results.affectedRows === 0) {
            res.status(404).send({ message: 'Banner not found' });
        } else {
            res.send({ message: 'Banner updated successfully' });
        }
        connection.end();
    });
});

/**
 * 删除指定 banner
 * @route DELETE /:id
 * @group Banners - Banner 操作
 * @security JWT
 * @param {string} req.headers.authorization - JWT token
 * @param {string} req.params.id - Banner ID
 * @returns {object} 200 - 成功删除 banner
 * @returns {Error} 404 - Banner not found
 * @returns {Error} 500 - 服务器错误
 */
router.delete('/:id', authenticateToken, function (req, res, next) {
    const { id } = req.params;
    const connection = createConnection();
    connection.connect();

    const query = 'DELETE FROM `banners` WHERE banner_id = ?';

    connection.query(query, [id], function (error, results, fields) {
        if (error) {
            console.error('Error deleting banner:', error);
            res.status(500).send({ message: 'Error deleting banner', error });
            connection.end();
            return;
        }

        if (results.affectedRows === 0) {
            res.status(404).send({ message: 'Banner not found' });
        } else {
            res.send({ message: 'Banner deleted successfully' });
        }
        connection.end();
    });
});

module.exports = router;
