var request = require('request');
var mongojs = require('mongojs');
var credentials = require('../credentials.json');

console.log(credentials);


var mongo = {
  "hostname":"localhost",
  "port":27017,
  "username":"",
  "password":"",
  "name":"",
  "db":"stash"
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


var db = mongojs(mongourl, ['projects']);

db.projects.runCommand('count', function(err,result) {

	if(!err && result.ok) console.log(result);
});

var projects = [];
var getProjects = function(initialValue) {
  request({
      'method': 'GET',
      'uri': 'https://git.gisinc.com/rest/api/1.0/projects/?limit=100&start='+initialValue,
      'auth': {
        'user': credentials.user,
        'pass': credentials.password
      },
      'json': true
    }, function(error, res, body) {
         //console.log(body);
	 processProjects(body.values);
         if(body.nextPageStart) {
		getProjects(body.nextPageStart);
         }
	 else {
	 	getProjectsComplete();
	 }	
   });
}

projectCollection = db.projects;

processProjects = function(incoming) {
  console.log('Pushed ' + incoming.length + ' values.');
  for (var i = 0; i < incoming.length; i++) {
	var iteratedProject = incoming[i];
	addNewProject = function(project) {
	  projectCollection.find({key:project.key}, function (error, docs) {
	    if(docs.length == 0) {
	      projectCollection.save(project);
	    }
	   });
	}
	addNewProject(iteratedProject);
	projects.push(incoming[i]);
   }  
}

//Get projects starting at the inital project
getProjects(0); 
getProjectsComplete = function (){
	console.log(projects.length+" Projects Fetched");
	//iterateProjects(projects);
        
}

iterateProjects = function(incoming) {
  for(var i = 0; i < incoming.length; i++) {
    getRepos(incoming[i].key);

  }
  
}

getRepos = function (projectKey) {
  request({
    'method':'GET',
    'uri':'https://git.gisinc.com/rest/api/1.0/projects/'+projectKey+'/repos',
    'auth': {
        'user': credentials.user,
        'pass': credentials.password
      },
      'json': true
    }, function(error,res,body) {
      processRepos(body.values);
    });
} 

var repos = [];
var processedProjects = 0;
processRepos = function(incoming) {
  //console.log('Pushed ' + incoming.length + ' Repos.');
  if(typeof incoming.length == "undefined") { return;}
  for(var i = 0; i < incoming.length; i++) {
    repos.push(incoming[i]);
  };
  processedProjects++;
  if(processedProjects == projects.length) {
    console.log("Processed " + processedProjects + " projects.");
    getReposComplete();
  }
}

getReposComplete = function() {
  processCommits(repos);
}

processCommits = function(incoming) {
  console.log("Processing Commits");
  for(var i =0;i<incoming.length; i++) {
    //console.log(incoming[i]);
    if(!incoming[i].project.isPersonal) {
      var projectKey = incoming[i].project.key;
      var repoSlug = incoming[i].slug;
      console.log("Getting "+repoSlug +"'s commits");
      getCommits(projectKey, repoSlug,0);
    }
  }
}


getCommits = function(projectKey,repoSlug, initialValue) {
  request({
      'method': 'GET',
      'uri': 'https://git.gisinc.com/rest/api/1.0/projects/' + projectKey + '/repos/' +repoSlug + '/commits?limit=100&tart='+initialValue,
      'auth': {
        'user': credentials.user,
        'pass': credentials.password
      },
      'json': true
    }, function(error, res, body) {
	
         processCommitData(body.values);
	 console.log("Processing " + body.values.length + " commits.");
         if(!body.isLastPage) {
                getCommits(projectKey,repoSlug,body.nextPageStart);
         }
         else {
		console.log("Commits Ready: " +commits.length);
                getCommitsComplete(repoSlug);
         }
   });
}

var repoCommitsProcessed = 0;
getCommitsComplete = function(repoSlug) {
  repoCommitsProcessed++
  console.log(commits.length + " commits.");
  if(repoCommitsProcessed == repos.length) {
	console.log("Procesed " + repoCommitsProcessed + " Repo Commits");
  }
}

var commits = [];
processCommitData = function(incoming) {
  //console.log(incoming);
  if(typeof incoming == "undefined") { return;}
  for(var i=0; i<incoming.length;i++) {
    commits.push(incoming[i]);
  }
  //console.log("Sanity Check: " +commits.length);
}

//getCommits("PI","energy",0);  
