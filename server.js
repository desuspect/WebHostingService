const express = require("express");
const handle = require("express-handlebars");
const body = require("body-parser");
const path = require("path");
const sequelize = require("sequelize");
const validation = require("./validation.js");
const databaseValidation = require("./databaseValidation");

const app = express();
const seq = new sequelize(
  "dbbnqirrrcq67c", //database name
  "kvpszjkztgaehx", //database username
  "9a5eda67fab6abb24f476cc3a3a9d68a0cd7203422bef2a01d3c70b220bda532", // database password
  {
    host: "ec2-3-227-181-85.compute-1.amazonaws.com",
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
});
// user.create({
//     name : "Santiago",
//     lastname : "Arias",
//     email: "sarias-jaramillo@myseneca.ca",
//     password: "password1*",
//     username: "santiago",
//     userType: "admin"
// }).then(() => {
//     console.log("CREATED")

// }).catch(err => console.log("CREATION ERROR " + err))

app.use(body.urlencoded({ extended: false }));
app.engine(".hbs", handle({ extname: ".hbs" }));
app.set("view engine", ".hbs");

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
  plan.findAll().then((data) => {
    res.render("plans", {
      layout: false,
      title1: data[0].dataValues.title,
      description1: data[0].dataValues.description,
      title2: data[1].dataValues.title,
      description2: data[1].dataValues.description,
      title3: data[2].dataValues.title,
      description3: data[2].dataValues.description,
      title4: data[3].dataValues.title,
      description4: data[3].dataValues.description,
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

seq
  .sync()
  .then(() => {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => console.log(`Server on port ${PORT}`));
  })
  .catch((err) => {
    console.log(err);
  });
