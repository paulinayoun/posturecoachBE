const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const dbConfig = require('./config/dbConfig.js');
const connection = mysql.createConnection(dbConfig);
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


// MySQL 연결
// app.set('port', process.env.PORT || 3000);

connection.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

app.get('/api/contents', (req, res) => {
  const loggedInUserId = req.query.loggedInUserId;
  // MySQL에서 사용자 목록을 가져오는 쿼리 실행
  const sql = 'select B.machine_name as machineName from exercise_log A join machine_list B on A.machine_code = B.machine_code where A.user_id = ? order by A.exercise_date desc limit 1';
  
  connection.query(sql, [loggedInUserId], (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    
    res.json(results); // MySQL 결과를 JSON 형태로 응답
  });
});

app.get('/api/ranking/my', (req, res) => {
  const loggedInUserId = req.query.loggedInUserId;
  const sql = 'select ranking from (select rank() over (order by sum(exercise_count) desc) as ranking, user_id, sum(exercise_count) from exercise_log where date(exercise_date) = curdate() group by user_id) A where user_id = ?';
  
  connection.query(sql, [loggedInUserId], (err, results) => {
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
  const loggedInUserId = req.query.loggedInUserId;
  const sql = 'select D.machine_name, floor(avg(C.exercise_count)) as exercise_count from (select A.user_id, B.machine_code, B.exercise_count, B.exercise_date from (select u2.user_id AS user_id, u2.height AS height, u2.weight AS weight, (u2.weight / (u2.height / 100 * u2.height / 100)) AS BMI from user_physical u1, user_physical u2 where u1.user_id = ? and u2.user_id != ? and abs(u1.weight / (u1.height / 100 * u1.height / 100) - u2.weight / (u2.height / 100 * u2.height / 100)) <= 1) A join exercise_log B on A.user_id = B.user_id where date(B.exercise_date) = curdate()) C join machine_list D on C.machine_code = D.machine_code group by C.machine_code order by exercise_count desc';
  
  connection.query(sql, [loggedInUserId, loggedInUserId], (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error', details: err.message });
      return;
    }
    
    res.json(results); // MySQL 결과를 JSON 형태로 응답
  })
});

app.get('/api/ranking/birth', (req, res) => {
  const loggedInUserId = req.query.loggedInUserId;
  const sql = 'select D.machine_name, floor(avg(C.exercise_count)) as exercise_count from (select A.user_id, B.machine_code, B.exercise_count, B.exercise_date from (select * from user_physical where datediff((select birth from user_physical where user_id = ?), birth) between -365 and 365) A join exercise_log B on A.user_id = B.user_id where date(B.exercise_date) = curdate() and B.user_id != ?) C join machine_list D on C.machine_code = D.machine_code group by C.machine_code order by exercise_count desc';
  
  connection.query(sql, [loggedInUserId, loggedInUserId], (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error', details: err.message });
      return;
    }
    
    res.json(results); // MySQL 결과를 JSON 형태로 응답
  })
});




app.get('/api/report/weekly', (req, res) => {
  const loggedInUserId = req.query.loggedInUserId;

  if (!loggedInUserId) {
    res.status(400).json({ error: 'User ID not provided' });
    return;
  }

  const sql = 'SELECT IFNULL(el.user_id, ?) AS user_id, IFNULL(ml.machine_name, "none") AS machine_name, IFNULL(el.exercise_count, 0) AS exercise_count, tempDate.exercise_date AS exercise_date FROM (SELECT CURDATE() - INTERVAL (a.a + (10 * b.a)) DAY AS exercise_date FROM (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS a CROSS JOIN (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS b) AS tempDate LEFT JOIN exercise_log el ON tempDate.exercise_date = DATE(el.exercise_date) AND el.user_id = ? LEFT JOIN machine_list ml ON el.machine_code = ml.machine_code WHERE tempDate.exercise_date > CURDATE() - INTERVAL 7 DAY ORDER BY exercise_date;'

  connection.query(sql, [loggedInUserId, loggedInUserId], (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json(results); // MySQL 결과를 JSON 형태로 응답
  });
});

app.get('/api/report/weekly/totalCounts', (req, res) => {
  const loggedInUserId = req.query.loggedInUserId;

  if (!loggedInUserId) {
    res.status(400).json({ error: 'User ID not provided' });
    return;
  }

  const sql = 'SELECT B.user_id, SUM(B.exercise_count) as exercise_count FROM machine_list A JOIN exercise_log B ON A.machine_code = B.machine_code WHERE B.user_id = ? AND DATE(B.exercise_date) BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE() GROUP BY B.user_id;'


  connection.query(sql, [loggedInUserId], (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json(results); // MySQL 결과를 JSON 형태로 응답
  });
});

app.get('/api/report/weekly/chestpress', (req, res) => {
  const loggedInUserId = req.query.loggedInUserId;

  if (!loggedInUserId) {
    res.status(400).json({ error: 'User ID not provided' });
    return;
  }

  const sql = 'SELECT B.user_id, SUM(B.exercise_count) as exercise_count FROM machine_list A JOIN exercise_log B ON A.machine_code = B.machine_code WHERE B.user_id = ? AND A.machine_code = 1 AND DATE(B.exercise_date) BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE() GROUP BY B.user_id;'

  connection.query(sql, [loggedInUserId], (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json(results); // MySQL 결과를 JSON 형태로 응답
  });
});

