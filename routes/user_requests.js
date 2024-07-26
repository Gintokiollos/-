var express = require('express');
var router = express.Router();
const mysql = require('mysql');
const dbConfig = require('../config/db');
const { authenticateToken } = require('./auth');
const moment = require('moment');

// 创建数据库连接
/**
 * 创建数据库连接
 * @returns {mysql.Connection} 数据库连接对象
 */
function createConnection() {
    return mysql.createConnection(dbConfig);
}

// 查询所有的接口
/**
 * 获取所有自定义请求，支持多种筛选条件
 * @name GET /custom_requests
 * @function
 * @memberof module:routes/customRequests
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 * @param {string} [req.query.selectedOption] - 选定的选项
 * @param {string} [req.query.otherType] - 其他类型
 * @param {boolean} [req.query.hasModel] - 是否有模型
 * @param {string} [req.query.modelInfo] - 模型信息
 * @param {string} [req.query.description] - 描述
 * @param {number} [req.query.amount] - 数量
 * @param {string} [req.query.images] - 图像
 * @param {string} [req.query.files] - 文件
 * @param {string} [req.query.openid] - 用户的 openid
 * @param {string} [req.query.user_id] - 用户 ID
 * @param {string} [req.query.status] - 状态
 * @param {string} [req.query.receive_id] - 接收者 ID
 * @param {string} [req.query.create_by] - 创建者
 * @param {string} [req.query.update_by] - 更新者
 * @param {string} [req.query.remark] - 备注
 */
router.get('/', (req, res) => {
    const { selectedOption, otherType, hasModel, modelInfo, description, amount, images, files, openid, user_id, status, receive_id, create_by, update_by, remark } = req.query;

    const connection = createConnection();
    connection.connect();

    let query = 'SELECT * FROM custom_requests WHERE 1=1';
    let values = [];

    // 动态生成查询条件
    if (selectedOption) {
        query += ' AND selectedOption = ?';
        values.push(selectedOption);
    }
    if (otherType) {
        query += ' AND otherType = ?';
        values.push(otherType);
    }
    if (hasModel !== undefined) {
        query += ' AND hasModel = ?';
        values.push(hasModel);
    }
    if (modelInfo) {
        query += ' AND modelInfo LIKE ?';
        values.push(`%${modelInfo}%`);
    }
    if (description) {
        query += ' AND description LIKE ?';
        values.push(`%${description}%`);
    }
    if (amount) {
        query += ' AND amount = ?';
        values.push(amount);
    }
    if (images) {
        query += ' AND images = ?';
        values.push(images);
    }
    if (files) {
        query += ' AND files = ?';
        values.push(files);
    }
    if (openid) {
        query += ' AND openid = ?';
        values.push(openid);
    }
    if (user_id) {
        query += ' AND user_id = ?';
        values.push(user_id);
    }
    if (status) {
        query += ' AND status = ?';
        values.push(status);
    }
    if (receive_id) {
        query += ' AND receive_id = ?';
        values.push(receive_id);
    }
    if (create_by) {
        query += ' AND create_by = ?';
        values.push(create_by);
    }
    if (update_by) {
        query += ' AND update_by = ?';
        values.push(update_by);
    }
    if (remark) {
        query += ' AND remark = ?';
        values.push(remark);
    }

    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error fetching requests:', error);
            res.status(500).send({ message: 'Error fetching requests', error });
            connection.end();
            return;
        }
        res.json(results);
        connection.end();
    });
});

/**
 * 创建新的自定义请求
 * @name POST /custom_requests
 * @function
 * @memberof module:routes/customRequests
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 * @param {Object} req.body - 请求数据
 * @param {string} req.body.selectedOption - 选定的选项
 * @param {string} req.body.otherType - 其他类型
 * @param {boolean} req.body.hasModel - 是否有模型
 * @param {string} req.body.modelInfo - 模型信息
 * @param {string} req.body.description - 描述
 * @param {number} req.body.amount - 数量
 * @param {Array} req.body.images - 图像数组
 * @param {Array} req.body.files - 文件数组
 * @param {string} req.body.openid - 用户的 openid
 */
