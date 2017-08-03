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

app.use(function(req, ret, next) {
	ret.set("Access-Control-Allow-Origin", "*");
	next();
});

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

app.get("/images", function(req, ret) {
	connection.query("SELECT `title`, `uploader`, `tags`, `type`, `id`, `upvotes`, `posted` FROM `images` WHERE 1",
	function(error, result) {
		if (error) ret.status(500).json(error);
		ret.json(result);
	});
});

app.get("/images/recent", function(req, ret) {
	connection.query("SELECT `title`, `uploader`, `tags`, `type`, `id`, `upvotes`, `posted` FROM `images` WHERE 1",
	function(error, result) {
		if (error) ret.status(500).json(error);
		sorted = result.sort(function(a, b) {
			atime = new Date(a.posted);
			btime = new Date(b.posted);
			if (atime > btime) return -1;
			if (atime < btime) return 1;
			return 0;
		});
		ret.json(sorted);
	});
});

app.get("/images/recent/:amt", function(req, ret) {
	connection.query("SELECT `title`, `uploader`, `tags`, `type`, `id`, `upvotes`, `posted` FROM `images` WHERE 1",
	function(error, result) {
		if (error) ret.status(500).json(error);
		sorted = result.sort(function(a, b) {
			atime = new Date(a.posted);
			btime = new Date(b.posted);
			if (atime > btime) return -1;
			if (atime < btime) return 1;
			return 0;
		});
		sorted = sorted.slice(0, req.params.amt);
		ret.json(sorted);
	});
});

app.get("/images/search/:query", function(req, ret) {
	connection.query("SELECT `title`, `uploader`, `tags`, `type`, `id`, `upvotes`, `posted` FROM `images` WHERE 1",
	function(error, result) {
		if (error) ret.status(500).json(error);
		var found = [];
		var query = req.params.query.split(" ");
		result.forEach(function(img) {
			var match = 0;
			var words = img.tags.split(",")
							.concat(img.title.split(" "))
							.concat(img.uploader.split(" "));
			words.push(img.id);
			words = words.filter(function(word) {
				return word != "";
			});
			words = words.map(function(word) {
				return word.toLowerCase();
			});

			console.log(words);

			query.forEach(function(kw) {
				if (words.indexOf(kw.toLowerCase()) != -1) match++;
			});

			img.match = match;
			found.push(img);
		});
		found = found.filter(function(thing) {
			return thing.match != 0;
		});
		found = found.sort(function(a, b) {
			if (a.match > b.match) return -1;
			if (a.match < b.match) return 1;
			return 0;
		})
		ret.json(found);
	});
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
