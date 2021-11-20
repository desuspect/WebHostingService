const fs = require('fs');

module.exports.loadData = function (plan) {
    plan.findAll().then((data) => {
        const string = JSON.stringify(data);
        fs.writeFile('./public/planData.js', string, (err) => {
            if (err) {
                throw err;
            }
            console.log("JSON data is saved.");
        });
      
    })
  };

  

