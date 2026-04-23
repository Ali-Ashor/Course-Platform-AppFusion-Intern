const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const path = require('path');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// ================= DATABASE =================
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.log(err);
    else console.log("SQLite Connected ");
});

// Create Tables
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT,
    password TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    price INTEGER,
    description TEXT
)`);

// ================= ROUTES =================

// Home
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// SIGNUP
app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;

    db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
        [username, email, password],
        function(err) {
            if (err) return res.send("Error ");

            res.send("Signup Successful  <br><a href='/'>Go Back</a>");
        }
    );
});

// LOGIN
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email=? AND password=?`,
        [email, password],
        (err, user) => {
            if (user) {
                req.session.user = user;
                res.send("Login Success  <br><a href='/courses'>View Courses</a>");
            } else {
                res.send("Invalid Credentials ");
            }
        }
    );
});

// ADD COURSE (Admin)
app.post('/add-course', (req, res) => {
    const { title, price, description } = req.body;

    db.run(`INSERT INTO courses (title, price, description) VALUES (?, ?, ?)`,
        [title, price, description],
        function(err) {
            if (err) return res.send("Error ");

            res.send("Course Added ");
        }
    );
});

// SHOW COURSES
app.get('/courses', (req, res) => {

    if (!req.session.user) {
        return res.send("Login First ");
    }

    db.all(`SELECT * FROM courses`, [], (err, rows) => {

        let output = "<h1>Courses</h1>";

        rows.forEach(c => {
            output += `
                <div>
                    <h3>${c.title}</h3>
                    <p>${c.description}</p>
                    <span>$${c.price}</span>
                    <hr>
                </div>
            `;
        });

        res.send(output);
    });
});

// SERVER
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});