router.post('/', authenticateToken, function (req, res, next) {
    const {
        selectedOption,
        otherType,
        hasModel,
        modelInfo,
        description,
        amount,
        images,
        files,
        openid
    } = req.body;

    console.log('Received request data:', req.body);  // 添加日志记录

    const connection = createConnection();
    connection.connect();

    const query = 'INSERT INTO custom_requests (selectedOption, otherType, hasModel, modelInfo, description, amount, images, files, openid, status, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now())';
    const values = [selectedOption, otherType, hasModel, modelInfo, description, amount, JSON.stringify(images), JSON.stringify(files), openid, '未接'];

    connection.query(query, values, function (error, results) {
        if (error) {
            console.error('Error saving request:', error);  // 添加详细的错误日志
            res.status(500).send({ message: 'Error saving request', error });
            connection.end();
            return;
        }
        res.json({ id: results.insertId, message: 'Request saved successfully' });
        connection.end();
    });
});

/**
 * 获取指定用户的自定义请求
 * @name GET /custom_requests/user/:openid
 * @function
 * @memberof module:routes/customRequests
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 * @param {string} req.params.openid - 用户的 openid
 */
router.get('/user/:openid', authenticateToken, function (req, res, next) {
    const userOpenid = req.params.openid;

    console.log('Fetching requests for user with openid:', userOpenid);  // 添加日志记录

    const connection = createConnection();
    connection.connect();

    const query = userOpenid === '10086string' ? 'SELECT * FROM custom_requests' : 'SELECT * FROM custom_requests WHERE openid = ?';

    connection.query(query, [userOpenid], function (error, results) {
        if (error) {
            console.error('Error fetching requests:', error);  // 添加详细的错误日志
            res.status(500).send({ message: 'Error fetching requests', error });
            connection.end();
            return;
        }

        // 对结果中的 images 和 files 字段进行解析，以及时间字段进行格式化
        const parsedResults = results.map(result => {
            // 解析 images 和 files 字段
            if (result.images) {
                try {
                    result.images = JSON.parse(result.images);
                } catch (e) {
                    console.error('Error parsing images field:', e);
                    result.images = {};  // 解析失败时，设置为默认空对象
                }
            }

            if (result.files) {
                try {
                    result.files = JSON.parse(result.files);
                } catch (e) {
                    console.error('Error parsing files field:', e);
                    result.files = {};  // 解析失败时，设置为默认空对象
                }
            }

            // 格式化时间字段
            if (result.create_time) {
                try {
                    result.create_time = moment(result.create_time).format('YYYY-MM-DD HH:mm:ss');
                } catch (e) {
                    result.create_time = '';
                }
            }

            return result;
        });

        if (parsedResults.length === 0) {
            res.status(404).send({ message: 'Requests not found for this user' });
        } else {
            res.json(parsedResults);
        }

        connection.end();
    });
});

/**
 * 更新自定义请求的状态
 * @name PUT /custom_requests/receive/:id
 * @function
 * @memberof module:routes/customRequests
 * @param {express.Request} req - Express 请求对象
 * @param {express.Response} res - Express 响应对象
 * @param {express.NextFunction} next - Express 下一个中间件函数
 * @param {string} req.params.id - 请求的 ID
 */
router.put('/receive/:id', authenticateToken, function (req, res, next) {
    const requestId = req.params.id;
    const user_id = req.user.id; // 从 JWT 中获取用户 ID

    console.log('Updating request status for request ID:', requestId);  // 添加日志记录

    const connection = createConnection();
    connection.connect();

    const query = 'UPDATE custom_requests SET status = ?, receive_id = ?, update_time = now() WHERE id = ?';
    const values = ['已接', user_id, requestId];

    connection.query(query, values, function (error, results) {
        if (error) {
            console.error('Error updating request status:', error);  // 添加详细的错误日志
            res.status(500).send({ message: 'Error updating request status', error });
            connection.end();
            return;
        }

        if (results.affectedRows === 0) {
            res.status(404).send({ message: 'Request not found' });
        } else {
            res.json({ message: 'Request status updated successfully' });
        }

        connection.end();
    });
});

module.exports = router;
