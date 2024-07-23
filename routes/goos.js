var express = require('express');
var router = express.Router();
const mysql = require('mysql');
const dbConfig = require('../config/db');
const { authenticateToken } = require('./auth');

// 创建数据库连接
function createConnection() {
  return mysql.createConnection(dbConfig);
}

/* GET all products */
router.get('/', authenticateToken, function(req, res, next) {
  const connection = createConnection();
  connection.connect();

  connection.query('SELECT * FROM products', function (error, results, fields) {
    if (error) throw error;
    res.json(results);
  });

  connection.end();
});

/* GET product by product_id */
router.get('/:product_id', authenticateToken, function(req, res, next) {
  const { product_id } = req.params;
  const connection = createConnection();
  connection.connect();

  const query = 'SELECT * FROM products WHERE product_id = ?';
  connection.query(query, [product_id], function (error, results, fields) {
    if (error) {
      console.error('Error fetching product:', error);
      res.status(500).send({ message: 'Error fetching product', error });
      connection.end();
      return;
    }

    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).send({ message: 'Product not found' });
    }

    connection.end();
  });
});

/* POST new product or update existing product */
router.post('/', authenticateToken, function(req, res, next) {
  const { product_id, image_url, name, price, description, category_id, openid } = req.body;
  const connection = createConnection();
  connection.connect();

  // 检查产品是否存在
  const checkQuery = 'SELECT * FROM products WHERE product_id = ?';
  connection.query(checkQuery, [product_id], function (error, results, fields) {
    if (error) {
      console.error('Error checking product:', error);
      res.status(500).send({ message: 'Error checking product', error });
      connection.end();
      return;
    }

    if (results.length > 0) {
      // 产品已存在，更新产品信息
      const updateQuery = 'UPDATE products SET image_url = ?, name = ?, price = ?, description = ?, category_id = ?, openid = ? WHERE product_id = ?';
      connection.query(updateQuery, [image_url, name, price, description, category_id, openid, product_id], function (error, results, fields) {
        if (error) {
          console.error('Error updating product:', error);
          res.status(500).send({ message: 'Error updating product', error });
          connection.end();
          return;
        }
        res.json({ id: product_id, message: 'Product updated successfully' });
        connection.end();
      });
    } else {
      // 产品不存在，插入新产品
      const insertQuery = 'INSERT INTO products (image_url, name, price, description, category_id, openid) VALUES (?, ?, ?, ?, ?, ?)';
      connection.query(insertQuery, [image_url, name, price, description, category_id, openid], function (error, results, fields) {
        if (error) {
          console.error('Error saving product:', error);
          res.status(500).send({ message: 'Error saving product', error });
          connection.end();
          return;
        }
        res.json({ id: results.insertId, message: 'Product saved successfully' });
        connection.end();
      });
    }
  });
});

/* DELETE product by product_id */
router.delete('/:product_id', authenticateToken, function(req, res, next) {
  const { product_id } = req.params;
  const connection = createConnection();
  connection.connect();

  const query = 'DELETE FROM products WHERE product_id = ?';
  connection.query(query, [product_id], function (error, results, fields) {
    if (error) {
      console.error('Error deleting product:', error);
      res.status(500).send({ message: 'Error deleting product', error });
      connection.end();
      return;
    }

    if (results.affectedRows > 0) {
      res.json({ message: 'Product deleted successfully' });
    } else {
      res.status(404).send({ message: 'Product not found' });
    }

    connection.end();
  });
});

module.exports = router;
