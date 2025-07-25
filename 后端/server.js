var express =require("express");
var cors =require("cors");
const multer = require('multer');
var bodyParser =require("body-parser");
var mysql =require("mysql");
const path = require('path');
const fs = require('fs');
const iconv = require('iconv-lite');
const moment = require('moment');

var app = new express();
app.use(cors());
app.use(bodyParser.json());
app.use(
	bodyParser.urlencoded({
		extended:true
	})
);


//设置multer来处理文件上传
const storage1 = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'download'); // 保存的路径，确保这个目录存在
	},
	filename: function (req, file, cb) {
	  cb(null, file.originalname); // 使用原始文件名
	}
  });
  
  const upload1 = multer({ storage: storage1 });

  const storage2 = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'download/BackgroundImage'); // 保存的路径，确保这个目录存在
	},
	filename: function (req, file, cb) {
	  cb(null, file.originalname); // 使用原始文件名
	}
  });
  
  const upload2 = multer({ storage: storage2 });

//连接数据库数据
const db=mysql.createConnection({
	host:'localhost',
    user:"root",
    password:'123456',
    database:"novel",
    port:3306
});

//连接
db.connect(function(err){
	if(err)
		console.log(err);
	else
		console.log("连接成功");
})

//输出用户表
app.get('/get_novel_list',function(request,response){
	var sql="select * from novels";
	db.query(sql,function(err,results){
		results.forEach(row => {
			// 检查 ProfilePictureURL 是否有值，并更新
			row.CoverImageURL = 'http://localhost:3000/images/book/'+row.Title+'.jpg';
		  });
		console.log(results);
		if(err){
			console.log(err);
		}else{
			response.send(results);
		}
	})
})

//输出用户表
app.get('/ger_user_list',function(request,response){
	var sql="select * from users";
	db.query(sql,function(err,results){
		results.forEach(row => {
			// 检查 ProfilePictureURL 是否有值，并更新
			if (row.ProfilePictureURL) {
			  row.ProfilePictureURL = 'http://localhost:3000/images/ProfilePicture' + row.Id + '.jpg';
			}
			
			// 检查 BackgroundImage 是否有值，并更新
			if (row.BackgroundImage) {
			  row.BackgroundImage = 'http://localhost:3000/images/BackgroundImage/BackgroundImage' + row.Id + '.jpg';
			}
		  });
		console.log(results);
		if(err){
			console.log(err);
		}else{
			response.send(results);
		}
	})
})

//通过用户名获取密码,对比密码返回（成功，失败）
app.post('/log_in',function(request,response){
    var name=request.body.username;
	var pass=request.body.password;
	var usertype=request.body.radio1;
	console.log('来到node',name,pass)
	let ret={};
    var sql="select Id,usertype from users where Usersname ='"+name+"' and Pass ='"+pass+"'";
    db.query(sql,function(err,results){
		console.log('log_in',results);
		
        if(err){
            console.log(err);
        }else{
			if (results!='') {
				ret.Id=results[0].Id
				if (usertype=='读者'&& results[0].usertype==0) {
					ret.type=0;  //读者账户
				}else if (usertype=='读者'&&results[0].usertype==1) {
					ret.type=0;  //管理员账户登录读者页面
				}else if (usertype=='管理员'&&results[0].usertype==1) {
					ret.type=1;  //管理员账户
				}else{
					ret.type=-1;  
				}
				console.log('什么情况',ret.type);
				response.send(ret);
			}else{
				response.send('failed');
			}
			
        }
    })
})


//从数据库获得图片并保存在后端文件夹中
app.get('/get_users_picture', (request, res) => {
	
    const id = request.query.userId;
    console.log('ID:', id);

	const sql = 'SELECT ProfilePictureURL FROM users WHERE Id = ?';  
	db.query(sql, [id], (err, results) => {  

		if (results[0].ProfilePictureURL==undefined) {
			res.send('无头像,请使用默认头像');
		}else{
			console.log(typeof results[0].ProfilePictureURL)
			const imageBuffer = results[0].ProfilePictureURL;
			const savePath = path.join(__dirname, 'download', 'ProfilePicture'+id+'.jpg'); 
			const writeStream = fs.createWriteStream(savePath);
			writeStream.write(imageBuffer, (writeErr) => {
				if (writeErr) {
					console.error('Error writing image to file:', writeErr);
				} else {
					console.log('Image successfully saved to', savePath);
					res.send('http://localhost:3000/images/ProfilePicture' + id + '.jpg')
				}
				writeStream.end();
			});
		}
	});  
});

// 设置静态文件目录为 'download' 文件夹
app.use('/images', express.static(path.join(__dirname, 'download')));
 




//注册 新建用户 
app.post('/register',function(request,response){
	var register_yhm=request.body.username;
	var register_mm=request.body.password;
	console.log(request.body)
	var sql="SELECT EXISTS(SELECT 1 FROM users WHERE Usersname = ?) AS user_exists;";
	db.query(sql, [register_yhm],function(err,results){
		// console.log(results)
		if(err){
			console.error('Database error:', err);  
        	response.status(500).send(JSON.stringify({ result: 'failed' }));
		}else{
			var userCount=results[0].user_exists
			console.log("查找是否有重复的结果",userCount);
			if(userCount==0){
				//没有用户名可以注册
				var sql="INSERT INTO users (Usersname, Pass,BackgroundType,FontSize,usertype) VALUES (?, ?,0,20,0)";
				db.query(sql, [register_yhm,register_mm],function(err,results){
					console.log(results)
					if(err){
						console.error('Database error:', err);  
        				response.status(500).send(JSON.stringify({ result: 'failed' }));
					}else{
						//保存头像


						response.send(JSON.stringify({ result: 'ok' }));  
				
					}
				})
			}else{
				//有用户名了
				response.send(JSON.stringify({ result: 'failed' })); 
			}
		}
	})
})


