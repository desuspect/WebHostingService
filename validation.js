module.exports.usernameCheck = function (username) {
  return new Promise((resolve, reject) => {
    if (username) {
    const format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
      if (format.test(username)) {
        reject("Special Characters");
      } else {
        resolve();
      }
    }
    reject("Empty");
  });
};

module.exports.registrationCheck = function(req) {
    return new Promise((resolve, reject) => {
        const format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
        if (req.body.name) {
          if (format.test(req.body.name)) {
            reject("No Special Characters Allowed");
          } else {
              if (/\d/.test(req.body.name)) {
                reject("No Numbers allowed");
              }
              if (req.body.password) {
                if ((req.body.password.length >= 6) && (req.body.password.length <= 10) ){
                        if (!format.test(req.body.password)) {
                         reject("Missing Special Characters");
                          } else {
                            if (req.body.email) {
                              if (!format.test(req.body.email)) {
                                reject("Invalid Format");
                              } else {
                                resolve();
                              }
                            }
                            reject("Empty");
                        }
                }else{
                    reject("Password must be between 6 and 10 characters");
                }
            }
            reject("Empty");
          }
        }
        reject("Empty");
      });
}

