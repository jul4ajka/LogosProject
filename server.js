//Підключаємо бібліотеки - модулі
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
 
const twilio = require('twilio');
const clientTwilio = new twilio('AC61109e0464e61bd958c096382c090c2b', 'a9f36ab9447058b4761dfd274d1960d8');
const fs = require('fs');

//Підключаємо скрипт читання/запису у текстовий файл
require('./js/about-item');
//Підключаємо скрипт з логіном і паролем до пошти
const mail = require('./js/mail');

//Конектимось до пошти
const nodemailer = require('nodemailer'),
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: mail.mail,
            pass: mail.pass
        },
    }),
    EmailTemplate = require('email-templates').EmailTemplate,
    path = require('path'),
    Promise = require('bluebird');

const multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/img/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname);
    }
});

var upload = multer({
    storage: storage
});

const port = process.env.PORT || 8000;
//const port = 8000;

//Клієнтська частина сайту знаходитиметься у папці public
app.use(express.static(__dirname + '/public'));
//Стандарти кодування
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    'extended': 'true'
}));


//Відправка пошти (функція)
function sendEmail(obj) {
    return transporter.sendMail(obj);
}

function loadTemplate(templateName, contexts) {
    let template = new EmailTemplate(path.join(__dirname, 'mail_templates', templateName));
    return Promise.all(contexts.map((context) => {
        return new Promise((resolve, reject) => {
            template.render(context, (err, result) => {
                if (err) reject(err);
                else resolve({
                    email: result,
                    context,
                });
            });
        });
    }));
}


//MYSQL
const connection = mysql.createConnection({
    host: 'us-cdbr-iron-east-01.cleardb.net',
    user: 'b0751d8998efdc',
    password: 'a738999b',
    database: 'heroku_6952263a66d0f52'
});

// Ставорення таблиці користувачів
let initDb = function () {
    //створити таблицю юзерів(якщо не було)   
    connection.query('' +
        'CREATE TABLE IF NOT EXISTS users (' +
        'id int(11) NOT NULL AUTO_INCREMENT,' +
        'login varchar(50), ' +
        'password varchar(50),' +
        'PRIMARY KEY(id), ' +
        'UNIQUE INDEX `login_UNIQUE` (`login` ASC))',
        function (err) {
            if (err) throw err;
            //додати адміна в таблицю юзерів(якщо не має)
            console.log('DB created if not exist');

        });
};

initDb();

//Отримання користувачів
app.post('/users', function (req, res) {
    connection.query('SELECT * FROM users', function (err, rows) {
        if (err) throw err;
        for (var i = 0; i < rows.length; i++) {
            if (rows[i].login == req.body.login) {
                if (rows[i].password == req.body.password) {
                    res.status(200).send('WELCOME ' + req.body.login);
                    break;
                } else {
                    res.status(200).send('Wrong Password');
                    break;
                }
            } else {
                if (i == rows.length - 1) {
                    res.status(200).send('Wrong Login');
                }
            }
        }
    });
});

//Нагадати пароль 
app.post('/remind', function (req, res) {
    connection.query('SELECT * FROM users  WHERE mail = ?',req.body.mail, function (err, rows) {
        if (err) throw err;
        if (rows[0] != undefined) {
            loadTemplate('forget-password', rows).then((results) => {
                return Promise.all(results.map((result) => {
                    sendEmail({
                        to: req.body.mail, // замінити на свою пошту
                        from: 'kaka@bk.ru',
                        subject: result.email.subject,
                        html: result.email.html,
                        text: result.email.text,
                    });
                }));
            }).then(() => {
                res.status(200).send("Sent password!");
            });

        } else {
            res.status(200).send("wrong mail");
        }

    });
});


//Добавити користувача
app.post('/signUp', function (req, res) {
    //Перевірка чи такий користувач вже є
    connection.query('SELECT * FROM users  WHERE login = ?', req.body.login, function (err, rows) {
        if (err) throw err;
        if (rows[0] == undefined) {
            connection.query('INSERT INTO users SET login = ? , password = ? , mail = ?', [req.body.login, req.body.password, req.body.mail],
                function (err, result) {
                    if (err) throw err;
                    console.log('user added to database with id: ' + result.insertId);
                            res.status(200).send(req.body.login + " created");
                        }
                    );
                
        } else {
            res.status(200).send("pls choose another login");
        }
    }
    )
});

//Twilio
app.post('/testtwilio', function (req, res) {
    clientTwilio.messages.create({
            body: req.body.code,
            to: req.body.number,
            from: '+15754797458' // валідний Twilio номер+1 575-479-7458 
        })
        .then((message) => console.log(message.sid));
    res.sendStatus(200);
});

//Отримання товарів
app.get('/items', function (req, res) {
    connection.query('SELECT * FROM items', function (err, rows) {
        if (err) throw err;
        console.log('get all items, length: ' + rows.length);
        res.status(200).send(rows);
    });
});

//Upload images
app.post('/images', upload.any(), function (req, res, next) {
    res.sendStatus(200);
})

//Запис товарів в бд
app.post('/items', function (req, res) {
    connection.query('INSERT INTO items SET ?', req.body,
        function (err, result) {
            if (err) throw err;
            console.log('item added to database with id: ' + result.insertId);
        }
    );
    res.sendStatus(200);
});

//Запис/читання опису товару у текстовий файл
//Читання
app.get('/items-info', function (req, res) {
    var str = new ItemsInfo().readInfo().toString().split('/item/');
    res.status(200).send(str);
});
//Запис
app.post('/items-info', function (req, res) {
    var str = new ItemsInfo().readInfo().toString();
    if (str == "") {
        str = str + req.body.text;
    } else {
        str = str + "/item/" + req.body.text;
    }
    var str2 = new ItemsInfo().writeInfo(str);
    res.sendStatus(200);
});
//Змінити дані товару в бд
app.post('/item-edit/:id', function (req, res) {
    connection.query('UPDATE items SET name = ?, price = ?, src = ? WHERE id = ?',
        [req.body.name, req.body.price, req.body.src, req.params.id],
        function (err) {
            if (err) throw err;
            console.log('item update id: ' + req.params.id);
        }
    );
    res.sendStatus(200);
});
//Зміна опису товару в ткст файлі
app.put('/items-info', function (req, res) {
    var str = new ItemsInfo().writeInfo(req.body.text);
    res.sendStatus(200);
});

//Видалити товар
app.delete('/item/:id', function (req, res) {
    connection.query('DELETE FROM items WHERE id = ?',req.params.id, function (err) {
            if (err) throw err;
            console.log('item delete id: ' + req.body.id);
        }
    );
    res.sendStatus(200);
});
//Усі адреси контролюються клієнтським ангуляром
app.get('*', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});


//Запуск серверу
app.listen(port, function (err) {
    if (err) throw err;
    console.log('Server start on port 8000!');
});
