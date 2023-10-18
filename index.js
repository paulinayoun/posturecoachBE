const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const dbConfig = require('./config/dbConfig.js');
const connection = mysql.createConnection(dbConfig);
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());



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
  const sql = 'SELECT * FROM user_account';
  
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    
    res.json(results); // MySQL 결과를 JSON 형태로 응답
  });
});

app.get('/api/exercise', (req, res) => {
  // MySQL에서 운동 목록을 가져오는 쿼리 실행
  const sql = 'SELECT * FROM exercise_log';
  
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    
    res.json(results); // MySQL 결과를 JSON 형태로 응답
  });
});

app.get('/api/machine', (req, res) => {
  // MySQL에서 기구 목록을 가져오는 쿼리 실행
  const sql = 'SELECT * FROM machine_list';
  
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    
    res.json(results); // MySQL 결과를 JSON 형태로 응답
  });
});

app.get('/api/physical', (req, res) => {
  // MySQL에서 사용자 목록을 가져오는 쿼리 실행
  const sql = 'SELECT * FROM user_physical';
  
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    
    res.json(results); // MySQL 결과를 JSON 형태로 응답
  });
});

app.get('/api/ranking/my', (req, res) => {
  const sql = 'select ranking from (select rank() over (order by sum(exercise_count) desc) as ranking, user_id, sum(exercise_count) from exercise_log where date(exercise_date) = curdate() group by user_id) A where user_id = "ponyo"';
  
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    
    res.json(results); // MySQL 결과를 JSON 형태로 응답
  })
});

app.get('/api/ranking/today', (req, res) => {
  const sql = 'select A.user_name, sum(B.exercise_count) AS exercise_count from user_account A join exercise_log B on A.user_id = B.user_id where date(exercise_date)=curdate() group by B.user_id order by sum(exercise_count) desc';
  
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    
    res.json(results); // MySQL 결과를 JSON 형태로 응답
  })
});

app.get('/api/ranking/physical', (req, res) => {
  const sql = 'select D.machine_name, avg(C.exercise_count) as exercise_count from (select A.user_id, B.machine_code, B.exercise_count, B.exercise_date from (select u2.user_id AS user_id, u2.height AS height, u2.weight AS weight, (u2.weight / (u2.height / 100 * u2.height / 100)) AS BMI from user_physical u1, user_physical u2 where u1.user_id = "ponyo" and u2.user_id != "ponyo" and abs(u1.weight / (u1.height / 100 * u1.height / 100) - u2.weight / (u2.height / 100 * u2.height / 100)) <= 1) A join exercise_log B on A.user_id = B.user_id where date(B.exercise_date) between date_sub(curdate(), interval 6 day) and curdate()) C join machine_list D on C.machine_code = D.machine_code group by C.machine_code order by exercise_count desc';
  
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    
    res.json(results); // MySQL 결과를 JSON 형태로 응답
  })
});

app.get('/api/ranking/birth', (req, res) => {
  const sql = 'select D.machine_name, avg(C.exercise_count) as exercise_count from (select A.user_id, B.machine_code, B.exercise_count, B.exercise_date from (select * from user_physical where datediff((select birth from user_physical where user_id = "ponyo"), birth) between -365 and 365) A join exercise_log B on A.user_id = B.user_id where date(B.exercise_date) between date_sub(curdate(), interval 6 day) and curdate() and B.user_id != "ponyo") C join machine_list D on C.machine_code = D.machine_code group by C.machine_code order by exercise_count desc';
  
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    
    res.json(results); // MySQL 결과를 JSON 형태로 응답
  })
});

app.use(express.json());

app.post('/api/login', (req, res) => {
  const { user_id, user_pw } = req.body;

  const sql = 'select * from user_account where user_id = ? and user_pw = ?';
  const values = [user_id, user_pw];

  connection.query(sql, values, (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    if (results.length > 0) {
      res.status(200).json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, message: 'Login failed' });
    }
  });
})

// POST 요청에 대한 라우트 새로운 사용자 추가
app.post('/api/users', (req, res) => {
  const { user_id, user_pw, user_name } = req.body;
  
  // MySQL에 사용자 추가하는 쿼리 실행
  const sql = 'INSERT INTO user_account (user_id, user_pw, user_name) VALUES (?, ?, ?)';
  const values = [user_id, user_pw, user_name];
  
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
  const { user_id, machine_code, exercise_count, exercise_date } = req.body;
  
  // MySQL에 운동기록 추가하는 쿼리 실행
  const sql = 'INSERT INTO exercise_log (user_id, machine_code, exercise_count, exercise_date) VALUES (?, ?, ?, ? )';
  const values = [ user_id, machine_code, exercise_count, exercise_date ];
  
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


// app.get('/', (req, res) => {
//   res.send('Root');
// });

// app.get('/users', (req, res) => {
//   connection.query('SELECT * from User', (error, rows) => {
//     if (error) throw error;
//     console.log('User info is: ', rows);
//     res.send(rows);
//   });
// });

// app.get('/exercise', (req, res) => {
//   connection.query('SELECT * from Exercise_log', (error, rows) => {
//     if (error) throw error;
//     console.log('User info is: ', rows);
//     res.send(rows);
//   });
// });
