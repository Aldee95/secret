//jshint esversion:6
const ex = require("express");
const env = require('dotenv').config()
const bp = require("body-parser");
const mongoose = require("mongoose");
const passport=require("passport")
const passportLocalMongoose=require("passport-local-mongoose");
const session=require("express-session");
const findOrCreate=require("mongoose-findorcreate")
const GoogleStrategy=require("passport-google-oauth20").Strategy;
// mongoose.set('useFindAndModify', false);
// const md5=require("md5");
// const bcrypt=require("bcrypt");
// const saltRounds=10;
// const encrypt=require("mongoose-encryption");
mongoose.set('useCreateIndex', true);
const app = ex();
app.use(ex.static("public"))
app.use(bp.urlencoded({
  extended: true
}));
app.set("view engine", "ejs");

app.use(session({
  secret:process.env.SECRET,
  resave:false,
  saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
const userSchema = new mongoose.Schema({
  email:String,
  password:String,
  googleId:String
})
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// const secretStr=process.env.SECRET;

// userSchema.plugin(encrypt,{secret:secretStr, encryptedFields:["password"]});
const User = mongoose.model("User", userSchema)

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
app.get("/auth/google",passport.authenticate("google",{scope:["profile"]}))
app.get("/", function(req, res) {
  res.render("home");
})

app.get("/auth/google/secrets",passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  })


app.route("/login")
  .get(function(req, res) {
    res.render("login");
  })
  .post(function(req, res) {

    const user= new User({
      username:req.body.username,
      password:req.body.password
    })
    req.login(user,function(err){
      if(err){
        console.log(err);
      }
      else{
        passport.authenticate("local")(req,res,function(){
          res.redirect("/secrets");
        })
      }
    })

  })

app.get("/secrets",function(req,res){
  if(req.isAuthenticated()){
    res.render("secrets")
  }
  else{
    res.redirect("/login");
  }

})

app.get("/secrets",function(req,res){
  if(req.isAuthenticated()){
    res.render("/secrets");
  }
  else{
    res.redirect("/login");
  }
})

app.route("/register")
  .get(function(req, res) {
    res.render("register");
  })
  .post(function(req, res) {
    // console.log(req.body.username);

    User.register({username:req.body.username},req.body.password,function(err,user){
      if(err){
        console.log(err);
        res.redirect("/register");
      }
      else{
        passport.authenticate("local")(req,res,function(){
          res.redirect("/secrets")
        })
      }
    })


  })

app.get("/logout", function(req, res) {
  req.logout();
  res.render("home")
})

app.route("/submit").post(function(req, res) {

})

app.listen(3000, function() {
  console.log("Port 300 listening");
})
