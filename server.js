const express = require("express");
const handle = require("express-handlebars");
const body = require("body-parser");
const path = require("path");
const sequelize = require("sequelize");
const multer  = require('multer');
const validation = require("./validation.js");
const loadPlans = require("./loadPlans");

const storage = multer.diskStorage({
  destination: './public/img',
  filename: function(req, file, cb){
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('photo');

// Check File Type
function checkFileType(file, cb){
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images Only!');
  }
}

const app = express();
const seq = new sequelize(
  "dbepeavbt2cgi", //database name
  "fhgdzzhwlqrjhj", //database username
  "a9fe99ed8c4fcd8fefecd7f9c4c332fa0b23c5b459291e226d5bfe2f440b34cc", // database password
  {
    host: "ec2-44-193-255-156.compute-1.amazonaws.com",
    dialect: "postgres",
    port: 5432,
    dialectOptions: { ssl: { rejectUnauthorized: false } },
  }
);

const user = seq.define("user", {
  userId: {
    type: sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: sequelize.STRING,
    allowNull: false,
  },
  username: {
    type: sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  lastname: {
    type: sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  userType: {
    type: sequelize.STRING,
    allowNull: false,
  },
});

const plan = seq.define("plan", {
  planId: {
    type: sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: sequelize.STRING,
    allowNull: false,
  },
  price: {
    type: sequelize.INTEGER,
  },
  img: {
    type: sequelize.STRING
  },
});

user.create({
    name : "admin",
    lastname : "admin",
    email: "admin",
    password: "admin",
    username: "admin",
    userType: "admin"
}).then(() => {
    console.log("USER CREATED")

}).catch(err => console.log("CREATION ERROR " + err))

const planFeatures = seq.define("planFeatures", {
  planId: {
    type: sequelize.INTEGER,
  },
  description: {
    type: sequelize.STRING,
    allowNull: false,
  },
});

app.use(body.urlencoded({ extended: false }));
app.engine(".hbs", handle({ extname: ".hbs" }));
app.set("view engine", ".hbs");
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, "/public")));

app.get("/", function (req, res) {
  res.render("home", { layout: false });
});

app.get("/registration", function (req, res) {
  res.render("registration", { layout: false, plans: plan });
});

app.get("/login", function (req, res) {
  res.render("login", { layout: false });
});

app.get("/plans", function (req, res) {
  var plansfeaturesdata
  planFeatures.findAll().then(data =>{
    plansfeaturesdata = data;
  })

  plan.findAll().then((data) => { 
    res.render("plans", {
      layout: false,
      plans: JSON.stringify(data),
      planFeatures : JSON.stringify(plansfeaturesdata),
    });
  });
});

app.post("/login", function (req, res) {
  validation
    .loginCheck(req, user)
    .then((userid) => {
      user
        .findAll({
          where: {
            userId: userid,
          },
        })
        .then((currentUser) => {
          if (currentUser[0].dataValues.userType === "admin") {
            res.render("dashboard", {
              layout: false,
              name: currentUser[0].dataValues.name,
              lastname: currentUser[0].dataValues.lastname,
              email: currentUser[0].dataValues.email,
              admin: currentUser[0].dataValues.userType,
            });
          } else {
            res.render("dashboard", {
              layout: false,
              name: currentUser[0].dataValues.name,
              lastname: currentUser[0].dataValues.lastname,
              email: currentUser[0].dataValues.email,
              user: currentUser[0].dataValues.userType,
            });
          }
        });
    })
    .catch((err) => {
      res.render("login", { layout: false, error: err });
    });
});

app.post("/registration", function (req, res) {
  validation
    .registrationCheck(req, user)
    .then(() => {
      user
        .create({
          email: req.body.email,
          password: req.body.password,
          username: req.body.username,
          name: req.body.name,
          lastname: req.body.lastname,
          userType: "user",
        })
        .then(() => {
          console.log("CREATED");
        })
        .catch((err) => console.log("this happened creating: " + err));
    })
    .then(() =>
      res.render("dashboard", {
        layout: false,
        username: req.body.username,
        name: req.body.name,
        lastname: req.body.lastname,
        email: req.body.email,
        user: "user"
      })
    )
    .catch((err) => {
      console.log(err);
      if (err === "No Special Characters Allowed") {
        res.render("registration", { layout: false, errorName: err });
      }
      if (err === "No Numbers allowed") {
        res.render("registration", { layout: false, errorName: err });
      }
      if (err === "Missing Special Characters") {
        res.render("registration", { layout: false, errorPassword: err });
      }
      if (err === "Password must be between 6 and 10 characters") {
        res.render("registration", { layout: false, errorPassword: err });
      }
      if (err === "Invalid Format") {
        res.render("registration", { layout: false, errorEmail: err });
      }
      if (err === "Email is already been used") {
        res.render("registration", { layout: false, errorEmail: err });
      }
    });
});

app.post("/dashboard",  (req, res) =>  {
  res.render("addPlan", { layout: false});
});

app.post("/plans",  (req, res) =>  {
  res.json(plan)
});


app.post("/addPlan", (req, res) => {
  upload(req, res, (err) => {
    if(err){
      console.log(err)
      res.render('addPlan', { 
        layout: false,
        error: err
      });
    } else {
      if(req.file == undefined){
        console.log("empty error")
        res.render('addPlan', {
          error: 'Error: No File Selected!',
          layout: false
        });
      } else {
        plan
    .create({
      title: req.body.title,
      price: req.body.price,
      description: req.body.description,
      img: `/img/${req.file.filename}`
    })
    .then(() => {
      console.log("PLAN CREATED");

      plan.findAll().then((data) => {
        var index = data.length - 1;
        
        planFeatures
          .create({
            planId: data.length,
            description: req.body.feature0
          })
          .then(() => {
            console.log("FEATURE CREATED");
          })
          .catch((err) => console.log("this happened creating: " + err));

          if (req.body.feature1) {
            planFeatures
            .create({
              planId: data[index].dataValues.planId,
              description: req.body.feature1
            })
            .then(() => {
              console.log("FEATURE CREATED");
            })
            .catch((err) => console.log("this happened creating: " + err));
  
          }
          if (req.body.feature2) {
            planFeatures
            .create({
              planId: data[index].dataValues.planId,
              description: req.body.feature2
            })
            .then(() => {
              console.log("FEATURE CREATED");
            })
            .catch((err) => console.log("this happened creating: " + err));
  
          }
          if (req.body.feature3) {
            planFeatures
            .create({
              planId: data[index].dataValues.planId,
              description: req.body.feature3
            })
            .then(() => {
              console.log("FEATURE CREATED");
            })
            .catch((err) => console.log("this happened creating: " + err));
          }
          res.render('dashboard', {
            file: `./public/img/${req.file.filename}`,
            layout: false
          });
  
      });
    })
    .catch((err) => console.log("this happened creating: " + err));
      }
    }
  });


  
});




seq.sync().then(() => {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => console.log(`Server on port ${PORT}`));
  })
  .catch((err) => {
    console.log(err);
  });




  