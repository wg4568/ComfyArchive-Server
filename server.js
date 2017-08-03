const express = require("express");
const mysql = require("mysql");
const fs = require("fs");
const multer = require("multer");

const secret = require("./secret.js");	// contains SQL server information (so not in GitHub, duh)

var upload = multer({
  dest: __dirname + '/temp/'
});

var app = express();

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

function createId(callback) {
	var text = "";
	var good = false;
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	function remake() {
		text = "";

		for (var i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
	}
}

app.post("/images", upload.single("image"), function(req, ret) {
	if (req.file) {
		var string = fs.readFileSync(req.file.path).toString("hex").toUpperCase();
		var title = req.body.title;
		var uploader = req.body.uploader;
		var tags = req.body.tags;
		var type = req.file.mimetype;

		if (!title) title = "Untitled";
		if (!uploader) uploader = "Anon";
		if (!tags) tags = "";

		connection.query(
			"INSERT INTO `images`(`title`, `uploader`, `tags`, `id`, `type`, `image`) VALUES ('" + title + "', '" + uploader + "', '" + tags + "', UUID(), '" + type + "', x'" + string + "')",
			function(error, result) {
				if (error) ret.status(500).json(error);
				ret.json(result);
			}
		);
		fs.unlinkSync(req.file.path);
	} else {
		ret.status(400).send("No image file");
	}
});

app.get("/images/:id", function(req, ret) {
	connection.query("SELECT `title`, `uploader`, `tags`, `type`, `id`, `upvotes`, `posted` FROM `images` WHERE ?", {id: req.params.id},
	function(error, result) {
		if (error) ret.status(500).json(error);
		if (result.length > 0) {
			ret.json(result[0]);
		} else {
			ret.status(404).send("No such image");
		}
	});
});

app.get("/images/:id/src", function(req, ret) {
	connection.query("SELECT * FROM images WHERE ?", {id: req.params.id},
	function(error, result) {
		if (error) ret.status(500).json(error);
		if (result.length > 0) {
			ret.writeHead(200, {
				"Content-Type": result[0].type,
				"Content-Length": result[0].image.length
			});
			ret.end(new Buffer(result[0].image, 'binary'));
		} else {
			ret.status(404).send("No such image");
		}
	});
});

app.listen(8080, function() {
    console.log("REST API listening on port 8080");
});
