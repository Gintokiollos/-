var express = require('express');
var router = express.Router();
const mysql = require('mysql');
const dbConfig = require('../config/db');
const { authenticateToken } = require('./auth');

// 创建数据库连接
function createConnection() {
  return mysql.createConnection(dbConfig);
}

/* GET users listing. */
router.get('/', authenticateToken, function(req, res, next) {
  const connection = createConnection();
  connection.connect();

  connection.query('SELECT * FROM users', function (error, results, fields) {
    if (error) throw error;
    res.json(results);
  });

  connection.end();
});

/* GET user by openid */
router.get('/:openid', authenticateToken, function(req, res, next) {
  const { openid } = req.params;
  const connection = createConnection();
  connection.connect();

  const query = 'SELECT * FROM users WHERE openid = ?';
  connection.query(query, [openid], function (error, results, fields) {
    if (error) {
      console.error('Error fetching user:', error); // Log the error
      res.status(500).send({ message: 'Error fetching user', error });
      connection.end();
      return;
    }

    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).send({ message: 'User not found' });
    }

    connection.end();
  });
});

/* POST new user or update existing user */
router.post('/', authenticateToken, function(req, res, next) {
  const { openid, avatarUrl, nickname } = req.body;
  const connection = createConnection();
  connection.connect();

  // 检查用户是否存在
  const checkQuery = 'SELECT * FROM users WHERE openid = ?';
  connection.query(checkQuery, [openid], function (error, results, fields) {
    if (error) {
      console.error('Error checking user:', error); // Log the error
      res.status(500).send({ message: 'Error checking user', error });
      connection.end();
      return;
    }

    if (results.length > 0) {
      // 用户已存在，更新用户信息
      const updateQuery = 'UPDATE users SET avatar_url = ?, nickname = ? WHERE openid = ?';
      connection.query(updateQuery, [avatarUrl, nickname, openid], function (error, results, fields) {
        if (error) {
          console.error('Error updating user:', error); // Log the error
          res.status(500).send({ message: 'Error updating user', error });
          connection.end();
          return;
        }
        res.json({ id: results.insertId, message: 'User updated successfully' });
        connection.end();
      });
    } else {
      // 用户不存在，插入新用户
      const insertQuery = 'INSERT INTO users (openid, avatar_url, nickname) VALUES (?, ?, ?)';
      connection.query(insertQuery, [openid, avatarUrl, nickname], function (error, results, fields) {
        if (error) {
          console.error('Error saving user:', error); // Log the error
          res.status(500).send({ message: 'Error saving user', error });
          connection.end();
          return;
        }
        res.json({ id: results.insertId, message: 'User saved successfully' });
        connection.end();
      });
    }
  });
});

module.exports = router;
