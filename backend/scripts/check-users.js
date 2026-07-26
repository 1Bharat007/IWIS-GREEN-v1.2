const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./iwis.db');
db.all('SELECT email, password, phone, role FROM users', [], (err, rows) => {
  if (err) throw err;
  console.log(rows);
});