// 删除账户
app.post('/Del_User', function(request, response) {
    var UserId = request.body.UserId;
    console.log(UserId);
	//先删除其他表格的记录最后删除用户表
    // 删除用户表中的记录
	var sql1 = "DELETE FROM comment_rating WHERE UserID = ?;";
    db.query(sql1, [UserId], function(err, results1) {
        if (err) {
            console.error(err);
            return response.status(500).send('删除用户表记录失败');
        }

        // 删除评论评分表中的记录
		var sql2 = "DELETE FROM bookshelf WHERE UserID = ?;";
        db.query(sql2, [UserId], function(err, results2) {
            if (err) {
                console.error(err);
                return response.status(500).send('删除评论评分表记录失败');
            }

            // 删除书架表中的记录
			var sql3 = "DELETE FROM users WHERE Id = ?;";
            db.query(sql3, [UserId], function(err, results3) {
                if (err) {
                    console.error(err);
                    return response.status(500).send('删除书架表记录失败');
                }

                return response.send('删除成功');
            });
        });
    });
});

//忘记密码 更改密码
app.post('/forge',function(request,response){
	var forge_yhm=request.body.username;
	var forge_mm=request.body.password;
	console.log(request.body)
	var sql="SELECT EXISTS(SELECT 1 FROM users WHERE Usersname = ?) AS user_exists;";
	db.query(sql, [forge_yhm],function(err,results){
		// console.log(results)
		if(err){
			console.error('Database error:', err);  
        	response.status(500).send(JSON.stringify({ result: 'failed' }));
		}else{
			var userCount=results[0].user_exists
			console.log("查找是否有重复的结果",userCount);
			if(userCount==1){
				//有用户名可以修改
				var sql="UPDATE users SET pass = ? WHERE Usersname = ?;";
				db.query(sql, [forge_mm,forge_yhm],function(err,results){
					console.log(results)
					if(err){
						console.error('Database error:', err);  
        				response.status(500).send(JSON.stringify({ result: 'failed' }));
					}else{
						response.send(JSON.stringify({ result: 'ok' }));  
				
					}
				})
			}else{
				//没有用户名
				response.send(JSON.stringify({ result: 'failed' })); 
			}
		}
	})
})

//novels表图片输出 下载图片到后端
app.get('/get_book_img',function(request,response){
	var sql="select Title from novels";
	db.query(sql,function(err,results){
		console.log(results);
		//获取名字和数据
		const name=results.map(novel => novel.Title);
			
		//从数据库中下载图片
		const sql1 = 'SELECT CoverImageURL FROM novels';  
		db.query(sql1, (er, res) => {  
			for (let index = 0; index < name.length; index++) {
				console.log(name[index]);
				console.log(res[index].CoverImageURL)
				const savePath = path.join(__dirname, 'download', 'book', name[index]+'.jpg');
				const writeStream = fs.createWriteStream(savePath);
				writeStream.write(res[index].CoverImageURL, (writeErr) => {
					if (writeErr) {
					console.error('Error writing image to file:', writeErr);
					} else {
						console.log('Image successfully saved to', savePath);
					}
					writeStream.end();
				});
			}
					
				
		});  

			//输出书籍
		if(err){
			console.log(err);
			}else{
			response.send(results);
		}
	})
})

//users表 判断是否有图片
app.get('/if_picture', function(request, response) {
    // 从数据库获取数据
	let data={};
    var UserID = request.query.userid;
    console.log('if_picture', UserID);
    var sql1 = "SELECT ProfilePictureURL,BackgroundImage FROM users WHERE Id = ?";
    db.query(sql1, [UserID], function(err, results1) {
		console.log(results1);
        if (err) {
            console.error(err);
            response.status(500).send(JSON.stringify({ result: 'error' }));
        } else {
            //判断头像
            if (results1.length === 0 || results1[0].ProfilePictureURL === null || results1[0].ProfilePictureURL === '') {
                // response.send(JSON.stringify({ result: 'ok' }));
				data.ProfilePictureURL='failed';
            } else {
                data.ProfilePictureURL='ok';
                // response.send(JSON.stringify({ result: 'failed' }));
            }
			//判断背景图片
			if (results1.length === 0 || results1[0].BackgroundImage === null || results1[0].BackgroundImage === '') {
                data.BackgroundImage='failed';
                // response.send(JSON.stringify({ result: 'ok' }));
            } else {
                data.BackgroundImage='ok';
                // response.send(JSON.stringify({ result: 'failed' }));
            }
			response.send(data)

        }
    });
});

//novels表输出 模糊搜索图书
app.get('/GetSearchForBook', function(request, response) {
    // 从数据库获取数据
    var SearchFor = request.query.SearchFor;
	var searchTerm = '%' + SearchFor + '%';
    console.log('GetSearchForBook函数', searchTerm);
    var sql = "SELECT Title, Author, Label, BriefIntroduction, Score, ScoreNumber, UpdatedAt FROM novels WHERE Title LIKE ? OR Author LIKE ? OR BriefIntroduction LIKE ?;";
    db.query(sql, [searchTerm, searchTerm, searchTerm], function(err, results) {
        if(err){
            console.error(err);
            response.status(500).send({ error: 'Database error' });
        } else {
            console.log(results);
			
            response.send(results);
        }
    });
});

//管理端 模糊搜索用户
app.get('/ger_user_searchfor', function(request, response) {
    // 从数据库获取数据
    var name = request.query.name;
    console.log('get_user_searchfor函数', name);
    var sql = "SELECT * FROM users WHERE name LIKE ?;"; 
    db.query(sql, ['%' + name + '%'], function(err, results) {
        if (err) {
            console.error(err);
            response.status(500).send('查询失败');
            return;
        }
        console.log(results);
    });
});

//novels表输出 输出全部书籍
app.get('/get_all_book',function(request,response){
	//从数据库获取数据
	var sql="select Title,Author,Label,BriefIntroduction,Score,ScoreNumber,UpdatedAt from novels";
	db.query(sql,function(err,results){
		console.log(results);
		if(err){
			console.log(err);
			}else{
			response.send(results);
		}
	})
})

