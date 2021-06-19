const express = require('express')
const app = express()
var fs = require("fs"); 
var template = require("../lib/template.js");
 
//app.get('/', (request, response) => response.send('Hello World!'));
app.get('/', function(request, response){
  fs.readdir("data", function (error, filelist) {
    var title = "Welcome";
    var description = "Hello, Node.js";
    var list = template.list(filelist);
    var html = template.html(title,list,
      `<h2>${title}</h2></p>${description}`,
      `<a href="/create">create</a>`);

  response.send(html);
  })
});
 
app.listen(3000, () => console.log('Example app listening on port 3000!'))

/*
var http = require("http");
var fs = require("fs");
var url = require("url");
var qs = require("querystring");
var template = require("../lib/template.js");
var path = require('path');
var sanitizeHtml = require('sanitize-html');

var app = http.createServer(function (request, response) {
  var _url = request.url;
  var pathname = url.parse(_url, true).pathname;
  var queryData = url.parse(_url, true).query;
  var title = queryData.id;

  if (pathname === "/") {
    if (queryData.id === undefined) {
      fs.readdir("data", function (error, filelist) {
        var title = "Welcome";
        var description = "Hello, Node.js";
        // var list = template(filelist);
        // var template = templateHTML(
        //   title,
        //   list,
        //   `<h2>${title}</h2></p>${description}`,
        //   `<a href="/create">create</a>`
        // );
        var list = template.list(filelist);
        var html = template.html(title,list,`<h2>${title}</h2></p>${description}`,`<a href="/create">create</a>`);

        response.writeHead(200);
        response.end(html);
      });
    } else {
      fs.readdir(`data`, function (error, filelist) {
        var filteredId = path.parse(queryData.id).base;
      fs.readFile(`data/${filteredId}`, "utf-8", function (err, description) {
          var list = template.list(filelist);
          var sanitizedTitle =  sanitizeHtml(title);
          var sanitizeddescription =  sanitizeHtml(description);
          var html = template.html(
            sanitizedTitle,
            list,
            `<h2>${sanitizedTitle}</h2></p>${sanitizeddescription}`,
            `<a href="/create">create</a>
            <a href="/update?id=${sanitizedTitle}">update</a>
            <form action="delete_process" method="post">
              <input type="hidden" name="id" value="${sanitizedTitle}">
              <input type="submit" value="delete">
            </form>`
          );

          response.writeHead(200);
          response.end(html);
        });
      });
    }
  } else if (pathname === "/create") {
    fs.readdir("data", function (error, filelist) {
      var title = "WEB - create";
      var list = template.list(filelist);
      var html = template.html(
        title,
        list,
        `<form action="/create_process" method="post">
        <p><input type="text" name="title" placeholder="title"></p>
        <p>
        <textarea name="description" placeholder="description"></textarea>
        </p>
        <p>
        <input type="submit">
        </p>
        </form>`,
        ""
      );

      response.writeHead(200);
      response.end(html);
    });
  } else if (pathname === "/create_process") {
    var body = "";
    request.on("data", function (data) {
      body = body + data;
    });
    request.on("end", function (data) {
      var post = qs.parse(body);
      var title = post.title;
      var description = post.description;
      fs.writeFile(`data/${title}`, description, "utf8", function (err) {});
      response.writeHead(302, { location: `/?id=${title}` });
      response.end();
    });
  } else if (pathname === "/update") {
    fs.readFile(`data/${title}`, "utf-8", function (err, description) {
      fs.readdir("data", function (error, filelist) {
        var list = template.list(filelist);
        var html = template.html(
          title,
          list,
          `<form action="/update_process" method="post">
          <input type="hidden" name="id" value="${title}">
        <p><input type="text" name="title" value="${title}"></p>
        <p>
        <textarea name="description" placeholder="description">${description}</textarea>
        </p>
        <p>
        <input type="submit">
        </p>
        </form>`,
          ""
        );

        response.writeHead(200);
        response.end(html);
      });
    });
  } else if (pathname === "/update_process") {
    var body = "";
    request.on("data", function (data) {
      body = body + data;
    });
    request.on("end", function (data) {
      var post = qs.parse(body);
      var id = post.id;
      var title = post.title;
      var description = post.description;
      fs.rename(`data/${id}`, `data/${title}`, function (err) {
        fs.re;
        fs.writeFile(`data/${title}`, description, "utf8", function (err) {});
        response.writeHead(302, { location: `/?id=${title}` });
        response.end();
      });
    });
  } else if (pathname === "/delete_process") {
    var body = "";
    request.on("data", function (data) {
      body = body + data;
    });
    request.on("end", function (data) {
      var post = qs.parse(body);
      var id = post.id;

      fs.unlink(`data/${id}`, function(err){
      response.writeHead(302, { location: '/' });
      response.end();
      });
    });
  } else {
    response.writeHead(404);
    response.end("Not Found");
  }

  // fs.readFileSync(__dirname + _url) 은 index.html을 실행시킨다.
});
app.listen(3000);
*/
