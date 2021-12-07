const express = require("express");
const handle = require("express-handlebars");
const body = require("body-parser");
const path = require("path");
const sequelize = require("sequelize");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const clientSessions = require("client-sessions");
const validation = require("./validation.js");

const storage = multer.diskStorage({
  destination: "./public/img",
  filename: function (req,file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("photo");

// Check File Type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}
const app = express();
app.use(
  clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "WebHostingServices", // this should be a long un-guessable string.
    duration: 10 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 10000 * 60, // the session will be extended by this many ms each request (1 minute)
  })
);

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}


function ensureLoginHome(req, res, next) {
  if (req.session.user) {
    res.redirect("/dashboard");
  } else {
    next();
  }
}


const seq = new sequelize(
  "d6d6tieoqpvjfj", //database name
  "ijhmzpdfpzndps", //database username
  "c0f39b610eb8be80b16ffca6227bb906a3f17608849f5e2b13d6f300df2962b0", // database password
  {
    host: "ec2-54-160-35-196.compute-1.amazonaws.com",
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
    type: sequelize.STRING,
  },
  mostPopular: {
    type: sequelize.BOOLEAN,
  },
});

const cart = seq.define("cart", {
  cartId: {
    type: sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: sequelize.INTEGER,
  },
  planId: {
    type: sequelize.INTEGER,
  },
});

const order = seq.define("order", {
  orderId: {
    type: sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: sequelize.INTEGER,
  },
  planId: {
    type: sequelize.INTEGER,
  },
  type: {
    type: sequelize.INTEGER,
  },
});

const salt = bcrypt.genSaltSync(10);
const password = bcrypt.hash("admin", salt).then((password) => {
  user
    .create({
      name: "admin",
      lastname: "admin",
      email: "admin",
      password: password,
      username: "admin",
      userType: "admin",
    })
    .then(() => {
      console.log("USER CREATED");
    })
    .catch((err) => console.log("CREATION ERROR " + err));
});

const planFeatures = seq.define("planFeatures", {
  planId: {
    type: sequelize.INTEGER,
  },
  description: {
    type: sequelize.STRING,
    allowNull: false,
  },
});

var userID;

app.use(body.json());
app.engine(".hbs", handle({ extname: ".hbs" }));
app.set("view engine", ".hbs");
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "/public")));

app.get("/", ensureLoginHome, function (req, res) {
  var plansfeaturesdata;
  planFeatures.findAll().then((data) => {
    plansfeaturesdata = data;
  });

  plan.findAll().then((data) => {
    res.render("home", {
      layout: false,
      plans: JSON.stringify(data),
      planFeatures: JSON.stringify(plansfeaturesdata),
    });
  });
});

app.get("/registration", function (req, res) {
  res.render("registration", { layout: false, plans: plan });
});


app.get("/login", function (req, res) {
  res.render("login", { layout: false });
});

