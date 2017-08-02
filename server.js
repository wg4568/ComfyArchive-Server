const express = require("express");
const mysql = require("mysql");
const fs = require("fs");
const multer = require("multer");

const secret = require("./secret.js");	// contains SQL server information (so not in GitHub, duh)

var upload = multer({
  dest: __dirname + '/temp/'
});

var app = express();

// Do NOT push this code to GitHub
const connection = mysql.createConnection({
    host: secret.host,
    user: secret.user,
    password: secret.password,
    database: secret.database
});

connection.connect(function(error) {
    if (error == null) console.log("Connected to MySQL database");
    else console.log("Could not connect to MySQL database");
});


app.post("/images", upload.single("image"), function(req, ret) {
    var buffer = fs.readFileSync(req.file.path);
    var size = buffer.length;

    console.log(size);

    // `name`, `uploader`, `uploaded`, `tags`, `id`, `image
    connection.query("INSERT INTO images VALUES ?", {
        name: "TEST IMAGE",
        uploader: "WILLIAM",
        uploaded: 21345,
        tags: "5,sdsadsd,kkk",
        image: size+","+buffer
    }, function(error, result) {
        if (error) ret.status(500).json(error);
        ret.json(result);
    });
});

app.listen(8080, function() {
    console.log("REST API listening on port 8080");
});
