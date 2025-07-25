const mysql=require('mysql');
//创建连接对象
const db=mysql.createConnection({
    host:'localhost',
    user:"root",
    password:'123456',
    database:"novel",
    port:3306
})
module.exports=db
// //开始链接
// db.connect();
// const sql=`select * from user`;
// db.query(sql,(err,result)=>{
//     if (err) {
//         console.error('error',err);
//         return;
//     }
//     console.log('result',result)
// })

// //关闭链接
// db.end();