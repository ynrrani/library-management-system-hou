const express = require('express')
const app = express();
const conn = require('./js/conn')
const { encrypt,decrypt  } = require("./js/encrypt.js");
const { nanoid } = require('nanoid')

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false}))
const admin = require('./order/admin.js')
const reader = require('./order/reader.js')
app.use(admin)
app.use(reader)

// 公共接口


// 登录接口
app.post('/login', (req, res) => {
  let data = req.body;
  data = JSON.stringify(data)
  data = JSON.parse(data)
  console.log("登录接收的数据",data);

  // 判断接收数据是否为空
  if (!data) {
    res.json({
      msg: '没有提交数据！',
      status: 0
    })
    return false;
  }
  // 管理员/学生验证
  // 电话号码非空校验
  if (!data.phone) {
    res.json({
      msg: '账号不能为空',
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
  // 管理员：
 if (data.isAdmin == 'true') {
    conn.query(`select * from admin where id = '${data.phone}' and password='${data.password}'`, (err, rs) => {
      if (err) throw err;
      console.log("管理员信息：",rs);
      if (rs.length > 0) {
        res.json({
          msg: '管理员登录成功',
          status: 200,
          userName:data.phone,
          isAdmin:true
        })
      } else {
        res.json({
          msg: '管理员账号或密码错误！',
          status: 0
        })
      }
    })
  } else {

    // 电话号码格式验证
    const regexp = /^(\+\d{2,3}-)?\d{11}$/;
    if (!regexp.test(data.phone)) {
      res.json({
        msg: '请输入正确的手机号',
        status: 0
      })
      return false;
    }
    // 加密密码
    let userLoginPwd = encrypt(data.password)
    // 检测是否已有账号以及密码的验证
    conn.query(`select readerId,readerName,phone,borrowTimes,ovdTimes from reader where phone='${data.phone}' and password='${userLoginPwd}'`, (err, rs) => {
      if (err) throw err;
      console.log("学生信息：",rs);
      if (rs.length > 0) {
        res.json({
          msg: '学生登录成功',
          status: 200,
          readerId:rs[0].readerId,
          readerName:rs[0].readerName,
		  readerPhone:rs[0].phone,
		  borrowTimes:rs[0].borrowTimes,
		  ovdTimes:rs[0].ovdTimes,
          isAdmin:false
        })
      } else {
        res.json({
          msg: '账号密码错误或该用户未注册！',
          status: 0
        })
      }
    })
  }

})
// 图书接口
app.post('/books',(req,res)=>{
    conn.query(`select * from book`, (err, rs)=>{
		let data = rs || []
		if(data.length > 0){
			res.json({
			  msg:'书籍请求成功',
			  status:200,
			  data:rs
			})
		}else{
			res.json({
			  msg:'书籍请求数据为空',
			  status:0,
			})
		}
       
    })
})
// 评论接口
app.post('/comments',(req,res)=>{
    conn.query(`select reader.email,comment.status,comment.commentId,
    comment.readerId,comment.bookId,readerName,bookName,date,content,praise from comment 
    left join reader on comment.readerId=reader.readerId left join book on comment.bookId=book.bookId`, (err, rs)=>{
		let data = rs || []
		// console.log("评论区：",rs)
		if(data.length > 0){
        res.json({
          msg:'评论区请求成功',
          status:200,
          data:rs
        })
		}else {
        res.json({
          msg: '评论区请求数据为空！',
          status: 0
        })
      }
    })
})
// 添加评论
app.post('/addcomment',(req,res)=>{
	let data = req.body
  let commentId = nanoid();
	conn.query(`insert into comment values('${commentId}','${data.readerId}','${data.bookId}',sysdate(),'${data.content}',0,1)`)
	res.send({
		msg:'评论成功！',
		status:200
	})
})
// 点赞
app.post('/addpraise',(req,res)=>{
	let data = req.body
	conn.query(`update comment set praise = praise+1 where readerId='${data.readerId}' and bookId = '${data.bookId}' and date = '${data.date}'`)
	res.send({
		msg:'点赞成功！',
		status:200
	})
})
// 书籍查询接口
app.post('/searchbook',(req,res)=>{
	let data = req.body
	// console.log(data.name)
	conn.query(`select * from book where bookName like '%${data.name}%'`,(err,book)=>{
		book = book || []
		conn.query(`select * from book where author like '%${data.name}%'`,(err,author)=>{
			const data = [...new Set(book.concat(author))]
			if(data.length > 0)
			res.json({
				msg:'查询成功！',
				data:data,
				status:200
			})
			else
			res.json({
				msg:'查询结果为空！',
				status:0
			})
		})
		
	})
		
})

// 端口监听
app.listen(8080, (err) => {
  if (!err) console.log('服务器启动成功!');

})

