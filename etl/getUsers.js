var mongo = {
  "hostname":"localhost",
  "port":27017,
  "username":"",
  "password":"",
  "name":"",
  "db":"test"
}

var generate_mongo_url = function(obj) {
  obj.hostname = (obj.hostname || 'localhost');
  obj.port = (obj.port || 27017);
  obj.db = (obj.db || 'test');

  if(obj.username && obj.password) {
     return "mongodb://" + obj.username + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
  }
  else{
    return "mongodb://" + obj.hostname + ":" + obj.port + "/" +obj.db;
  }
}

var mongourl = generate_mongo_url(mongo);

var mongojs = require('mongojs');

var db = mongojs(mongourl,['stash']);


var http = require('http');

var options = {
  host: 'https://git.gisinc.com',
  path: '/rest/api/1.0/users',
  headers: {
    'User': 'username',
    'Password': 'password',
    'Content-Type': 'application/json'
  }
}

var callback = function(response) {
  console.log(response);
  var str = '';
  response.on('data', function (chunk) {
    str += chunk;
    console.log(chunk);
  });
  
  response.on('end', function () {
    console.log(str);
  });
}

var req = http.request(options, callback);
req.end();