//novels表输出评分排序 输出全部书籍
app.get('/get_all_book_score',function(request,response){
	//从数据库获取数据
	var sql="SELECT Title, Author, Label, BriefIntroduction, Score, ScoreNumber, UpdatedAt FROM novels ORDER BY Score DESC;";
	db.query(sql,function(err,results){
		console.log(results);
		// //获取名字和数据
		// const name=results.map(novel => novel.Title);
			
		// //从数据库中下载图片
		// const sql1 = 'SELECT CoverImageURL FROM novels ORDER BY Score DESC';  
		// db.query(sql1, (er, res) => {  
		// 	for (let index = 0; index < name.length; index++) {
		// 		console.log(name[index]);
		// 		console.log(res[index].CoverImageURL)
		// 		const savePath = path.join(__dirname, 'download', 'book', name[index]+'.jpg');
		// 		const writeStream = fs.createWriteStream(savePath);
		// 		writeStream.write(res[index].CoverImageURL, (writeErr) => {
		// 			if (writeErr) {
		// 			console.error('Error writing image to file:', writeErr);
		// 			} else {
		// 				console.log('Image successfully saved to', savePath);
		// 			}
		// 			writeStream.end();
		// 		});
		// 	}
					
				
		// });  

			//输出书籍
		if(err){
			console.log(err);
			}else{
			response.send(results);
		}
	})
})

//novels表输出时间排序 输出全部书籍
app.get('/get_all_book_time',function(request,response){
	//从数据库获取数据
	var sql="SELECT Title, Author, Label, BriefIntroduction, Score, ScoreNumber, UpdatedAt FROM novels ORDER BY UpdatedAt DESC;";
	db.query(sql,function(err,results){
		console.log(results);
		//获取名字和数据
		// const name=results.map(novel => novel.Title);
			
		// //从数据库中下载图片
		// const sql1 = 'SELECT CoverImageURL FROM novels ORDER BY UpdatedAt DESC';  
		// db.query(sql1, (er, res) => {  
		// 	for (let index = 0; index < name.length; index++) {
		// 		console.log(name[index]);
		// 		console.log(res[index].CoverImageURL)
		// 		const savePath = path.join(__dirname, 'download', 'book', name[index]+'.jpg');
		// 		const writeStream = fs.createWriteStream(savePath);
		// 		writeStream.write(res[index].CoverImageURL, (writeErr) => {
		// 			if (writeErr) {
		// 			console.error('Error writing image to file:', writeErr);
		// 			} else {
		// 				console.log('Image successfully saved to', savePath);
		// 			}
		// 			writeStream.end();
		// 		});
		// 	}
					
				
		// });  

			//输出书籍
		if(err){
			console.log(err);
			}else{
			response.send(results);
		}
	})
})

//novels表输出随机排序 输出全部书籍
app.get('/get_all_book_random',function(request,response){
	//从数据库获取数据
	var sql='SELECT Title, Author, Label, BriefIntroduction, Score, ScoreNumber, UpdatedAt FROM novels ORDER BY RAND() LIMIT 10;';
	db.query(sql,function(err,results){
		console.log(results);
		//获取名字和数据
		// const name=results.map(novel => novel.Title);
			
		// //从数据库中下载图片
		// const sql1 = 'SELECT CoverImageURL FROM novels ORDER BY UpdatedAt DESC';  
		// db.query(sql1, (er, res) => {  
		// 	for (let index = 0; index < name.length; index++) {
		// 		console.log(name[index]);
		// 		console.log(res[index].CoverImageURL)
		// 		const savePath = path.join(__dirname, 'download', 'book', name[index]+'.jpg');
		// 		const writeStream = fs.createWriteStream(savePath);
		// 		writeStream.write(res[index].CoverImageURL, (writeErr) => {
		// 			if (writeErr) {
		// 			console.error('Error writing image to file:', writeErr);
		// 			} else {
		// 				console.log('Image successfully saved to', savePath);
		// 			}
		// 			writeStream.end();
		// 		});
		// 	}
					
				
		// });  

			//输出书籍
		if(err){
			console.log(err);
			}else{
			response.send(results);
		}
	})
})

// 删除小说
app.post('/Del_Novel', function(request, response) {
    var NovelID = request.body.NovelID;
    console.log(NovelID);

    // 删除用户表中的记录
	var sql1 = "DELETE FROM comment_rating WHERE NovelID = ?;";
    db.query(sql1, [NovelID], function(err, results1) {
        if (err) {
            console.error(err);
            return response.status(500).send('删除用户表记录失败');
        }

        // 删除评论评分表中的记录
		var sql2 = "DELETE FROM bookshelf WHERE NovelID = ?;";
        db.query(sql2, [NovelID], function(err, results2) {
            if (err) {
                console.error(err);
                return response.status(500).send('删除评论评分表记录失败');
            }

            // 删除书架表中的记录
			var sql3 = "DELETE FROM novel_content WHERE NovelID = ?;";
            db.query(sql3, [NovelID], function(err, results3) {
                if (err) {
                    console.error(err);
                    return response.status(500).send('删除书架表记录失败');
                }
				// 删除书籍详细表中的记录
				var sql4 = "DELETE FROM novels WHERE NovelID = ?;";
				db.query(sql4, [NovelID], function(err, results4) {
					if (err) {
						console.error(err);
						return response.status(500).send('删除书籍详细表记录失败');
					}
					return response.send('删除成功');
				});
                
            });
        });
    });
});

