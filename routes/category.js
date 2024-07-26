const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const dbConfig = require('../config/db');
const { authenticateToken } = require('./auth');

/**
 * GET /categories
 * 
 * 获取分类列表，支持按 category_id 和 name 进行筛选。
 * 
 * @route GET /categories
 * @param {express.Request} req - Express 请求对象
 * @param {string} [req.query.category_id] - 可选的分类 ID，用于筛选特定分类
 * @param {string} [req.query.name] - 可选的分类名称，用于模糊查找
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一中间件函数
 * @returns {void} 直接在响应中返回分类列表，或错误信息
 */ 
router.get('/', authenticateToken, (req, res, next) => {
    const connection = mysql.createConnection(dbConfig);
    connection.connect();

    // 获取查询参数
    const categoryId = req.query.category_id;
    const name = req.query.name;

    let query = 'SELECT * FROM categories';
    const values = [];

    // 添加 category_id 条件
    if (categoryId) {
        query += ' WHERE category_id = ?';
        values.push(categoryId);
    }

    // 添加 name 模糊查找条件
    if (name) {
        // 如果已经有其他条件，用 'AND' 连接
        if (values.length > 0) {
            query += ' AND name LIKE ?';
        } else {
            query += ' WHERE name LIKE ?';
        }
        values.push(`%${name}%`);  // 模糊查找，% 表示任意字符
    }

    connection.query(query, values, function (error, results, fields) {
        if (error) {
            res.status(500).send({ message: 'Error fetching categories', error });
            connection.end();
            return;
        }

        if (results.length === 0) {
            res.status(404).send({ message: 'Categories not found' });
        } else {
            res.json(results);
        }

        connection.end();
    });
});

module.exports = router;
