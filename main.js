var express = require('express');
var app = express() //express module 자체를 호출, app객체 리턴
const port = 3000
var fs = require('fs');
var bodyParser = require('body-parser');  //body data를 parse 해주는 미들웨어
var compression = require('compression'); //요청한 데이터를 압축하는 것이 네트워크 자원 절약해줌
var helmet = require('helmet');

var indexRouter = require('./routes/index');
var topicRouter = require('./routes/topic');

app.use(express.static('public')) //정적인 파일 서비스 사용시 public 경로 아래 파일들을 url로 호출 가능!!!

// parse application/x-www-form-urlencoded
//사용자가 전달한 post data를 가져와 내부에서 분석해서 request 후 콜백 함수 호출
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression()); //웹브라우저가 compression을 통해 받은 압축된 데이터를 풀어서 사용
app.use(helmet()); //express 보안 강화

//get 요청에 대해서만 fs.readdir 작동
app.get('*', (request, response, next)=>{
    //반복되는 fs.readdir 함수를 미들웨어로 선언
    fs.readdir('./data', function(error, filelist){
       request.list = filelist; //request 객체의 list 프로퍼티를 통해 모든 라우트 안에서 미들웨어(=함수)에서 사용 가능
       next(); //그 다음 미들웨어 호출
    });
});

app.use('/', indexRouter);

// /topic으로 시작하는 요청들에게 topicRouter라는 이름의 미들웨어를 적용하겠다!
app.use('/topic', topicRouter);


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