//书架vue 通过用户id输出绑定的书籍id 再通过书籍id输出相关书籍
app.get('/get_user_book', function(request, response) {
	var UserID = request.query.userId;
	console.log(UserID);
  
	// 通过用户id获取书籍id
	var sql1 = "SELECT NovelID, Reading_Record FROM bookshelf WHERE UserID = ?";
	db.query(sql1, [UserID], function(err, results1) {
	  if (err) {
		console.error('查询 bookshelf 表时出错:', err);
		return response.status(500).send('服务器内部错误');
	  }
  
	  const novelIds = results1.map(row => row.NovelID);
	  const Reading_Record = results1.map(row => row.Reading_Record);
	  console.log('获取novelid', novelIds, Reading_Record);
  
	  let books = [];
	  const promises = novelIds.map((NovelID, index) => {
		return Promise.all([
		  // 获取小说当前阅读章节名
		  new Promise((resolve, reject) => {
			const sql2 = "SELECT Title, scrollTitle FROM novel_content WHERE NovelID = ? AND Novelorder = ?";
			db.query(sql2, [NovelID, Reading_Record[index]], function(err, bookResult1) {
			  if (err) {
				console.error('查询 novel_content 表时出错:', err);
				reject(err);
			  } else if (bookResult1.length > 0) {
				resolve({ scrollTitle: bookResult1[0].scrollTitle, Title: bookResult1[0].Title });
			  } else {
				resolve(null);
			  }
			});
		  }),
		  // 获取小说相关信息
		  new Promise((resolve, reject) => {
			const sql3 = "SELECT Title, Author, Label, BriefIntroduction, Score, ScoreNumber, UpdatedAt FROM novels WHERE NovelID = ?";
			db.query(sql3, [NovelID], function(err, bookResult2) {
			  if (err) {
				console.error('查询 novels 表时出错:', err);
				reject(err);
			  } else if (bookResult2.length > 0) {
				resolve(bookResult2[0]);
			  } else {
				resolve(null);
			  }
			});
		  })
		]);
	  });
  
	  Promise.all(promises).then(results => {
		results.forEach((result, index) => {
		  const [scrollTitleInfo, bookInfo] = result;
		  if (bookInfo) {
			bookInfo.Reading_Record = Reading_Record[index];
			if (scrollTitleInfo) {
			  bookInfo.scrollTitle = scrollTitleInfo.scrollTitle;
			  bookInfo.ChapterTitle = scrollTitleInfo.Title;
			}else{
				bookInfo.scrollTitle = ' ';
			  bookInfo.ChapterTitle = ' ';
			}
			books.push(bookInfo);
		  }
		});
		console.log(books);
		response.json(books); // 将书籍信息以 JSON 格式返回给客户端
	  }).catch(error => {
		console.error('在处理书籍查询时发生错误:', error);
		response.status(500).send('服务器内部错误');
	  });
	});
  });


//获取该书本全部的信息详细
app.get('/get_detailed_book_information',async function(request,response){
	try{
		// 封装db.query为返回Promise的函数（如果它本身不支持Promise）
		function queryDatabase(sql, params) {
			return new Promise((resolve, reject) => {
				db.query(sql, params, (err, results) => {
					if (err) {
						reject(err);
					} else {
						resolve(results);
					}
				});
			});
		}

		var noveltitle=request.query.title;
		var UserID=request.query.Id;
		console.log(noveltitle,UserID);
		let data={};

		// novels表 小说的信息
		var sql1="select * from novels WHERE Title = ?";
		const novelsData = await queryDatabase(sql1, [noveltitle]);
		console.log(novelsData)
		var NovelID=novelsData[0].NovelID; //小说id
		var Author=novelsData[0].Author//小说作者
		var Label=novelsData[0].Label//小说标签
		data=novelsData[0];

		//comment_rating表 小说评分相关信息
		const sql2 = 'SELECT * FROM comment_rating  WHERE NovelID = ?';  
		const CommentRatingData = await queryDatabase(sql2, [NovelID]);
		const novelIds = CommentRatingData.map(row => row.UserID);  //获得用户名id
		data.comment=CommentRatingData;
		
		//users表  用用户名id查找用户名 
		var sql3='';
		for (let index = 0; index < novelIds.length; index++) {
			sql3= 'SELECT Usersname FROM users  WHERE Id = ?';  
			const UsersData = await queryDatabase(sql3, [novelIds[index]]);
			data.comment[index].Usersname=UsersData[0].Usersname;

		}
		
		const sql5 = 'SELECT Reading_Record FROM bookshelf  WHERE NovelID = ? AND UserID = ?';  
		const BookshelfData = await queryDatabase(sql5, [NovelID,UserID]);

		console.log('BookshelfData',BookshelfData);
		//判断是否加入书架
		if (BookshelfData[0]==undefined) {
			data.Reading_Record=0;  
		}else{
			data.Reading_Record=BookshelfData[0].Reading_Record; 
			// novel_content表 查看已添加的小说阅读到哪里      
			var sql8="select scrollNumber,scrollInNumber,Title from novel_content WHERE Novelorder = ? AND NovelID = ?";
			const novel_contentData = await queryDatabase(sql8, [data.Reading_Record,NovelID]);
			console.log(novel_contentData);
			data.scrollNumber=novel_contentData==''?0:novel_contentData[0].scrollNumber;
			data.scrollInNumber=novel_contentData==''?0:novel_contentData[0].scrollInNumber;
			data.Title=novel_contentData==''?"暂未导入":novel_contentData[0].Title;
		}
		

		// novels表 小说周边的信息(同分类)
		var sql6="select Title from novels WHERE Label = ? ORDER BY RAND() LIMIT 4";
		const novelsSurroundingsData1 = await queryDatabase(sql6, [Label]);
		console.log(novelsSurroundingsData1)
		data.novelsSurroundingsLabel=novelsSurroundingsData1

		// novels表 小说周边的信息(同作者)
		var sql7="select Title from novels WHERE Author = ? ORDER BY RAND() LIMIT 4";
		const novelsSurroundingsData2 = await queryDatabase(sql7, [Author]);
		console.log(novelsSurroundingsData2)
		data.novelsSurroundingsAuthor=novelsSurroundingsData2


		response.send(data);
		
	} catch (err) {
		console.error('获取信息时出错:', err);
		response.status(500).send('小说查询失败');
	}
})

//users表输出 获取用户阅读字体大小
app.get('/font_size',function(request,response){
	try{

		//获取数据
		var userid=request.query.userid;
		console.log(userid);
		//从数据库中获取大小
		var sql1="select FontSize from users WHERE Id = ?";
		db.query(sql1,[userid],function(err,results1){
			FontSize=results1[0].FontSize;
			response.json(FontSize);
		})
	} catch (err) {
		console.error('获取信息时出错:', err);
		response.status(500).send('小说查询失败');
	}
})

