const redis = require('redis');
const client = redis.createClient(6379,'47.100.224.40',{auth_pass:"123456"});


client.on('ready',function(res){
    console.log('ready');
});

client.on('end',function(err){
    console.log('end');
});

client.on('error', function (err) {
    console.log(err);
});

client.on('connect',function(){
    console.log('redis connect success!');
});


module.exports = client;