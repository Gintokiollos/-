const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const dbConfig = require('../config/db');
const { authenticateToken } = require('./auth');

/**
 * 创建数据库连接
 * @returns {mysql.Connection} 数据库连接对象
 */
function createConnection() {
    return mysql.createConnection(dbConfig);
}

/**
 * 获取用户的所有收藏
 * @name GET /collect
 * @function
 * @memberof module:routes/collect
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 */
router.get('/', authenticateToken, function (req, res, next) {
    const user_id = req.user.id; // 从 JWT 中获取用户 ID

    const connection = createConnection();
    connection.connect();

    // 查询用户的收藏列表
    const query = 'SELECT * FROM user_product_collect WHERE user_id = ?';
    connection.query(query, [user_id], function (error, collectList) {
        if (error) {
            console.error('Error fetching favorites:', error);
            res.status(500).send({ message: 'Error fetching favorites', error });
            connection.end();
            return;
        }

        // 提取唯一的 product_id 列表
        const productIdList = [...new Set(collectList.map(item => item.product_id))];

        if (productIdList.length === 0) {
            // 如果没有收藏记录，直接返回空数组
            res.json([]);
            connection.end();
            return;
        }

        // 动态生成 SQL 查询条件
        const placeholders = productIdList.map(() => '?').join(',');
        const query2 = `SELECT * FROM products WHERE product_id IN (${placeholders})`;

        // 查询产品列表
        connection.query(query2, productIdList, function (error, productList) {
            if (error) {
                console.error('Error fetching products:', error);
                res.status(500).send({ message: 'Error fetching products', error });
                connection.end();
                return;
            }

            // 将 productList 放到对应的 collectList 中
            const productMap = new Map(productList.map(product => [product.product_id, product]));

            const enrichedCollectList = collectList.map(item => ({
                ...item,
                product: productMap.get(item.product_id) || {}
            }));

            res.json(enrichedCollectList);
            connection.end();
        });
    });
});

/**
 * 获取指定 ID 的收藏
 * @name GET /collect/:id
 * @function
 * @memberof module:routes/collect
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 */
router.get('/:id', authenticateToken, function (req, res, next) {
    const { id } = req.params;
    const connection = createConnection();
    connection.connect();

    const query = 'SELECT * FROM user_product_collect WHERE id = ?';

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
 * 创建新的收藏
 * @name POST /collect
 * @function
 * @memberof module:routes/collect
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 */
router.post('/', authenticateToken, function (req, res, next) {
    const { product_id } = req.body;
    const user_id = req.user.id; // 从 JWT 中获取用户 ID

    const connection = createConnection();
    connection.connect();

    const query = 'INSERT INTO user_product_collect (user_id, product_id, create_by, create_time, update_by, update_time) VALUES (?, ?, ?, NOW(), ?, NOW())';
    connection.query(query, [user_id, product_id, user_id, user_id], function (error, results, fields) {
        if (error) {
            console.error('Error adding favorite:', error);
            res.status(500).send({ message: 'Error adding favorite', error });
            connection.end();
            return;
        }
        res.json({ message: 'Favorite added successfully' });
        connection.end();
    });
});

/**
 * 更新指定 ID 的收藏
 * @name PUT /collect/:id
 * @function
 * @memberof module:routes/collect
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 */
router.put('/:id', authenticateToken, function (req, res, next) {
    const { id } = req.params;
    const { product_id, remark } = req.body;
    const user_id = req.user.id; // 从 JWT 中获取用户 ID

    const connection = createConnection();
    connection.connect();

    // 动态构建更新的字段
    let query = 'UPDATE user_product_collect SET update_by = ?, update_time = NOW()';
    const values = [user_id];

    if (product_id !== undefined) {
        query += ', product_id = ?';
        values.push(product_id);
    }
    if (remark !== undefined) {
        query += ', remark = ?';
        values.push(remark);
    }

    query += ' WHERE id = ? AND user_id = ?';
    values.push(id, user_id);

    connection.query(query, values, function (error, results, fields) {
        if (error) {
            console.error('Error updating favorite:', error);
            res.status(500).send({ message: 'Error updating favorite', error });
            connection.end();
            return;
        }
        res.json({ message: 'Favorite updated successfully' });
        connection.end();
    });
});

/**
 * 删除指定 ID 的收藏
 * @name DELETE /collect/:id
 * @function
 * @memberof module:routes/collect
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 */
router.delete('/:id', authenticateToken, function (req, res, next) {
    const { id } = req.params;
    const user_id = req.user.id; // 从 JWT 中获取用户 ID

    const connection = createConnection();
    connection.connect();

    const query = 'DELETE FROM user_product_collect WHERE id = ?';
    connection.query(query, [id], function (error, results, fields) {
        if (error) {
            console.error('Error removing favorite:', error);
            res.status(500).send({ message: 'Error removing favorite', error });
            connection.end();
            return;
        }
        res.json({ message: 'Favorite removed successfully' });
        connection.end();
    });
});

/**
 * 收藏或取消收藏商品
 * @name POST /collect/toggle/:product_id
 * @function
 * @memberof module:routes/collect
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 */
router.post('/toggle/:product_id', authenticateToken, function (req, res, next) {
    const connection = createConnection();
    connection.connect();

    const user_id = req.user.id; // 从认证中间件获取用户 ID
    const product_id = req.params.product_id; // 从路径参数中获取商品 ID

    if (!product_id) {
        res.status(400).send({ message: 'Product ID is required' });
        connection.end();
        return;
    }

    // 查找是否已收藏
    const checkQuery = 'SELECT * FROM user_product_collect WHERE user_id = ? AND product_id = ?';
    connection.query(checkQuery, [user_id, product_id], function (error, results) {
        if (error) {
            console.error('Error checking collection:', error);
            res.status(500).send({ message: 'Error checking collection', error });
            connection.end();
            return;
        }

        // 如果记录存在，删除收藏
        if (results.length > 0) {
            const deleteQuery = 'DELETE FROM user_product_collect WHERE user_id = ? AND product_id = ?';
            connection.query(deleteQuery, [user_id, product_id], function (error) {
                if (error) {
                    console.error('Error deleting collection:', error);
                    res.status(500).send({ message: 'Error deleting collection', error });
                    connection.end();
                    return;
                }
                res.json({ message: 'Product removed from favorites' });
                connection.end();
            });
        } else {
            // 如果记录不存在，添加收藏
            const createTime = new Date().toISOString().slice(0, 19).replace('T', ' '); // 格式化时间
            const insertQuery = 'INSERT INTO user_product_collect (user_id, product_id, create_by, create_time, update_by, update_time) VALUES (?, ?, ?, ?, ?, ?)';
            connection.query(insertQuery, [user_id, product_id, user_id, createTime, user_id, createTime], function (error) {
                if (error) {
                    console.error('Error adding collection:', error);
                    res.status(500).send({ message: 'Error adding collection', error });
                    connection.end();
                    return;
                }
                res.json({ message: 'Product added to favorites' });
                connection.end();
            });
        }
    });
});

module.exports = router;
