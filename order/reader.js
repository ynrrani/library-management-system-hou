const express = require('express')
const router = express.Router()
const conn = require('../js/conn')
// import { nanoid } from 'nanoid'
const { nanoid } = require('nanoid')
// import { encrypt,decrypt  } from "../js/encrypt";
const { encrypt,decrypt  } = require("../js/encrypt.js");


var bodyParser = require('body-parser')
router.use(bodyParser.urlencoded({ extended: false}))

// 重新获取学生信息
router.post('/initreader',(req,res)=>{
	let data = req.body
	conn.query(`select email,readerId,readerName,phone,borrowTimes,ovdTimes from reader where readerId='${data.readerId}'`, (err, rs) => {
	  if (err) throw err;
	  console.log("重新获取学生信息：",rs);
	  if (rs.length > 0) {
	    res.json({
	      msg: '学生获取信息成功！',
	      status: 200,
	      readerId:rs[0].readerId,
	      readerName:rs[0].readerName,
		  readerPhone:rs[0].phone,
		  borrowTimes:rs[0].borrowTimes,
		  ovdTimes:rs[0].ovdTimes,
		  email:rs[0].email,
	      isAdmin:false
	    })
	  } else {
	    res.json({
	      msg: '学生获取信息失败！',
	      status: 0
	    })
	  }
	})
})
// 学生获取举报记录接口
router.post('/initstureport',(req,res)=>{
	let data = req.body;
	conn.query(`select status,commentId,reporterId,reportdate,a.readerId,a.readerName,bookId,bookName,
	date,content,b.readerName as reporterName from reportInfo a left join reader b 
	on a.reporterId=b.readerId where b.readerId='${data.readerId}'`,(err,rs)=>{
		rs = rs || []
		if(rs.length == 0)
			return res.send({
				msg:'学生获取举报记录为空！'
			})
		res.send({
			msg:'学生获取举报记录成功！',
			data:rs
		})

	})
})
// 学生注册接口
router.post('/register', (req, res) => {
    let data = req.body;
    console.log("注册接收的数据",data);
  
    if (!data) {
      res.json({
        msg: '没有提交数据！',
        status: 0
      })
      return false;
    }
    // 用户名非空校验
    if (!data.userName) {
      res.json({
        msg: '用户名不能为空',
        status: 0
      })
      return false;
    }
    // 电话号码非空校验
    if (!data.phone) {
      res.json({
        msg: '手机号不能为空',
        status: 0
      })
      return false;
    }
    // 邮箱非空校验
    if (!data.email) {
      res.json({
        msg: '邮箱不能为空',
        status: 0
      })
      return false;
    }
    // 密码非空校验
    if (!data.password) {
      res.json({
        msg: '密码不能为空',
        status: 0
      })
      return false;
    }
    // 随机用户ID
    let readerId = nanoid();
    // 加密密码
    let userRegisterPwd = encrypt(data.password)
    // 手机号格式验证
    const regexp = /^(\+\d{2,3}-)?\d{11}$/;
    if (!regexp.test(data.phone)) {
      res.json({
        msg: '手机号格式错误',
        status: 0
      })
      return false;
    }
    conn.query(`select * from reader where phone='${data.phone}'`, (err, rs) => {
      if (err) throw err;
      // 注册前先校验该用户是否已经注册过
      if (rs.length > 0) {
        res.json({
          msg: '该手机号已经注册过！',
          status: 0
        })
        console.log("注册：",rs)
      } else {
        conn.query(`insert into reader values('${readerId}','${data.userName}','${userRegisterPwd}','${data.phone}',0,0,'${data.email}')`, (err, rs) => {
          if (err) throw err;
          res.json({
            msg: '注册成功',
            status: 200
          })
        })
      }
    })
  })
