/*jshint node:true*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as it's web server
// for more info, see: http://expressjs.com
var express = require('express');

// create a new express server
var app = express();

var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var morgan   = require('morgan');
// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

var cookieParser = require('cookie-parser');
var session = require('express-session');
var passport = require('passport');

//To allow Cross Origin Resource Sharing 
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Credentials', 'true');
    return next();
  }); 


//MongoDB
var mongoUrl;

if(process && process.env && process.env.VCAP_SERVICES) {
  var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
  for (var svcName in vcapServices) {
    if (svcName.match(/^mongo.*/)) {
      mongoUrl = vcapServices[svcName][0].credentials.uri;
      mongoUrl = mongoUrl || vcapServices[svcName][0].credentials.url;
      break;
    }
  }
}
else {
  mongoUrl = "127.0.0.1:27017/extrnalSitedb";
}
mongoose.connect(mongoUrl);//connecting to the database

app.use(morgan('dev')); // log every request to the console

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ 'extended': 'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request

// ROUTES FOR API==============================
app.use('/api',require('./routes/ExternalSiteServices'));
app.use('/msg',require('./routes/MessageBoardApi'));

//SSO 

app.use(session({ secret: 'keyboard cat',saveUninitialized: true,
                 resave: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session()); 

passport.serializeUser(function(user, done) {
   done(null, user);
}); 

passport.deserializeUser(function(obj, done) {
   done(null, obj);
});

var services = JSON.parse(process.env.VCAP_SERVICES || "{}");
var ssoConfig = services.SingleSignOn[0]; 
var client_id = ssoConfig.credentials.clientId;
var client_secret = ssoConfig.credentials.secret;
var authorization_url = ssoConfig.credentials.authorizationEndpointUrl;
var token_url = ssoConfig.credentials.tokenEndpointUrl;
var issuer_id = ssoConfig.credentials.issuerIdentifier;
var callback_url = 'https://ibm-cbs-externalsite.mybluemix.net/auth/sso/callback';     
var OpenIDConnectStrategy = require('passport-idaas-openidconnect').IDaaSOIDCStrategy;

var Strategy = new OpenIDConnectStrategy({
                 authorizationURL : authorization_url,
                 tokenURL :token_url,
                 clientID : client_id,
                 scope: 'openid',
                 response_type: 'code',
                 clientSecret : client_secret,
                 callbackURL : callback_url,
                 skipUserProfile: true,
                 issuer: issuer_id}, 
   function(accessToken, refreshToken, profile, done) {
            process.nextTick(function() {
           profile.accessToken = accessToken;
         profile.refreshToken = refreshToken;
         done(null, profile);
           })
 }); 
passport.use(Strategy); 
app.get('/login', passport.authenticate('openidconnect',{scope: ['openid'] }));

function ensureAuthenticated(req, res, next) {
  if(!req.isAuthenticated()) {
              req.session.originalUrl = req.originalUrl;
    res.redirect('/login');
  } else {
    return next();
  }
}

app.get('/auth/sso/callback',function(req,res,next) {
            passport.authenticate('openidconnect',{
                 successRedirect: '/',                            
                 failureRedirect: '/failure',                        
          })(req,res,next);
                 });

app.get('/',ensureAuthenticated,function(req, res) {
             res.sendfile('./public/index.html');
             console.log(req.user);
           });

app.get('/failure', ensureAuthenticated, function(req, res) {
             res.send('Failed !');
           });

//Added for session
app.get('/getUser', ensureAuthenticated, function(req, res) {
 var userid= req.user.id;
 var company= userid.substring(userid.indexOf("_")+1);
    return res.json({"User":req.user.id, "Company":company});
 });

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, appEnv.bind, function() {

  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});


//   app.get('/logout',function(req, res) {
// // //   //passport._strategy('openidconnect').logOut(req, res, 'https://ibm-cbs-externalsite.mybluemix.net/login');
//  //      req.logout();
//     //    req.session.destroy(function(err){
//     //      if (err) { return next(err); }
//     //       res.send("logged out");
//     // console.log(req.cookies);
//          req.session.destroy();
//          res.redirect('/login');
// // //     // The response should indicate that the user is no longer authenticated.
// // //     // return res.send({ authenticated: req.isAuthenticated() });
//     res.clearCookie();
   
//  });

