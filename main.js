var express = require('express')
var app = express() //Application 객체
const port = 3000
var template = require('./lib/template.js');
var fs = require('fs');
var path = require('path');
// var qs = require('querystring');
var sanitizeHtml = require('sanitize-html');
var bodyParser = require('body-parser');  //body data를 parse 해주는 미들웨어
var compression = require('compression'); //요청한 데이터를 압축하는 것이 네트워크 자원 절약해줌

app.use(express.static('public')) //정적인 파일 서비스 사용시 public 경로 아래 파일들을 url로 호출 가능!!!

// parse application/x-www-form-urlencoded
//사용자가 전달한 post data를 가져와 내부에서 분석해서 request 후 콜백 함수 호출
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression()); //웹브라우저가 compression을 통해 받은 압축된 데이터를 풀어서 사용

//get 요청에 대해서만 fs.readdir 작동
app.get('*', function(request, response, next){
    //반복되는 fs.readdir 함수를 미들웨어로 선언
    fs.readdir('./data', function(error, filelist){
       request.list = filelist; //request 객체의 list 프로퍼티를 통해 모든 라우트 안에서 미들웨어(=함수)에서 사용 가능
       next(); //그 다음 미들웨어 호출
    });
});



// app.get('/', (req, res) => {
//     res.send('Hello World!')
// })
//route, routing : 경로 설정
app.get('/', function (request, response) { //사실상 이 콜백 함수는 미들웨어!!!
    var title = 'Welcome';
    var description = 'Hello, Node.js';
    var list = template.list(request.list);
    var html = template.HTML(title, list,
        `<h2>${title}</h2>${description}
              <img src="/images/hello.jpg" style="width:300px; display:block; margin-top:10px">`,
        `<a href="/topic/create">create</a>`
    );
    // response.writeHead(200);
    // response.end(html);
    response.send(html);
});

app.get('/topic/create', function (request, response){
    var title = 'WEB - create';
    var list = template.list(request.list);
    var html = template.HTML(title, list, `
      <form action="/topic/create_process" method="post">
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

app.post('/topic/create_process', function(request, response){
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
        response.redirect(`/topic/${title}`);
    });
});

app.get('/topic/update/:pageId', function (request, response){
    var filteredId = path.parse(request.params.pageId).base;
    fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
        var title = request.params.pageId;
        var list = template.list(request.list);
        var html = template.HTML(title, list,
            `
        <form action="/topic/update_process" method="post">
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
            `<a href="/topic/create">create</a>
                    <a href="/topic/update/${title}">update</a>`
        );
        response.send(html);
    });
});

app.post('/topic/update_process', function(request, response){
    var post = request.body;
    var id = post.id;
    var title = post.title;
    var description = post.description;
    fs.rename(`data/${id}`, `data/${title}`, function(error){
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){
            // response.writeHead(302, {Location: `/?id=${title}`});
            // response.end();
            response.redirect(`/topic/${title}`);
        })
    });
});

app.post('/topic/delete_process', function (request, response){
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

//url path에 get으로 parameter 전달
app.get('/topic/:pageId', function (request, response, next) {
    // console.log(request.list);  //['Express', 'HTML'] 배열

    var filteredId = path.parse(request.params.pageId).base;

    fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
        if(err){
            next(err);
        }else{
            var title = request.params.pageId;
            var sanitizedTitle = sanitizeHtml(title);
            var sanitizedDescription = sanitizeHtml(description, {
                allowedTags:['h1']
            });
            var list = template.list(request.list);
            var html = template.HTML(sanitizedTitle, list,
                `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
                ` <a href="/topic/create">create</a>
                         <a href="/topic/update/${sanitizedTitle}">update</a>
                         <form action="/topic/delete_process" method="post">
                            <input type="hidden" name="id" value="${sanitizedTitle}">
                            <input type="submit" value="delete">
                         </form>`
            );
            response.send(html);
        }
    });
});


//미들웨어는 순차적으로 처리하기 때문에 에러처리는 마지막 쪽에 위치!!!
app.use( (req, res, next) => {
    res.status(404).send('죄송합니다. 해당페이지를 찾을 수가 없습니다!');
});

app.use( (err, req, res, next) => { //err, req, res, next로 선언되어있는 미들웨어는 에러핸들링 미들웨어로 정하기로 약속!
    console.error(err.stack);
    res.status(500).send('내부에러!!!!!!!!!!!!');
});

//listen이 실행되면서 web server를 인자로 넘겨준 port로 실행
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

//unsplash.com :: 이미지 저작권 없음


///////////// 미들웨어 동작 순서 /////////////
// router.get('/user/:id', (req, res, next) => {
//     if (req.params.id === '0') next('route')
//     else next()
// }, (req, res, next) => { //미들웨어1
//     res.render('regular')
// })
//
// router.get('/user/:id', (req, res, next) => { //미들웨어2
//     console.log(req.params.id)
//     res.render('special')
// })
// 위 코드에서 if문 성립시 next는 미들웨어2를 호출
// if문 조건 불충족시 바로 다음 미들웨어1 실행
////////////