const express = require('express');
const path = require('path');
const fs = require('fs');
const redisClient = require("./redisUtil");
const multipart = require('connect-multiparty');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended:false});
const multipartMiddleware = multipart();

//新加入的对象
var newAddedJsons = [];
// 所有对象的key值的集合
var keySet = [];



function init(){
    //启动的时候先从本地的文件中读取数据，写入redis缓存（这是为了应对重新启动之后redis缓存的丢失）
    let initJson = JSON.parse(fs.readFileSync('./localData.json','utf-8'));
    //console.log(JSON.parse(initJson));
    let updateJson = {};
    initJson.forEach(element => {
        redisClient.set(element.key,element.value,function(){});
        keySet.push(element.key);
    });
}

function updateLocalFile(){
    console.log('keyset')
    console.log(keySet)
    console.log('newAdded')
    console.log(newAddedJsons)
    let toUpArrs = JSON.parse(JSON.stringify(newAddedJsons));
    newAddedJsons = [];
    let initJson = JSON.parse(fs.readFileSync('./localData.json','utf-8'));
    toUpArrs.forEach(element => {
        console.log(element);
        let key = element.key;
        let value = element.value;
        let curIndex =keySet.indexOf(key);
        if(curIndex!==-1){
            initJson.splice(curIndex,1,{key,value});
        }else{
            initJson.push({key,value});
        }
    });
    fs.writeFile('./localData.json',JSON.stringify(initJson),function(){
        console.log("更新本地数据成功"+new Date());
    });
}

init();

var app = express();

// redisClient.set("test","test str",function(err,reply){
//     console.log(reply);
// })

// app.post('/',function(req,res){
//     let json = "hello!this is an easy mock create by fuzhenjie";
//     res.send(json);
// })

app.use(express.static(path.join(__dirname,'dist')));

app.post('/getSet',function(req,res){
    res.send(keySet);
})

app.post('/api/:methodName',function(req,res){
    //console.log(req.params.methodName);
    //redisClient.
    let key = req.params.methodName;
    redisClient.get(key,function(err,reply){
        if(reply === null){
            res.send("nothing");
        }else{
            responseData = reply;
            try{responseData = JSON.parse(reply)}catch(err){}
            res.send(responseData);
        }
    })
})

app.post('/set',urlencodedParser,function(req,res){
    //console.log(req.body);
    //res.send("over");
    let key = req.body.key;
    let value = req.body.value;
    //console.log(key+value);
    redisClient.exists(key,function(err,rep){
        // if(rep === 1){
        //     res.send("dup");
        // }else if(rep===0){
        //     redisClient.set(key,value,function(err,reply){
        //         if(reply==="OK"){
        //             res.send("OK");
        //         }
        //     });
        // } 
        if(rep===0){
            keySet.push(key);
        }
        newAddedJsons.push({key,value});
        // 覆盖的方式
        redisClient.set(key,value,function(err,reply){
            if(reply==="OK"){
                res.send("OK");
            }
        });
    })
})
app.listen(3001,()=>{
    console.log("complete start")
});


//setInterval(600000,updateLocalFile);
setInterval(updateLocalFile,600000);