app.get('/api/report/weekly/latpulldown', (req, res) => {
  const loggedInUserId = req.query.loggedInUserId;

  if (!loggedInUserId) {
    res.status(400).json({ error: 'User ID not provided' });
    return;
  }

  const sql = 'SELECT B.user_id, SUM(B.exercise_count) as exercise_count FROM machine_list A JOIN exercise_log B ON A.machine_code = B.machine_code WHERE B.user_id = ? AND A.machine_code = 2 AND DATE(B.exercise_date) BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE() GROUP BY B.user_id;'

  connection.query(sql, [loggedInUserId], (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json(results); // MySQL 결과를 JSON 형태로 응답
  });
});

app.get('/api/report/weekly/legpress', (req, res) => {
  const loggedInUserId = req.query.loggedInUserId;

  if (!loggedInUserId) {
    res.status(400).json({ error: 'User ID not provided' });
    return;
  }

  const sql = 'SELECT B.user_id, SUM(B.exercise_count) as exercise_count FROM machine_list A JOIN exercise_log B ON A.machine_code = B.machine_code WHERE B.user_id = ? AND A.machine_code = 3 AND DATE(B.exercise_date) BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE() GROUP BY B.user_id;'

  connection.query(sql, [loggedInUserId], (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json(results); // MySQL 결과를 JSON 형태로 응답
  });
});

app.get('/api/report/weekly/legextension', (req, res) => {
  const loggedInUserId = req.query.loggedInUserId;

  if (!loggedInUserId) {
    res.status(400).json({ error: 'User ID not provided' });
    return;
  }

  const sql = 'SELECT B.user_id, SUM(B.exercise_count) as exercise_count FROM machine_list A JOIN exercise_log B ON A.machine_code = B.machine_code WHERE B.user_id = ? AND A.machine_code = 4 AND DATE(B.exercise_date) BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE() GROUP BY B.user_id;'

  connection.query(sql, [loggedInUserId], (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json(results); // MySQL 결과를 JSON 형태로 응답
  });
});

app.get('/api/report/monthly', (req, res) => {

  const sql = 'SELECT B.user_id, DATE_FORMAT(B.exercise_date, "%Y-%m-%d") as exercise_date, SUM(B.exercise_count) as total_exercise_count FROM machine_list A JOIN exercise_log B ON A.machine_code = B.machine_code WHERE B.user_id = ? AND  DATE_FORMAT(B.exercise_date, "%Y-%m") = DATE_FORMAT(NOW() - INTERVAL 0  MONTH, "%Y-%m") GROUP BY B.user_id, exercise_date ORDER BY exercise_date ASC;'

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    
    res.json(results); // MySQL 결과를 JSON 형태로 응답
  })
});

app.get('/api/report/monthly/totalCounts', (req, res) => {
  const loggedInUserId = req.query.loggedInUserId;

  if (!loggedInUserId) {
    res.status(400).json({ error: 'User ID not provided' });
    return;
  }

  const sql = 'SELECT B.user_id, SUM(B.exercise_count) as exercise_count FROM machine_list A JOIN exercise_log B ON A.machine_code = B.machine_code WHERE B.user_id = ? AND YEAR(B.exercise_date) = YEAR(CURDATE()) AND MONTH(B.exercise_date) = MONTH(CURDATE())GROUP BY B.user_id;'


  connection.query(sql, [loggedInUserId], (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json(results); // MySQL 결과를 JSON 형태로 응답
  });
});

app.get('/api/report/monthly/type', (req, res) => {
  const loggedInUserId = req.query.loggedInUserId;

  if (!loggedInUserId) {
    res.status(400).json({ error: 'User ID not provided' });
    return;
  }

  const sql = 'SELECT A.machine_name, SUM(B.exercise_count) as exercise_count FROM machine_list A LEFT JOIN exercise_log B ON A.machine_code = B.machine_code WHERE B.user_id = ? AND YEAR(B.exercise_date) = YEAR(CURDATE()) AND MONTH(B.exercise_date) = MONTH(CURDATE()) GROUP BY A.machine_name;'

  connection.query(sql, [loggedInUserId], (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json(results); // MySQL 결과를 JSON 형태로 응답
  });
});

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
  const { user_id, user_pw, user_name, height, weight, gender, birth } = req.body;
  
  // MySQL에 사용자 추가하는 쿼리 실행
  const sql_account = 'INSERT INTO user_account (user_id, user_pw, user_name) VALUES (?, ?, ?)';
  const values_account = [user_id, user_pw, user_name];

  const sql_physical = 'insert into user_physical (user_id, height, weight, gender, birth) values (?, ?, ?, ?, ?)';
  const values_physical = [user_id, height, weight, gender, birth];
  
  connection.query(sql_account, values_account, err => {
    if (err) {
      console.error('MySQL user_account query error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    connection.query(sql_physical, values_physical, err => {
      if (err) {
        console.error('MySQL user_physical query error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }});
      return;
    
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