//novel_content表输出 获取目录
app.get('/get_book_Contents',function(request,response){
	try{

		//获取小说名
		var title=request.query.title;
		console.log(title);
		//从数据库中获取小说id
		var sql1="select NovelID,Author from novels WHERE Title = ?";
		db.query(sql1,[title],function(err,results1){
			NovelID=results1[0].NovelID;
			Author=results1[0].Author;
			console.log(NovelID);

			//获取目录信息
			var sql2 = "select scrollNumber,Novelorder, scrollInNumber, Title, scrollTitle from novel_content WHERE NovelID = ?";
			db.query(sql2, [NovelID], function(err, results2) {
				
				// 检查 results2 是否已定义且为数组
				if (!Array.isArray(results2) || results2.length === 0) {
					response.status(404).send('未找到数据');
				} else {
					//数据处理
					const Packet_Data = results2.reduce((acc, chapter) => {
						// 如果 acc 中还没有这个 scrollNumber 的键，则初始化为一个空数组
						if (!acc[chapter.scrollNumber]) {
						  acc[chapter.scrollNumber] = [];
						}
						// 将当前章节添加到对应 scrollNumber 的数组中
						acc[chapter.scrollNumber].push(chapter);
						// 返回累加器对象
						return acc;
					}, {});
					Packet_Data.Author=Author;
					console.log(Packet_Data);
					response.json(Packet_Data); // 使用 json() 方法发送 JSON 响应
				}

			});
		})

	} catch (err) {
		console.error('获取信息时出错:', err);
		response.status(500).send('小说查询失败');
	}
})

//novel_content表输出 获取小说内容
app.get('/get_book_Contents_Read',function(request,response){
	try{

		//获取小说名
		var Novelorder=request.query.Novelorder;
		var noveltitle=request.query.noveltitle;
		console.log('get_book_Contents_Read函数',Novelorder,noveltitle);
		//从数据库中获取小说id
		var sql1="SELECT NovelID FROM novels WHERE Title = ? ";
		db.query(sql1,[noveltitle],function(err,results1){
			console.log(results1[0].NovelID);
			var NovelID=results1[0].NovelID

			//从数据库中获取小说内容
			var sql2="select scrollNumber,scrollInNumber,Title,Content from novel_content WHERE Novelorder = ? AND NovelID =?";
			db.query(sql2,[Novelorder,NovelID],function(err,results2){
				console.log(results2);
				response.send(results2);

			})
		})
		

	} catch (err) {
		console.error('获取信息时出错:', err);
		response.status(500).send('小说查询失败');
	}
})

//novel_content表输出 获取小说下一页内容
app.get('/get_next_page',function(request,response){
	try{
		var noveltitle=request.query.noveltitle;//获取小说标题
		var scrollTitle=request.query.scrollTitle;//获取当前小说卷名
		console.log('get_next_page函数',noveltitle,scrollTitle);
		//从数据库中获取小说id
		var sql1="SELECT NovelID FROM novels WHERE Title = ? ";
		db.query(sql1,[noveltitle,scrollTitle],function(err,results1){
			console.log(results1[0].NovelID);
			var NovelID=results1[0].NovelID
			//通过id进行查找最大值
			var sql2="SELECT MAX(Novelorder) AS max_Novelorder FROM novel_content WHERE NovelID = ? ";

			db.query(sql2,[NovelID],function(err,results2){
				console.log(results2);
				
				response.send(results2);

			})

		})
		

	} catch (err) {
		console.error('获取信息时出错:', err);
		response.status(500).send('小说查询失败');
	}
})

//users表 判断是否有自定义图片和现在的阅读背景
app.get('/get_Reading_Img',function(request,response){
	try{

		//获取小说名
		var id=request.query.id;
		console.log('get_Reading_Img函数',id);
		//从数据库中获取现在的阅读背景
		var sql1="select BackgroundType, BackgroundImage from users WHERE Id = ? ";
		db.query(sql1,[id],function(err,results1){
			console.log('get_Reading_Img函数sql1',results1);
			if (results1[0].BackgroundType==3) {
				//获取图片
				
				const sql2 = 'select BackgroundImage from users WHERE Id = ? ';  
				db.query(sql2, [id], (err, results2) => {  
					if(err){
						
					}else{
						const imageBuffer = results2[0].BackgroundImage;
						const savePath = path.join(__dirname, 'download','BackgroundImage', 'BackgroundImage'+id+'.jpg'); 
						const writeStream = fs.createWriteStream(savePath);
						writeStream.write(imageBuffer, (writeErr) => {
							if (writeErr) {
								console.error('Error writing image to file:', writeErr);
							} else {
								console.log('Image successfully saved to', savePath);
							}
							writeStream.end();
						});
					}
				});  


			}
			//返回类型
			if (results1[0].BackgroundImage!=null) {
				results1[0].BackgroundImage=3;
			}
			response.json(results1[0]);

		})

	} catch (err) {
		console.error('获取信息时出错:', err);
		response.status(500).send('小说查询失败');
	}
})

