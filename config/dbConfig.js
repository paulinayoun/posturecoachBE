const fs = require('fs');

module.exports = {
  host: 'mysql-pcoach.mysql.database.azure.com',
  port: 3306,
  user: 'admin_pcoach',
  password: 'asdf1234!',
  database: 'posturecoachDB',
  ssl: {
    ca: fs.readFileSync('./etc/DigiCertGlobalRootCA.crt.pem')
  }
};