var express = require('express')
var app = express() //Application 객체
const port = 3000
var template = require('./lib/template.js');
var fs = require('fs');
var path = require('path');
var qs = require('querystring');
var sanitizeHtml = require('sanitize-html');
var bodyParser = require('body-parser');  //body data를 parse 해주는 미들웨어
var compression = require('compression'); //요청한 데이터를 압축하는 것이 네트워크 자원 절약해줌

// parse application/x-www-form-urlencoded
//사용자가 전달한 post data를 가져와 내부에서 분석해서 request 후 콜백 함수 호출
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression()); //웹브라우저가 compression을 통해 받은 압축된 데이터를 풀어서 사용

// app.get('/', (req, res) => {
//     res.send('Hello World!')
// })
//route, routing : 경로 설정
app.get('/', function (request, response) {
    fs.readdir('./data', function(error, filelist){
        var title = 'Welcome';
        var description = 'Hello, Node.js';
        var list = template.list(filelist);
        var html = template.HTML(title, list,
            `<h2>${title}</h2>${description}`,
            `<a href="/create">create</a>`
        );
        // response.writeHead(200);
        // response.end(html);
        response.send(html);
    });
});

//url path에 get으로 parameter 전달
app.get('/page/:pageId', function (request, response) {
    fs.readdir('./data', function(error, filelist){

        var filteredId = path.parse(request.params.pageId).base;

        fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
            var title = request.params.pageId;
            var sanitizedTitle = sanitizeHtml(title);
            var sanitizedDescription = sanitizeHtml(description, {
                allowedTags:['h1']
            });
            var list = template.list(filelist);
            var html = template.HTML(sanitizedTitle, list,
                `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
                ` <a href="/create">create</a>
                <a href="/update/${sanitizedTitle}">update</a>
                <form action="/delete_process" method="post">
                  <input type="hidden" name="id" value="${sanitizedTitle}">
                  <input type="submit" value="delete">
                </form>`
            );
            response.send(html);
        });
    });
});

app.get('/create', function (request, response){
    fs.readdir('./data', function(error, filelist){
        var title = 'WEB - create';
        var list = template.list(filelist);
        var html = template.HTML(title, list, `
          <form action="/create_process" method="post">
            <p><input type="text" name="title" placeholder="title"></p>
            <p>
              <textarea name="description" placeholder="description"></textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
        `, '');
        response.send(html);
    });
});

app.post('/create_process', function(request, response){
    /*var body = '';
    request.on('data', function(data){
        body = body + data;
    });
    request.on('end', function(){
        var post = qs.parse(body);
        var title = post.title;
        var description = post.description;
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){
            response.writeHead(302, {Location: `/?id=${title}`});
            response.end();
        })
    });*/
    var post = request.body;
    var title = post.title;
    var description = post.description;
    fs.writeFile(`data/${title}`, description, 'utf8', function(err){
        response.writeHead(302, {Location: `/?id=${title}`});
        response.end();
    })
})

app.get('/update/:pageId', function (request, response){

    fs.readdir('./data', function(error, filelist){
        var filteredId = path.parse(request.params.pageId).base;
        fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
            var title = request.params.pageId;
            var list = template.list(filelist);
            var html = template.HTML(title, list,
                `
            <form action="/update_process" method="post">
              <input type="hidden" name="id" value="${title}">
              <p><input type="text" name="title" placeholder="title" value="${title}"></p>
              <p>
                <textarea name="description" placeholder="description">${description}</textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
            `,
                `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
            );
            response.send(html);
        });
    });
});

app.post('/update_process', function(request, response){
    var post = request.body;
    var id = post.id;
    var title = post.title;
    var description = post.description;
    fs.rename(`data/${id}`, `data/${title}`, function(error){
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){
            // response.writeHead(302, {Location: `/?id=${title}`});
            // response.end();
            response.redirect('/?id=${title}');
        })
    });
});

app.post('/delete_process', function (request, response){
    var post = request.body;
    var id = post.id;
    var filteredId = path.parse(id).base;
    fs.unlink(`data/${filteredId}`, function(error){
        //redirection 기능
        // response.writeHead(302, {Location: `/`});
        // response.end();
        response.redirect('/');
    })
});

//listen이 실행되면서 web server를 인자로 넘겨준 port로 실행
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})