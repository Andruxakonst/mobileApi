const mysql = require("mysql2");
exports.connection = mysql.createConnection({
    host: "localhost",
    port:"",
    user: "root",
    database: "aerinee_crowdfaster",
    password: ""
});