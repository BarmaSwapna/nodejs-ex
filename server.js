//  OpenShift sample Node application

var express = require('express'),
    app     = express(),
    morgan  = require('morgan'),
    bodyParser=require('body-parser'),
    http=require('http');

var router=express.Router();

    
Object.assign=require('object-assign')
app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'));
app.set('view engine' , 'ejs');



// <script src="https://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.4.1.min.js">
//   </script>
app.use(bodyParser.urlencoded({extended: true}));





var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";
if (mongoURL == null) {
  var mongoHost, mongoPort, mongoDatabase, mongoPassword, mongoUser;
  // If using plane old env vars via service discovery
  if (process.env.DATABASE_SERVICE_NAME) {
    var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
    mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'];
    mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'];
    mongoDatabase = process.env[mongoServiceName + '_DATABASE'];
    mongoPassword = process.env[mongoServiceName + '_PASSWORD'];
    mongoUser = process.env[mongoServiceName + '_USER'];

  // If using env vars from secret from service binding  
  } else if (process.env.database_name) {
    mongoDatabase = process.env.database_name;
    mongoPassword = process.env.password;
    mongoUser = process.env.username;
    var mongoUriParts = process.env.uri && process.env.uri.split("//");
    if (mongoUriParts.length == 2) {
      mongoUriParts = mongoUriParts[1].split(":");
      if (mongoUriParts && mongoUriParts.length == 2) {
        mongoHost = mongoUriParts[0];
        mongoPort = mongoUriParts[1];
      }
    }
  }

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/lisassets', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      if (err) {
        console.log('Error running count. Message:\n'+err);
      }
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    console.log("%%%%%%%%%%%%%%%%%%%%%%%55",mongoUser);

    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});
const fs=require('fs');
var path = require('path'),    
filePath = path.join(__dirname, '/fobdata.json');


app.get('/',function(req,res){
  fs.readFile(filePath, {encoding: 'utf-8'}, function(err,resp){
    if (!err) {
      var sringifieddata=JSON.parse(resp);
      //var message=sringifieddata;
res.render('load.html',{message:sringifieddata})
    }
  })
})




app.post('/create',function(req,res){


 fs.readFile('./fobdata.json', 'utf-8', function(err, data) {
	if (err) throw err

  var arrayOfObjects = JSON.parse(data);
  //code to get max value of id from jsonfile
var assetIds=[];
var lanIds=[];
var vmStatus="false";
var errorMessage="LanId exists";

for(var i=0;i<arrayOfObjects.dbData.length;i++){
    assetIds.push(arrayOfObjects.dbData[i].AssetId);
    lanIds.push(arrayOfObjects.dbData[i].Lan_ID);
  }

  if(!lanIds.includes(req.body.Lan_ID)){
    for(var i=0;i<arrayOfObjects.dbData.length;i++){
    if(req.body.VM_Name!=arrayOfObjects.dbData[i].VM_Name){

        vmStatus="true";
      }
     else if(req.body.VM_Name==arrayOfObjects.dbData[i].VM_Name &&
       (!req.body.VM_Status==arrayOfObjects.dbData[i].VM_Status))
       {
        vmStatus="true";

       }else{
        errorMessage="VM is not Avilable";
       }
    }  

  }
//code ends here 
if(vmStatus=="true" ){
	arrayOfObjects.dbData.push({
    AssetId:Math.max.apply(Math, assetIds)+1,
    UM:req.body.UM ,
    IT_Manager: req.body.IT_Manager,
    Lan_ID: req.body.Lan_ID,
    First_Name:req.body.First_Name,
    Last_Name:req.body.Last_Name,
    VM_Name:req.body.VM_Name,
    VM_Status:req.body.VM_Status,
    RAD_License:req.body.RAD_License,
    FOB_Id:req.body.FOB_Id,
    FOB_End_Date:calculateDate(),
    FOB_Status:req.body.FOB_Status
    })

  fs.writeFile('./fobdata.json', JSON.stringify(arrayOfObjects), 'utf-8', function(err) {
    if (err) throw err
    console.log('Done!')
  })
  //res.render('load.html',{message:arrayOfObjects})
  res.redirect('/');
}else{
  res.send({message:errorMessage});
}
    });
});

  //update method
