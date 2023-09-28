const express = require('express');
const mysql = require('mysql');
const dbConfig = require('./config/dbConfig.js');
const connection = mysql.createConnection(dbConfig);
const app = express();
const port = 3000;

// MySQL 연결
// app.set('port', process.env.PORT || 3000);

connection.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// GET 요청에 대한 라우트 예시: 사용자 목록 가져오기
app.get('/api/users', (req, res) => {
  // MySQL에서 사용자 목록을 가져오는 쿼리 실행
  const sql = 'SELECT * FROM User';
  
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    
    res.json(results); // MySQL 결과를 JSON 형태로 응답
  });
});

app.use(express.json());

// POST 요청에 대한 라우트 새로운 사용자 추가
app.post('/api/users', (req, res) => {
  const { User_id, password, nickname } = req.body;
  
  // MySQL에 사용자 추가하는 쿼리 실행
  const sql = 'INSERT INTO User (User_id, password, nickname) VALUES (?, ?, ?)';
  const values = [User_id, password, nickname];
  
  connection.query(sql, values, (err) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    
    res.status(201).send('User added successfully');
  });
});


// 운동로그 기록
app.post('/api/exercise', (req, res) => {
  const { User_id, exercise_type, exercise_count, exercise_date } = req.body;
  
  // MySQL에 운동기록 추가하는 쿼리 실행
  const sql = 'INSERT INTO Exercise_log (User_id, exercise_type, exercise_count, exercise_date) VALUES (?, ?, ?, ? )';
  const values = [User_id, exercise_type, exercise_count, exercise_date ];
  
  connection.query(sql, values, (err) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    
    res.status(201).send('log added successfully');
  });
});

// 기타 라우트 설정

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


// configuration =========================


app.get('/', (req, res) => {
  res.send('Root');
});

app.get('/users', (req, res) => {
  connection.query('SELECT * from User', (error, rows) => {
    if (error) throw error;
    console.log('User info is: ', rows);
    res.send(rows);
  });
});

app.get('/exercise', (req, res) => {
  connection.query('SELECT * from Exercise_log', (error, rows) => {
    if (error) throw error;
    console.log('User info is: ', rows);
    res.send(rows);
  });
});