// 学生请求预约记录接口
router.post('/reserve',(req,res)=>{
	let data = req.body
	console.log('学生请求预约记录')
    conn.query(`select reserve.readerId,returnDate,borrowDate,status,book.bookId,author,bookName,date from reserve left join book on reserve.bookId=book.bookId where reserve.readerId = '${data.readerId}'`, (err, rs)=>{
		let data = rs || []
		if(data.length == 0)
			res.json({
			  msg:'读者请求预订记录为空',
			  status:0,
			})
       else
		res.json({
		  msg:'读者请求预订记录成功',
		  status:200,
		  data:rs
		})
    })
})
// 学生添加预约记录接口
router.post('/addreserve',(req,res)=>{
	let data = req.body
	console.log('学生添加预约记录')
	conn.query(`select * from book where bookId='${data.bookId}'`,(err,rs)=>{
		if(err) throw err;
		rs = rs || []
		if(rs.length > 0){
			conn.query(`insert into reserve values('${data.readerId}','${data.bookId}','${data.date}','9999-12-31','9999-12-31','${data.status}')`)
			res.json({
				msg:'预约成功！',
				status:200
			})
		}else{
			res.json({
				msg:'预约失败！',
				status:0
			})
		}
	})
	
	
})
// 学生删除预约记录接口
router.post('/cancelreserve',(req,res)=>{
	let data = req.body
	console.log('学生取消预约记录')
	conn.query(`delete from reserve where bookId='${data.bookId}' and readerId='${data.readerId}' and date='${data.date}'`)
	res.json({
		msg:'取消预约成功！',
		status:200
	})
	
})
// 学生修改预约状态接口
router.post('/changereserve',(req,res)=>{
	let data = JSON.stringify(req.body)
	data = JSON.parse(data)
	console.log('学生修改预约状态：已预约/已借/已还')
	conn.query(`update reserve set status = '${data.status}' where bookId='${data.bookId}' and readerId='${data.readerId}' and date='${data.date}'`)
	res.json({
		msg:'修改预约状态成功！',
		status:200
	})
	
})
// 学生续借接口
router.post('/continueborrow',(req,res)=>{
	let data = req.body
	console.log(data);
	conn.query(`update borrow set borrowDate=now(),returnDate=date_add(NOW(), interval 1 month) \
	where readerId='${data.readerId}' and bookId = '${data.bookId}' and borrowDate = '${data.borrowDate}'`)
	conn.query(`update reserve set status = '已借' where bookId='${data.bookId}' 
	and readerId='${data.readerId}' and date='${data.date}'`)
	res.send({
		msg:'续借成功！',
		status:200
	})
})
// 学生请求借阅记录接口
router.post('/borrows',(req,res)=>{
	let data = req.body
    conn.query(`select bookName,borrowDate,returnDate,realDate from borrow left join book on borrow.bookId=book.bookId where borrow.readerId in (select readerId from reader where phone = ${data.id})`, (err, rs)=>{
		let data = rs || []
		if(data.length == 0)
			res.json({
			  msg:'读者请求借阅记录为空',
			  status:0
			})
		else
			res.json({
			  msg:'读者请求借阅记录成功',
			  status:200,
			  data:rs
			})
    })
})
// 学生借书接口
router.post('/addborrow',(req,res)=>{
	let data = req.body
	console.log('学生借书信息为：',data)
	// 向借书表中添加数据
	conn.query(`insert into borrow values('${data.readerId}','${data.bookId}',now(),date_add(NOW(), interval 1 month),'9999-12-31')`)
	// 书籍表数量-1
	conn.query(`update book set amount = amount - 1 where bookId='${data.bookId}'`)
	// 书籍表借阅次数+1
	conn.query(`update book set borrowedTimes = borrowedTimes + 1 where bookId='${data.bookId}'`)
	// 用户借阅数量+1
	conn.query(`update reader set borrowTimes = borrowTimes + 1 where readerId='${data.readerId}'`)
	// 将预订表的借书时间改为当前时间
	conn.query(`update reserve set borrowDate = now() where bookId='${data.bookId}' and readerId='${data.readerId}' and date='${data.date}'`)
	res.json({
		msg:'添加借书记录成功！',
		status:200
	})
	
})
// 学生还书接口
router.post('/changeborrow',(req,res)=>{
	let data = req.body
	console.log('学生还书：',data)
	conn.query(`update borrow set realDate = sysDate() where bookId='${data.bookId}' and readerId='${data.readerId}' and borrowDate='${data.borrowDate}'`)
	conn.query(`select unix_timestamp(returnDate) as returnDate from borrow where bookId='${data.bookId}' and readerId='${data.readerId}' and borrowDate='${data.borrowDate}'`,(err,rs)=>{
		if(rs.length > 0){
			let realDate = new Date(data.date).getTime()/1000;
			let returnDate = rs[0].returnDate;
			if(realDate > returnDate){
				// 用户逾期记录+1
				conn.query(`update reader set ovdTimes = ovdTimes + 1 where readerId='${data.readerId}'`)
			}
		}
		
	})
	// 书籍表数量加1
	conn.query(`update book set amount = amount + 1 where bookId='${data.bookId}'`)
	// 修改预订表的还书时间
	conn.query(`update reserve set returnDate = now() where bookId='${data.bookId}' and readerId='${data.readerId}' and date='${data.date}'`)
	res.json({
		msg:'还书成功！',
		status:200
	})
	
})
// 学生举报接口
router.post('/reportcomment',(req,res)=>{
	let data = req.body
	console.log(data)
	conn.query(`insert into report values('${data.commentId}','${data.reporterId}',now(),'审核中')`)
	res.send({
		msg:'举报成功！',
		status:200
	})
})
module.exports = router
