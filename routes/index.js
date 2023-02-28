var template = require('../lib/template.js');
var express = require('express');
var router = express.Router(); //router 객체 리턴

// app.get('/', (req, res) => {
//     res.send('Hello World!')
// })
//route, routing : 경로 설정
router.get('/', function (request, response) { //사실상 이 콜백 함수는 미들웨어!!!
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

module.exports = router;