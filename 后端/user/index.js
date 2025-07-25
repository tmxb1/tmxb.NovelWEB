const express = require('express');  
const router = express.Router();  
const db = require('../db/index'); // 导入 db 模块  
//测试输出表单
router.get('/getuserinfor', (req, res) => {  
    const sql = "SELECT * FROM user";  
    db.query(sql, (err, result) => {  
        console.log(result);
        if (err) {  
            console.error('Error executing query', err);  
            return res.status(500).send({ status: 1, message: '服务器错误', code: 500 });  
        }  
        if (result.length < 1) {  
            res.send({ status: 1, message: '获取失败', code: 400 });  
        } else {  
            res.send({ status: 0, data: result, message: '获取列表成功', code: 200 });  
        }  
    });  
});  
  
//通过用户名获取密码,对比密码返回（成功，失败）
router.post('/log_in',function(request,response){
    var name=request.body.signin_yhm;
    var sql="select pass from user where name ='"+name+"'";
    db.query(sql,function(err,results){
        console.log(err)
        if(err){
            console.log(err);
        }else{
            response.send(results);
        }
    })
})
module.exports = router;