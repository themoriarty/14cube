var express = require("express");
var settings = require("./settings")
var Storage = require("./storage")(settings);
storage = new Storage()

var Routes = require("./routes")(settings, storage)
var MongoStore = require("connect-mongo")(express);

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');    
    app.use(express.logger("dev"));
    app.use(express.cookieParser(settings.secret));
    app.use(express.session({secret: settings.secret, cookie: {maxAge: 3600 * 10 * 1000}, proxy: false, store: new MongoStore(settings.db)}))
    app.use(express.bodyParser());
    app.use(express.csrf());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
r = new Routes();
app.get('/', r.index);
app.post('/login', r.login);
app.get('/authFailed', r.authFailed);
app.get("/get", r.get)
app.post("/put", r.put)
app.get("/rnd", r.rnd)
app.get("/nrnd", r.nrnd)

app.listen(8888, function(){
    console.log("started");
});