app.post('/edit',function(req,res){

  fs.readFile('./fobdata.json', 'utf-8', function(err, data) {
    if (err) throw err
  
    var arrayOfObjects = JSON.parse(data);
    var modifiedObjects = JSON.parse(data);
    //code to get max value of id from jsonfile

  var IdStatus="false";
  var errorMessage="LanId exists";
  var updatAssetId;
  
  for(var i=0;i<arrayOfObjects.dbData.length;i++){
    if(req.body.Lan_ID==arrayOfObjects.dbData[i].Lan_ID){
      updatAssetId= parseInt(arrayOfObjects.dbData[i].AssetId)-1;
      IdStatus="true";
    }else{
      errorMessage="LanId doesnot Exists";
    }
    }
   

  //code ends here 
  if(IdStatus=="true" ){
    arrayOfObjects.dbData[updatAssetId].First_Name=req.body.First_Name;
    arrayOfObjects.dbData[updatAssetId].Last_Name=req.body.Last_Name;
    arrayOfObjects.dbData[updatAssetId].VM_Status=req.body.VM_Status;
    arrayOfObjects.dbData[updatAssetId].FOB_Status=req.body.FOB_Status;
    //arrayOfObjects.dbData[updatAssetId].FOB_End_Date=req.body.FOB_End_Date;
    arrayOfObjects.dbData[updatAssetId].RAD_License=req.body.RAD_License;
  
    fs.writeFile('./fobdata.json', JSON.stringify(arrayOfObjects), 'utf-8', function(err) {
      if (err) throw err
      console.log('Done!')
    })
    res.redirect('/');
   // res.render('load.html',{message:arrayOfObjects})
  }
  else{
    res.send({message:errorMessage});
  }
      })
      
 })

 app.post('/assetid',function(req,res){
  var idToBeEdited=req.body.path.split("+")[1];
  fs.readFile(filePath, {encoding: 'utf-8'}, function(err,resp){
    if (!err) {
      var arrayOfObjects=JSON.parse(resp);

      var assetIds=[];
      for(var i=0;i<arrayOfObjects.dbData.length;i++){
        if(arrayOfObjects.dbData[i].AssetId==parseInt(idToBeEdited)+1){
        assetIds.push(arrayOfObjects.dbData[i]);
        }
      }
    res.send({message:assetIds})
    }
  })
  })

 app.post('/remove',function(req,res){
  var idToBeDeleted=req.body.path.split("+")[1];
console.log("id to be removed::"+idToBeDeleted);

  fs.readFile(filePath, {encoding: 'utf-8'}, function(err,resp){
    if (!err) {
      var arrayOfObjects=JSON.parse(resp);
      var modifiedData={
        dbData:[]
      };
      for(var i=0;i<arrayOfObjects.dbData.length;i++){
        if(arrayOfObjects.dbData[i].AssetId!=parseInt(idToBeDeleted)+1){
          modifiedData.dbData.push(arrayOfObjects.dbData[i]);
        //assetIds.push(arrayOfObjects.dbData[i]);
        }
      }
      //filesync with modifiedData;
//update AssetId's before syncing file
var initialAssetId=1;
for(var j=0;j<modifiedData.dbData.length;j++){
modifiedData.dbData[j].AssetId=initialAssetId;
initialAssetId=initialAssetId+1;

}
      fs.writeFileSync('./fobdata.json', JSON.stringify(modifiedData), 'utf-8', function(err) {
        
        if (!err) {
        console.log('Done!')
        }

        

      })
   
    }
   // res.render('load.html',{message:modifiedData});  
   res.redirect('/');

  })

 // res.redirect('/listassets');

  // fs.readFile(filePath, {encoding: 'utf-8'}, function(err,resp){
  //   if (!err) {
  //     var sringifieddata=JSON.parse(resp);
  //     //var message=sringifieddata;
  //     res.render('load.html',{message:sringifieddata})
  //   }
  // })

  })
  

  function calculateDate() {
   
    var today = new Date();
    var dd = today.getDate();
    
    var mm = today.getMonth()+6; 
    var yyyy = today.getFullYear()+1;
    if(dd<10) 
    {
        dd='0'+dd;
    } 
    if(mm<10) 
    {
        mm='0'+mm;
    } 
    if(mm>12){
      mm=mm-12;
      mm='0'+mm;
    }
    today = mm+'/'+dd+'/'+yyyy;
    console.log(today);
    
    return today;
     }

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = router ;




