const mysql = require('mysql');

// 创建数据库连接对象
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'xxxxxxx',//改自己的密码
  database: 'library',
  timezone:"08:00"
})

// 连接数据库
connection.connect(() => {
  console.log('数据库连接成功！');
});

module.exports = connection;