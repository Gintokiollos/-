var express = require('express');
var router = express.Router();
const mysql = require('mysql');
const dbConfig = require('../config/db');
const { authenticateToken } = require('./auth');

/* POST user requests */
router.post('/', authenticateToken, function(req, res, next) {
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

  const connection = mysql.createConnection(dbConfig);
  connection.connect();

  const query = 'INSERT INTO custom_requests (selectedOption, otherType, hasModel, modelInfo, description, amount, images, files, openid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [selectedOption, otherType, hasModel, modelInfo, description, amount, JSON.stringify(images), JSON.stringify(files), openid];

  connection.query(query, values, function (error, results, fields) {
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

/* GET user requests by openid */
router.get('/user/:openid', authenticateToken, function(req, res, next) {
  const userOpenid = req.params.openid;

  console.log('Fetching requests for user with openid:', userOpenid);  // 添加日志记录

  const connection = mysql.createConnection(dbConfig);
  connection.connect();

  const query = 'SELECT * FROM custom_requests WHERE openid = ?';

  connection.query(query, [userOpenid], function (error, results, fields) {
    if (error) {
      console.error('Error fetching requests:', error);  // 添加详细的错误日志
      res.status(500).send({ message: 'Error fetching requests', error });
      connection.end();
      return;
    }

    if (results.length === 0) {
      res.status(404).send({ message: 'Requests not found for this user' });
    } else {
      res.json(results);
    }

    connection.end();
  });
});

module.exports = router;
