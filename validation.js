module.exports.loginCheck = function (req, user) {
  return new Promise((resolve, reject) => {
    var found = false;
    var userid = 0;
    user
      .findAll()
      .then((data) => {
        data.forEach((element) => {
          if (
            element.dataValues.username === req.body.username &&
            element.dataValues.password === req.body.password
          ) {
            userid = element.dataValues.userId;
            found = true;
          }
        });
        if (found) {
          resolve(userid);
        } else {
          reject("User not found");
        }
      })
      .catch((err) => {
        console.log("LOGIN AUTHENTICATION ERROR " + err);
      });
  });
};

module.exports.registrationCheck = function (req, user) {
  return new Promise((resolve, reject) => {
    var found = false;
    const format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if (req.body.name) {
      if (format.test(req.body.name)) {
        reject("No Special Characters Allowed");
      } else {
        if (/\d/.test(req.body.name)) {
          reject("No Numbers allowed");
        }
        if (req.body.password) {
          if (req.body.password.length >= 6 && req.body.password.length <= 10) {
            if (!format.test(req.body.password)) {
              reject("Missing Special Characters");
            } else {
              if (req.body.email) {
                if (!format.test(req.body.email)) {
                  reject("Invalid Format");
                } else {
                  user
                    .findAll()
                    .then((data) => {
                      data.forEach((element) => {
                        if (element.dataValues.email === req.body.email) {
                          found = true;
                        }
                      });
                      if (found) {
                        reject("Email is already been used");
                      } else {
                        resolve();
                      }
                    })
                    .catch((err) => {
                      console.log("this happened finding: " + err);
                    });
                }
              } else {
                reject("Empty");
              }
            }
          } else {
            reject("Password must be between 6 and 10 characters");
          }
        } else {
          reject("Empty");
        }
      }
    } else {
      reject("Empty");
    }
  });
};
