# tmxb.NovelWEB
小说网站（vue+node.js+mysql）

演示地址：https://www.bilibili.com/video/BV1w6TRzFEXg

**前端**

<img width="471" height="279" alt="image" src="https://github.com/user-attachments/assets/fc33ea16-bf2e-4375-bfa6-6c4972e5185e" />

登录页面

<img width="508" height="290" alt="image" src="https://github.com/user-attachments/assets/9b46c5c4-0c36-4774-91ff-b9abb9d0f256" />

注册页面

<img width="555" height="399" alt="image" src="https://github.com/user-attachments/assets/d995f154-4bda-4461-8dc2-6043afa2bfa5" />

首页

<img width="546" height="315" alt="image" src="https://github.com/user-attachments/assets/0fbeb6e7-5c6f-4e60-bd31-282ea99b0b3f" />
详细页面

**后端**

启动代码
```
node server.js
```


**数据库**

<img width="579" height="299" alt="image" src="https://github.com/user-attachments/assets/e9240e72-9cea-43d6-bbf4-ce3f744ac717" />

结构图

Users表设计

| 名称              | 类型     | 长度 | 小数点 | 不是 null | 虚拟 | 键   |
| ----------------- | -------- | ---- | ------ | --------- | ---- | ---- |
| Id                | int      | 0    | 0      | 是        | 否   | 主键 |
| Username          | varchar  | 50   | 0      | 是        | 否   |      |
| Pass              | varchar  | 255  | 0      | 是        | 否   |      |
| ProfilePictureURL | longblob | 0    | 0      | 否        | 否   |      |
| BackgroundType    | int      | 0    | 0      | 是        | 否   |      |
| BackgroundImage   | longblob | 0    | 0      | 否        | 否   |      |
| FontSize          | int      | 0    | 0      | 是        | 否   |      |
| usertype          | tinyint  | 1    | 0      | 是        | 否   |      |

Novels表设计

| 名称              | 类型      | 长度 | 小数点 | 不是 null | 虚拟 | 键   |
| ----------------- | --------- | ---- | ------ | --------- | ---- | ---- |
| NovelID           | int       | 0    | 0      | 是        | 否   | 主键 |
| Title             | varchar   | 255  | 0      | 是        | 否   |      |
| Author            | varchar   | 255  | 0      | 是        | 否   |      |
| Label             | varchar   | 100  | 0      | 否        | 否   |      |
| CoverImageURL     | longblob  | 0    | 0      | 否        | 否   |      |
| BriefIntroduction | longtext  | 0    | 0      | 否        | 否   |      |
| Score             | float     | 3    | 2      | 否        | 否   |      |
| ScoreNumber       | int       | 0    | 0      | 否        | 否   |      |
| UpdatedAt         | timestamp | 0    | 0      | 否        | 否   |      |

novel_content表设计

| 名称           | 类型       | 长度 | 小数点 | 不是 null | 虚拟 | 键   |
| -------------- | ---------- | ---- | ------ | --------- | ---- | ---- |
| ChapterID      | int        | 0    | 0      | 是        | 否   | 主键 |
| NovelID        | int        | 0    | 0      | 是        | 否   |      |
| Novelorder     | int        | 0    | 0      | 是        | 否   |      |
| scrollNumber   | int        | 0    | 0      | 是        | 否   |      |
| scrollInNumber | int        | 0    | 0      | 是        | 否   |      |
| Title          | mediumtext | 0    | 0      | 是        | 否   |      |
| Content        | longtext   | 0    | 0      | 是        | 否   |      |
| scrollTitle    | varchar    | 255  | 0      | 否        | 否   |      |

comment_rating表设计

| 名称          | 类型      | 长度 | 小数点 | 不是 null | 虚拟 | 键   |
| ------------- | --------- | ---- | ------ | --------- | ---- | ---- |
| ReviewID      | int       | 0    | 0      | 是        | 否   | 主键 |
| UserID        | int       | 0    | 0      | 否        | 否   |      |
| NovelID       | int       | 0    | 0      | 否        | 否   |      |
| Score         | float     | 0    | 0      | 否        | 否   |      |
| Content       | text      | 0    | 0      | 否        | 否   |      |
| CreatedAt     | timestamp | 0    | 0      | 否        | 否   |      |
| commentLike   | int       | 0    | 0      | 是        | 否   |      |
| commentUnread | int       | 0    | 0      | 是        | 否   |      |

Bookshelf表设计

| 名称           | 类型 | 长度 | 小数点 | 不是 null | 虚拟 | 键   |
| -------------- | ---- | ---- | ------ | --------- | ---- | ---- |
| bookshelfID    | int  | 0    | 0      | 是        | 否   | 主键 |
| UserID         | int  | 0    | 0      | 否        | 否   |      |
| NovelID        | int  | 0    | 0      | 否        | 否   |      |
| Reading_Record | int  | 0    | 0      | 否        | 否   |      |

