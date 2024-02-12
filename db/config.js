const mysql = require('mysql');

let connection;

function connectToDatabase() {
  connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "test",
  });

  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      return;
    }
    console.log('Connected to database');
  });
}

function closeDatabaseConnection() {
  if (connection) {
    connection.end();
    console.log('Database connection closed');
  }
}

module.exports = {
  connectToDatabase,
  closeDatabaseConnection,
  getConnection: () => connection
};
