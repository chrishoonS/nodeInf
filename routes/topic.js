let express = require('express');
let router = express.Router(); //router 객체 리턴
let path = require('path');
let fs = require('fs');
let sanitizeHtml = require('sanitize-html');
let template = require('../lib/template.js');

router.get('/create', (request, response) => {
    let title = 'WEB - create';
    let list = template.list(request.list);
    let html = template.HTML(title, list, `
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

router.post('/create_process', (request, response) => {
    /*let body = '';
    request.on('data', function(data){
        body = body + data;
    });
    request.on('end', function(){
        let post = qs.parse(body);
        let title = post.title;
        let description = post.description;
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){
            response.writeHead(302, {Location: `/?id=${title}`});
            response.end();
        })
    });*/
    let post = request.body;
    let title = post.title;
    let description = post.description;
    fs.writeFile(`data/${title}`, description, 'utf8', function(err){
        response.redirect(`/topic/${title}`);
    });
});

router.get('/update/:pageId', function (request, response){
    let filteredId = path.parse(request.params.pageId).base;
    fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
        let title = request.params.pageId;
        let list = template.list(request.list);
        let html = template.HTML(title, list,
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

router.post('/update_process', function(request, response){
    let post = request.body;
    let id = post.id;
    let title = post.title;
    let description = post.description;
    fs.rename(`data/${id}`, `data/${title}`, function(error){
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){
            // response.writeHead(302, {Location: `/?id=${title}`});
            // response.end();
            response.redirect(`/topic/${title}`);
        })
    });
});

router.post('/delete_process', function (request, response){
    let post = request.body;
    let id = post.id;
    let filteredId = path.parse(id).base;
    fs.unlink(`data/${filteredId}`, function(error){
        //redirection 기능
        // response.writeHead(302, {Location: `/`});
        // response.end();
        response.redirect('/');
    })
});

//url path 에 get 으로 parameter 전달
router.get('/:pageId', function (request, response, next) {
    // console.log(request.list);  //['Express', 'HTML'] 배열

    let filteredId = path.parse(request.params.pageId).base;

    fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
        if(err){
            next(err);
        }else{
            let title = request.params.pageId;
            let sanitizedTitle = sanitizeHtml(title);
            let sanitizedDescription = sanitizeHtml(description, {
                allowedTags:['h1']
            });
            let list = template.list(request.list);
            let html = template.HTML(sanitizedTitle, list,
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

//router export
module.exports = router;