//进行评分
app.post('/change_Scoredata', async function(request, response) {
    try {
        // 0. 获取传入的值
        const id = request.body.id;
        const newscore = request.body.newscored;
        const booktitle = request.body.title;

        // 封装db.query为返回Promise的函数（如果它本身不支持Promise）
        function queryDatabase(sql, params) {
            return new Promise((resolve, reject) => {
                db.query(sql, params, (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            });
        }

        // 1. 获取当前书籍的平均分数，评分人数，以及书籍ID
        const sql1 = "SELECT NovelID, Score, ScoreNumber FROM novels WHERE Title=?";
        const novelData = await queryDatabase(sql1, [booktitle]);
        if (novelData.length === 0) {
            throw new Error('书籍未找到');
        }

		//2.获取当前用户之前的评分
        let { NovelID, Score:oldaverageScore, ScoreNumber } = novelData[0];
        const sql2 = "SELECT Score FROM comment_rating WHERE NovelID=? AND UserID=?";
        const userScoreData = await queryDatabase(sql2, [NovelID, id]);
        const length = userScoreData.length;
        let oldScore = length > 0 ? userScoreData[0].Score : 0;
		var n=1;

        console.log('书籍信息:', { NovelID, oldaverageScore, ScoreNumber });
        console.log('用户评分信息:', { length, oldScore,newscore });

        // 2. 进行计算（这里需要您实现具体的计算逻辑）
		//当期书籍的旧平均分数，   评分人数，  旧评分,  新评分
		//    oldaverageScore,  ScoreNumber,oldScore,Score
		//要求新的平均分，评论人数，新评分
		const newaverageScore=((oldaverageScore*ScoreNumber-oldScore+newscore)/(length == 0 ? ScoreNumber+1 : ScoreNumber)).toFixed(2)
		if (length == 0) {
			ScoreNumber=ScoreNumber+1
			n=0
		}
		console.log(newaverageScore)
		console.log('要存入的',ScoreNumber,newaverageScore,newscore)

		//3.将计算出的新书籍平均分数，人数和该账户对本书的成绩存入数据库
		const sql3 = "UPDATE novels SET Score = ? , ScoreNumber = ? WHERE Title = ?";
        await queryDatabase(sql3, [newaverageScore,ScoreNumber,booktitle]);
		if (n == 0) {
			//新建个人评分
			const sql4 = "INSERT INTO comment_rating (UserID, NovelID, Score,commentLike,commentTread) VALUES (?, ?, ?,0,0);";
			await queryDatabase(sql4, [id,NovelID,newscore]);
		}else{
			//更新个人评分
			const sql5 = "UPDATE comment_rating SET Score = ?  WHERE NovelID=? AND UserID=?";
			await queryDatabase(sql5, [newscore,NovelID, id]);
		}
		

		//4.新的人数和平均分数输出
        response.send(JSON.stringify({ newaverageScore:newaverageScore,ScoreNumber:ScoreNumber })); // 注意：这里只是查询成功，还没有更新评分
    } catch (err) {
        console.error('查询评分时出错:', err);
        response.status(500).send('评分查询失败');
    }
});

//离开后更改阅读信息
app.post('/Return_book_information', async function(request, response) {
    try {
        const Novelorder = request.body.Novelorder;
        const userid = request.body.UserId;
		const noveltitle = request.body.noveltitle;
		const currentBackgroundIndex=request.body.currentBackgroundIndex;
        console.log('Return_book_information', Novelorder, userid,noveltitle);
		// //1.获取书架id 
		var sql1="SELECT NovelID FROM novels WHERE Title = ?";
		db.query(sql1, [noveltitle],function(err,results1){
			const NovelID=results1[0].NovelID
			console.log('1',NovelID)

			// 2. 更改阅读进度
			var sql2="UPDATE bookshelf SET Reading_Record = ? WHERE UserID = ? AND NovelID = ?";
			db.query(sql2, [Novelorder,userid,NovelID],function(err,results1){
				console.log('阅读进度',results1)

		 		// 3. 更改背景样式
				var sql3="UPDATE users SET BackgroundType = ? WHERE Id = ? ";
				db.query(sql3, [currentBackgroundIndex,userid],function(err,results2){
					console.log('背景样式',results2)
					return response.send('更改成功');
				})
				
				 
			
			})
		})
    } catch (err) {
        console.error('处理请求时出错:', err);
        return response.status(500).send('处理请求失败');
    }
});

//添加书籍到书架
app.post('/idaddshelf', async function(request, response) {
    try {
        const bookname = request.body.title;
        const userid = request.body.id;
        console.log('idaddshelf', bookname, userid);

        // 1. 查询书本的ID
		var sql1="SELECT NovelID FROM novels WHERE Title = ?";
		db.query(sql1, [bookname],function(err,results1){
			const NovelID=results1[0].NovelID
			console.log('1',NovelID)

			// 2. 检查书本是否已添加到账户上
			var sql2="SELECT COUNT(*) as count FROM bookshelf WHERE UserID = ? AND NovelID = ?";
			db.query(sql2, [userid,NovelID],function(err,results2){
				const isAdded = results2[0].count > 0;

				//判断
				if (isAdded) {
					        // 3. 已有添加，返回已添加过的信息
					return response.send('书架添加过');
				} else {
					        // 4. 未添加，进行添加
					const sql3 = "INSERT INTO bookshelf (UserID, NovelID,Reading_Record) VALUES (?, ?,1)";
					db.query(sql3, [userid,NovelID],function(err,results3){
						return response.send('书籍已成功添加到书架');
					})
				}
			})
		})

		


    //     const sql1 = "SELECT NovelID FROM novels WHERE Title = ?";
    //     const [results1, fields1] = await db.query(sql1, [bookname]); // 假设db.query返回[results, fields]

    //     if (results1.length === 0) {
    //         return response.status(404).send('书籍未找到');
    //     }

    //     const bookId = results1[0].NovelID;

    //     
    //     const sql2 = "SELECT COUNT(*) as count FROM bookshelf WHERE UserID = ? AND NovelID = ?";
    //     const [results2, fields2] = await db.query(sql2, [userid, bookId]);

    //     const isAdded = results2[0].count > 0;

    //     if (isAdded) {
    //         // 3. 已有添加，返回已添加过的信息
    //         return response.send('书架添加过');
    //     } else {
    //         // 4. 未添加，进行添加
    //         const sql3 = "INSERT INTO bookshelf (UserID, NovelID,Reading_Record) VALUES (?, ?,0)";
    //         await db.query(sql3, [userid, bookId]);
    //         return response.send('书籍已成功添加到书架');
    //     }
    } catch (err) {
        console.error('处理请求时出错:', err);
        return response.status(500).send('处理请求失败');
    }
});



//在书架上移除书籍
app.post('/removebook', async function(request, response) {
    try {
        const Novel = request.body.title;
        const userid = request.body.id;
        console.log('removebook', Novel, userid);
		//1.获取书架id
		var sql1="SELECT NovelID FROM novels WHERE Title = ?";
		db.query(sql1, [Novel],function(err,results1){
			const NovelID=results1[0].NovelID
			console.log('1',NovelID)

			// 2. 移除书架
			var sql2="DELETE FROM bookshelf WHERE UserID = ? AND NovelID = ?";
			db.query(sql2, [userid,NovelID],function(err,results1){
				console.log('返回',results1)

				// 2. 已有添加，返回已添加过的信息
				return response.send('删除成功');
			
			})
		})
    } catch (err) {
        console.error('处理请求时出错:', err);
        return response.status(500).send('处理请求失败');
    }
});


//书本评论的赞
app.post('/Booklike', async function(request, response) {
    try {
        const Score = request.body.Score+1;
        const UserId = request.body.UserId;
		const NovelId = request.body.NovelId;
        console.log('Booklike', Score,UserId,NovelId);
		var sql1="UPDATE comment_rating SET commentLike = ? WHERE UserID = ? AND NovelID = ? ;";
		db.query(sql1, [Score,UserId,NovelId],function(err,results1){
			return response.send('成功');
		})
    } catch (err) {
        console.error('处理请求时出错:', err);
        return response.status(500).send('处理请求失败');
    }
});

//书本评论的踩
app.post('/BookTread', async function(request, response) {
    try {
        const Score = request.body.Score+1;
        const UserId = request.body.UserId;
		const NovelId = request.body.NovelId;
        console.log('BookTread', Score,UserId,NovelId);
		var sql1="UPDATE comment_rating SET commentTread = ? WHERE UserID = ? AND NovelID = ? ;";
		db.query(sql1, [Score,UserId,NovelId],function(err,results1){
			return response.send('成功');
		})
    } catch (err) {
        console.error('处理请求时出错:', err);
        return response.status(500).send('处理请求失败');
    }
});

//更改小说信息（管理员端）
app.post('/ChangeNovel', async function(request, response) {
    try {
        //获取数据
        const NovelID = request.body.NovelID;
        const Title = request.body.Title;
        const Author = request.body.Author;
        const Label = request.body.Label;
        const BriefIntroduction = request.body.BriefIntroduction;
        const UpdatedAt = moment(request.body.UpdatedAt).utc().format('YYYY-MM-DD HH:mm:ss');;
        console.log('ChangeNovel接口', request.body)

        //查看名称是否重复
        var sql1 = "SELECT COUNT(*) AS count FROM novels WHERE Title = ?";
        db.query(sql1, [Title], function(err, results1) {
            if (err) {
                console.error('数据库操作失败:', err);
                return response.status(500).send('数据库操作失败');
            }
            console.log(results1[0].count);
            if (results1[0].count == 0) {
                var sql2 = "UPDATE novels SET Title = ?, Author = ?, Label = ?, BriefIntroduction = ?, UpdatedAt = ? WHERE NovelID = ?";
                db.query(sql2, [Title, Author, Label, BriefIntroduction, UpdatedAt, NovelID], function(err, results2) {
                    if (err) {
                        console.error('数据库操作失败:', err);
                        return response.status(500).send('数据库操作失败');
                    } else {
                        return response.send('ok');
                    }
                });
            } else {
                // 这里不需要 return，因为如果用户名被占用，我们不会执行 sql2
                return response.send('Username is occupied');
            }
        });

    } catch (err) {
        console.error('处理请求时出错:', err);
        return response.status(500).send('处理请求失败');
    }
});

//更改账户信息（管理员端）
app.post('/ChangeUser', async function(request, response) {
    try {
        //获取数据
        const UserId = request.body.UserId;
        const Usersname = request.body.Usersname;
        const Passe = request.body.Passe;
        const usertype = request.body.usertype;
        const BackgroundType = request.body.BackgroundType;
        const FontSize = request.body.FontSize;
        console.log('ChangeUser', request.body)

        //查看名称是否重复
        var sql1 = "SELECT COUNT(*) AS count FROM users WHERE Usersname = ?";
        db.query(sql1, [Usersname], function(err, results1) {
            if (err) {
                console.error('数据库操作失败:', err);
                return response.status(500).send('数据库操作失败');
            }
            console.log(results1[0].count);
            if (results1[0].count === 0) {
                var sql2 = "UPDATE users SET Usersname = ?, Pass = ?, BackgroundType = ?, FontSize = ?, usertype = ? WHERE Id = ?";
                db.query(sql2, [Usersname, Passe, BackgroundType, FontSize, usertype, UserId], function(err, results2) {
                    if (err) {
                        console.error('数据库操作失败:', err);
                        return response.status(500).send('数据库操作失败');
                    } else {
                        return response.send('ok');
                    }
                });
            } else {
                // 这里不需要 return，因为如果用户名被占用，我们不会执行 sql2
                return response.send('Username is occupied');
            }
        });

    } catch (err) {
        console.error('处理请求时出错:', err);
        return response.status(500).send('处理请求失败');
    }
});
// app.post('/ChangeUser', async function(request, response) {
//     try {
// 		//获取数据
//         const UserId = request.body.UserId;
//         const Usersname = request.body.Usersname;
// 		const Passe = request.body.Passe;
//         const usertype = request.body.usertype;
// 		const BackgroundType = request.body.BackgroundType;
//         const FontSize = request.body.FontSize;
// 		console.log('ChangeUser',request.body)
		
// 		//查看名称是否重复

// 		var sql1 = "SELECT COUNT(*)AS count FROM users WHERE Usersname = ?;";
// 		db.query(sql1, [Usersname], function(err, results1) {
// 			if (err) {
// 				console.error('数据库操作失败:', err);
// 				return response.status(500).send('数据库操作失败');
// 			}
// 			console.log(results1[0].count);
// 			if (results1[0].count==0) {
// 				var sql2 = "UPDATE users SET Usersname = ?,Pass = ?,BackgroundType = ?,FontSize = ?,usertype = ? WHERE Id = ?;";
// 				db.query(sql2, [Usersname,Passe,BackgroundType,FontSize,usertype,UserId], function(err, results2) {
// 					if (err) {
// 						console.error('数据库操作失败:', err);
// 						return response.status(500).send('数据库操作失败');
// 					}else{
// 						return response.send('ok');
// 					}
// 				})
// 			}
// 			return response.send('Username is occupied');
// 		});

//     } catch (err) {
//         console.error('处理请求时出错:', err);
//         return response.status(500).send('处理请求失败');
//     }
// });

//更改账户信息（用户端）
app.post('/ChangeAccount', async function(request, response) {
    try {
        const id = request.body.id;
        const account = request.body.account;
		const password = request.body.password;
        console.log('ChangeAccount函数', id,account,password);
		if (account=='') {
			var sql1="UPDATE users SET Pass = ? WHERE id = ?  ;";
			db.query(sql1, [password,id],function(err,results1){
				return response.send('密码');
			})
		}else if (password=='') {
			var sql1="UPDATE users SET Usersname = ? WHERE id = ?  ;";
			db.query(sql1, [account,id],function(err,results1){
				return response.send('用户名');
			})
		}else{
			var sql1="UPDATE users SET Usersname = ? , Pass = ? WHERE id = ? ;";
			db.query(sql1, [account,password,id],function(err,results1){
				return response.send('用户名、密码');
			})
		}
    } catch (err) {
        console.error('处理请求时出错:', err);
        return response.status(500).send('处理请求失败');
    }
});

//发布书本书评
app.post('/BookReview', async function(request, response) {
    try {
		console.log('BookReview', request.body);
        const Score = request.body.Score;
        const Textarea = request.body.Textarea;
        const UserId = request.body.UserId;
        const NovelId = request.body.NovelId;

		var sql1 = "SELECT COUNT(*) AS count FROM comment_rating WHERE UserID = ? AND NovelID = ?;";
		db.query(sql1, [UserId,NovelId],function(err,results1){
			console.log(results1);
			const count = results1[0].count;
			if (count == 1) {
				console.log("存在");
				//数据进行修改
				var sql2 = "UPDATE comment_rating SET Score = ? , Content = ? WHERE UserID = ? AND NovelID = ?;";
				db.query(sql2, [Score,Textarea,UserId,NovelId],function(err,results2){
					console.log(results2);
					return response.send('修改完成');
				})
			} else{
				//不存在数据，进行创建
				console.log("不存在");
				var sql3 = "INSERT INTO comment_rating (UserID, NovelID, Score, Content, commentLike, commentTread) VALUES (?, ?, ?, ?, 0, 0);";
				db.query(sql3, [UserId, NovelId, Score, Textarea], function(err, results3) {
					if (err) {
						console.error('数据库操作失败:', err);
						return response.status(500).send('数据库操作失败');
					}
					console.log(results3);
					return response.send('添加完成');
				});
			}
			
		})
    } catch (err) {
        console.error('处理请求时出错:', err);
        return response.status(500).send('处理请求失败');
    }
});

//更改背景图片类型
app.post('/Change_background_type', async function(request, response) {
    try {
        const id = request.body.id;
        const bgtype = request.body.bgtype;
		console.log('Change_background_type',id,bgtype)
		
		var sql = "UPDATE users SET BackgroundType = ? WHERE Id = ?  ;";
		db.query(sql, [bgtype, id], function(err, results3) {
			if (err) {
				console.error('数据库操作失败:', err);
				return response.status(500).send('数据库操作失败');
			}
			console.log(results3);
			return response.send('添加完成');
		});
			
			
		
    } catch (err) {
        console.error('处理请求时出错:', err);
        return response.status(500).send('处理请求失败');
    }
});

//更改阅读字体大小
app.post('/Change_font_size', async function(request, response) {
    try {
        const id = request.body.id;
        const SliderValue = request.body.SliderValue;
		console.log('Change_font_size',id,SliderValue)
		
		var sql = "UPDATE users SET FontSize = ? WHERE Id = ?  ;";
		db.query(sql, [SliderValue, id], function(err, results3) {
			if (err) {
				console.error('数据库操作失败:', err);
				return response.status(500).send('数据库操作失败');
			}
			console.log(results3);
			return response.send('更改完成');
		});
			
			
		
    } catch (err) {
        console.error('处理请求时出错:', err);
        return response.status(500).send('处理请求失败');
    }
});

//更改背景图片
app.post('/Change_background_image', upload2.single('file'), (req, res) => {
	if (!req.file) {
	  return res.status(400).send('No file uploaded.');
	}
	  
		// 构建文件路径
	const filePath = path.join(__dirname, 'download','BackgroundImage', req.file.originalname);
	const regex = /BackgroundImage(\d+)\.jpg/;
	var originalname=req.file.originalname;
	var id = originalname.match(regex)[1];
		// 读取文件并转换为 BLOB
	fs.readFile(filePath, (err, data) => {
		if (err) {
			return res.status(500).send('Error reading file.');
		}

				// 插入 BLOB 数据到数据库
		const query = 'UPDATE users SET BackgroundImage = ? WHERE Id = ? ;';
		db.query(query, [ data,id], (err, results) => {
		
			if (err) {
				return res.status(500).send('Error saving image to database.');
			}
				
			res.json({ message: 'Image uploaded and saved to database successfully.' });
		});
	
	});
});


  //上传图片
  app.post('/UploadProfilePicture', upload1.single('file'), (req, res) => {
	if (!req.file) {
	  return res.status(400).send('No file uploaded.');
	}
  
	// 构建文件路径
	const filePath = path.join(__dirname, 'download', req.file.originalname);
	const regex = /ProfilePicture(\d+)\.jpg/;
	var originalname=req.file.originalname;
	var id = originalname.match(regex)[1];
	// 读取文件并转换为 BLOB
	fs.readFile(filePath, (err, data) => {
	  if (err) {
		return res.status(500).send('Error reading file.');
	  }
  

  
		// 插入 BLOB 数据到数据库
		const query = 'UPDATE users SET ProfilePictureURL = ? WHERE Id = ? ;';
		db.query(query, [ data,id], (err, results) => {
  
		  if (err) {
			return res.status(500).send('Error saving image to database.');
		  }
		  
		  res.json({ message: 'Image uploaded and saved to database successfully.' });
		});

	});
  });


//控制运行
app.listen(3000,function(){
	console.log("服务器正常运行")
});