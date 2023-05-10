const express = require('express');
const router = express.Router();
const randomGenerator = require("./utils/randomGenerator");
const encryptPassword = require("./utils/encryptPassword");
const Admin = require("./models/admin");

router.get("/", (req, res) => {
    res.render("signup");
  });

router.post("/", async(req, res) => {
    let {username , password, confirmPassword} = req.body;
    // Check if password matches confirmPassword
    if (password !== confirmPassword) {
      res.status(400).send('Passwords do not match.');
    }
    // Generate a random salt value
    let salt = randomGenerator();
    // Encrypt the password with salt
    let userhash = encryptPassword(password, salt);
    // Create a new record
    let newAdmin = new Admin({username, salt, userhash})
    
    newAdmin.save().then(() =>{
      res.render("signup-accept");
    }).catch(()=>{
      res.render("signup-error");
    })
});

router.get('/check-adminname', async(req, res) => {
    // Obtain admin name from request
    const { username } = req.query;

    // Query if the admin name exist
    let adminUser = await Admin.findOne({username : username})

    // Return the result to front-end page
    if(!adminUser) {
      res.send("available");
    } else {
      res.send("exists");
    }

});

module.exports = router;
