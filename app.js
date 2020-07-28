//jshint esversion:6
const ex=require("express");
const env=require('dotenv').config()
const bp=require("body-parser");
const mongoose=require("mongoose");
const encrypt=require("mongoose-encryption");
const app=ex();
app.use(ex.static("public"))
app.use(bp.urlencoded({extended:true}));
app.set("view engine","ejs");
mongoose.connect("mongodb://localhost:27017/userDB",{
  useNewUrlParser:true,useUnifiedTopology:true
})
const userSchema=new mongoose.Schema({
  userName:{
    type:String,
    required:true
  },
  password:{
    type:String,
    required:true
  },
  secrets:[String]
})
const secretStr=process.env.SECRET;

userSchema.plugin(encrypt,{secret:secretStr, encryptedFields:["password"]});
const user=mongoose.model("user",userSchema)


app.get("/",function(req,res){
  res.render("home");
})


app.route("/login")
.get(function(req,res){
  res.render("login");
})
.post(function(req,res){
  user.findOne({
    userName:req.body.username
  },function(err,foundUser){
    if(err){
      res.render("home")
    }
    else{
      // console.log(foundUser);
      // console.log(req.body.password);
      if(foundUser.password===req.body.password){
        res.render("secrets")
      }
      else{
        res.render("home");
      }
    }
  })
})

app.route("/register")
.get(function(req,res){
  res.render("register");
})
.post(function(req,res){
  const newUser= new user({
    userName:req.body.username,
    password:req.body.password
  })
  newUser.save(function(err){
    if(err){
      res.send(err)
    }
    else{
      res.render("secrets")
    }
  })
})

app.get("/logout",function(req,res){
  res.render("home")
})

app.route("/submit").post(function(req,res){

})

app.listen(3000,function(){
  console.log("Port 300 listening");
})
