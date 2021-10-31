const express = require('express');
const path = require('path');
const handle = require('express-handlebars');
const body = require('body-parser');
const validation = require("./validation.js");

const app = express();

app.engine(".hbs", handle({extname:".hbs"}));
app.set("view engine", ".hbs");

app.use(body.urlencoded({extended:false}));


app.use(express.static(path.join(__dirname, '/public')));

app.get("/", function (req, res){
    res.render("home", {layout: false})
})

app.get("/registration", function (req, res){
    res.render("registration", {layout: false})
})

app.get("/login", function (req, res){
    res.render("login", {layout: false})
})

app.get("/plans", function (req, res){
    res.render("plans", {layout: false})
})

app.post("/login", function (req, res){
      validation.usernameCheck(req.body.username)
      .then(good =>{
        res.render('dashboard', {layout: false, username : req.body.username})
      })
     .catch(err =>{  
        res.render('login', {layout: false, error : err})
    })
})                                  

app.post("/registration", function (req, res){
validation.registrationCheck(req)
.then(() =>{
  res.render('dashboard', {layout: false, username : req.body.name})
})
.catch(err =>{ 
    if (err === "No Special Characters Allowed") {
        res.render('registration', {layout: false, errorName : err})      
    }
    if (err === "No Numbers allowed") {
        res.render('registration', {layout: false, errorName : err})
    }
    if (err === "Missing Special Characters") {
        res.render('registration', {layout: false, errorPassword : err})
    }
    if (err === "Password must be between 6 and 10 characters") {
        res.render('registration', {layout: false, errorPassword : err})
    }
    if (err === "Invalid Format") {
        res.render('registration', {layout: false, errorEmail : err})
    }
    })                               
})










const PORT = process.env.PORT || 8080

app.listen(PORT, () => console.log(`Server on port ${PORT}`))