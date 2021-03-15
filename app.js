const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const md5 = require('md5');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(
	require('express-session')({
		secret: 'hume nahi pata',
		resave: false,
		saveUninitialized: false,
	})
);
app.use((req, res, next)=>{
	res.locals.currentUser = req.session.username;
	res.locals.isLoggedIn = req.session.isLoggedIn;
	next();
})
const con = mysql.createConnection({
	host: 'sql7.freemysqlhosting.net',
	user: 'sql7388637',
	password: '66xXYgfHWb',
	database: 'sql7388637',
});

con.connect(function (err) {
	if (err) console.log(err);
	else console.log('Connected! to database');
});

app.get('/', (req, res) => {
	res.render('mywebsite');
});

app.get('/teacher', (req, res) => {
	res.render('teacher');
});

app.get('/timetable', (req, res) => {
	let query = `SELECT * FROM timeTable`;
	con.query(query, async function (err, result, fields) {
		if (err) console.log(err);
		else {
			res.render('timetable', { data: result });
		}
	});
});

app.get('/timetable/edit', isLoggedIn, (req, res) => {
	res.render('editTime');
});

app.post('/:lecture/:day', isLoggedIn, async (req, res) => {
	let lecture = req.params.lecture;
	let newLecture = 'lecture_' + lecture;
	let subject = req.body.subject;
	let day = req.params.day.charAt(0).toUpperCase() + req.params.day.slice(1);
	console.log(day);
	let query = `UPDATE timeTable SET ${newLecture} = '${subject}' WHERE day = '${day}'`;
	con.query(query, async function (err, result) {
		if (err) res.render('error', { error: 'Something went wrong' });
		else {
			console.log(`${result.affectedRows} affected!`);
			res.redirect('/timetable');
		}
	});
});

app.get('/register', isLoggedIn, async (req, res) => {
	res.render('register');
});

app.post('/register', isLoggedIn, async (req, res) => {
	let username = req.body.username;
	let password = md5(req.body.password);
	let selectQuery = `SELECT * FROM users WHERE username = '${username}'`;
	con.query(selectQuery, async (err, results, fields) => {
		if (results.length === 0) {
			let query = `INSERT INTO users (username, password) VALUES ('${username}', '${password}')`;
			con.query(query, async function (err, result) {
				if (err) {
					res.send(`Some error occured`);
					res.redirect('/');
				} else {
					req.session.loggedIn = true;
					req.session.username = username;
					res.redirect('/timetable');
				}
			});
		} else {
			res.render('error', { error: 'Username already exist' });
		}
	});
});

app.get('/login', async (req, res) => {
	res.render('login');
});

app.post('/login', async (req, res) => {
	let username = req.body.username;
	let newPassword = md5(req.body.password);
	let query = `SELECT * FROM users WHERE username = '${username}' AND password = '${newPassword}'`;
	if (username && newPassword) {
		con.query(query, async (err, result, fields) => {
			if (err) {
				res.send(`Some error occured`);
				res.redirect('/login');
			} else {
				if (result.length > 0) {
					req.session.loggedIn = true;
					req.session.username = username;
					res.redirect('/');
				} else {
					res.send(`Password is incorrect.`);
					res.redirect('/login');
				}
			}
		});
	} else {
		res.send(`Username or password is missing`);
		res.redirect('/login');
	}
});

app.get('/logout', async (req, res) => {
	req.session.loggedIn = false;
	req.session.username = null;
	res.redirect('/');
});

function isLoggedIn(req, res, next) {
	if (req.session.loggedIn) {
		return next();
	} else {
		res.send(`You need to logged in first`);
		res.redirect('/login');
	}
}

app.listen(8080, () => console.log(`Server is started at port 3000`));