app.get("/plans", function (req, res) {
  var plansfeaturesdata;
  planFeatures.findAll().then((data) => {
    plansfeaturesdata = data;
  });

  plan.findAll().then((data) => {
    res.render("plans", {
      layout: false,
      plans: JSON.stringify(data),
      planFeatures: JSON.stringify(plansfeaturesdata),
    });
  });
});
app.get("/dashboard", ensureLogin, function (req, res) {
 
  user
    .findAll({
      where: {
        userId: req.session.user.id,
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
    }).catch(error => {
      console.log("dashboard ERROR: " + error)
    });
});

app.get("/logout", function(req, res) {
  req.session.reset();
  res.redirect("/login");
});

app.post("/login", function (req, res) {
  validation
    .loginCheck(req, user)
    .then((userid) => {
      userID = userid;
      user
        .findAll({
          where: {
            userId: userid,

          },
        })
        .then((currentUser) => {
          req.session.user = {
            username: currentUser[0].dataValues.name,
            email: currentUser[0].dataValues.email,
            id: currentUser[0].dataValues.userId,
            planId: "0"
          };
          res.redirect("/dashboard");
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
      const password = bcrypt.hash(req.body.password, salt).then((password) => {
        user
          .create({
            email: req.body.email,
            password: password,
            username: req.body.username,
            name: req.body.name,
            lastname: req.body.lastname,
            userType: "user",
          })
          .then(() => {
            console.log("CREATED");
          })
          .catch((err) => console.log("this happened creating: " + err));
      });
    })
    .then(() =>
      res.render("dashboard", {
        layout: false,
        username: req.body.username,
        name: req.body.name,
        lastname: req.body.lastname,
        email: req.body.email,
        user: "user",
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

app.post("/dashboard-create",  ensureLogin, (req, res) => {
  res.render("addPlan", { layout: false });
});
app.post("/dashboard-edit" , ensureLogin, (req, res) => {
  plan.findAll().then((data) => {
    res.render("editPlans", {
      layout: false,
      plans: JSON.stringify(data),
    });
  });
});

app.post("/editPlans", (req, res) => {
  var currentTitle = req.body.currentTitle;
  var title = req.body.title;
  var price = req.body.price;
  const mostPopular = req.body.mostPopular;
  const description = req.body.description;
  var ids = [];
  var id = 0;

  plan.findAll().then((data) => {
    data.forEach((plan) => {
      ids.push(plan.dataValues.planId);
      if (currentTitle === plan.dataValues.title) {
        id = plan.dataValues.planId;
      }
    });
              
    if (!mostPopular) {
      var values = { price: price, title: title, description: description, mostPopular: false};
      var selector = {
        where: { planId: id },
      };
      plan.update(values, selector).then((data) => {
        console.log("RECORD UPDATED");
      }).catch(err => {
        console.log(err + " ON NO POPULAR UPDATE")
      });
    } else {
      var values = { mostPopular: false };
      var selector = {
        where: { planId: ids },
      };
      plan.update(values, selector).then((data) => {
        console.log(id);
        console.log("RECORDS UPDATED");
        values = {
          price: price,
          title: title,
          description: description,
          mostPopular: true,
        };
        selector = {
          where: { planId: id },
        };
        plan.update(values, selector).then((data) => {
          console.log("RECORD UPDATED");
        }).catch(err => {
          console.log(err + " ON THE NEW TRUE")
        });
      }).catch(err => {
        console.log(err + " ON THE CLEAN")
      });
    }
    res.redirect("/plans");
  });
});



app.post("/addPlan", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.log(err);
      res.render("addPlan", {
        layout: false,
        error: err,
      });
    } else {
      if (req.file == undefined) {
        console.log("empty error");
        res.render("addPlan", {
          error: "Error: No File Selected!",
          layout: false,
        });
      } else {
        plan
          .create({
            title: req.body.title,
            price: req.body.price,
            description: req.body.description,
            img: `/img/${req.file.filename}`,
            mostPopular: req.body.mostPopular,
          })
          .then(() => {
            console.log("PLAN CREATED");

            plan.findAll().then((data) => {
              var index = data.length - 1;

              planFeatures
                .create({
                  planId: data.length,
                  description: req.body.feature0,
                })
                .then(() => {
                  console.log("FEATURE CREATED");
                })
                .catch((err) => console.log("this happened creating: " + err));

              if (req.body.feature1) {
                planFeatures
                  .create({
                    planId: data[index].dataValues.planId,
                    description: req.body.feature1,
                  })
                  .then(() => {
                    console.log("FEATURE CREATED");
                  })
                  .catch((err) =>
                    console.log("this happened creating: " + err)
                  );
              }
              if (req.body.feature2) {
                planFeatures
                  .create({
                    planId: data[index].dataValues.planId,
                    description: req.body.feature2,
                  })
                  .then(() => {
                    console.log("FEATURE CREATED");
                  })
                  .catch((err) =>
                    console.log("this happened creating: " + err)
                  );
              }
              if (req.body.feature3) {
                planFeatures
                  .create({
                    planId: data[index].dataValues.planId,
                    description: req.body.feature3,
                  })
                  .then(() => {
                    console.log("FEATURE CREATED");
                  })
                  .catch((err) =>
                    console.log("this happened creating: " + err)
                  );
              }

              res.redirect("/plans");
            });
          })
          .catch((err) => console.log("this happened creating: " + err));
      }
    }
  });
});


var planID;

app.get("/cart", ensureLogin, function (req, res) {
  var found;                                                            
  var planOnCart;
  cart
    .findAll()
    .then((data) => {
      for (let index = data.length - 1; index > 0; index--) {
        if (data[index].dataValues.userId === userID) {
          found = true;
          planID = data[index].dataValues.planId;          
          break;
        }
      }
      if (found) {
        req.session.user.planId = planID
        plan
        .findAll({
          where: {
            planId: planID,
          },
        })
        .then((data) => {  
          planOnCart = data[0].dataValues;
          res.render("cart", { layout: false, full: true, plan: JSON.stringify(planOnCart) });
        }).catch(error => {
          console.log(error)
        });
        
      } else {
        console.log("not found");
        res.render("cart", { layout: false, empty: true });
      }

    })
    .catch((error) => {
      console.log(error);
    });
});

app.post("/plans", ensureLogin, (req, res) => {
  console.log("/plans")
  cart
    .create({
      planId: req.body.planId,
      userId: userID,
    })
    .then((data) => {
      console.log(data);
      planID = data.dataValues.planId
      res.redirect("/cart");
    })
    .catch((error) => {
      console.log("this happened creating cart: " + error);
    });
});

app.post("/purchase", ensureLogin, (req, res) => {
  console.log(req.session.user)
  order
    .create({
      planId: req.session.user.planId,
      type: req.body.checkOut,
      userId: req.session.user.id,
    })
    .then((data) => {
      console.log(data);
      res.redirect("/dashboard");
    })
    .catch((error) => {
      console.log("this happened creating cart: " + error);
    });
});



app.post("/cart", ensureLogin, (req, res) => {
    var planSelected = req.body.planSelected;
    var price = req.body.planPrice;
    var finalPrice;
    
  if (planSelected === "1") {
    finalPrice = price + price*0.13
  }
  if (planSelected === "12") {
    finalPrice = price*12 + price*0.13
  }
  if (planSelected === "24") {
    finalPrice = price*24 + price*0.13
  }
  res.json({finalPrice : finalPrice})
  });




seq
  .sync()
  .then(() => {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => console.log(`Server on port ${PORT}`));
  })
  .catch((err) => {
    console.log(err);
  });
