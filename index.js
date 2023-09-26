//var db_config = require('./config/db-config.json');
const mysql = require('mysql');
const db_config   = require('./config/db_config.js');
const connection = mysql.createConnection(db_config);
const app = express();

// configuration =========================
app.set('port', process.env.PORT || 3000);

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

app.listen(app.get('port'), () => {
  console.log('Express server listening on port ' + app.get('port'));
});


/* 커넥션 테스트 */
// connection.connect();

// connection.query('SELECT * from User', (error, rows, fields) => {
//   if (error) throw error;
//   console.log('User info is: ', rows);
// });

// connection.end();