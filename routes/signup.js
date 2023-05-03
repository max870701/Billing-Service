const express = require('express');
const router = express.Router();
const randomGenerator = require("./utils/randomGenerator");
const encryptPassword = require("./utils/encryptPassword");
const Admin = require("./models/admin");

router.get("/", (req, res) => {
    res.render("signup");
  });

router.post("/", async(req, res) => {
    let {username , password, confirmPassword} = req.body
    // Check if password matches confirmPassword
    if (password !== confirmPassword) {
      res.status(400).send('Passwords do not match.');
    }
    // Generate a random salt value
    let salt = randomGenerator();
    // Encrypt the password with salt
    let userhash = encryptPassword(password, salt);
  
    let foundUser = await Admin.findOne({username : username})
    if(!foundUser){
      let newAdmin = new Admin({username , salt, userhash})
      newAdmin.save().then(() =>{
        res.send("Signup successfully");
      }).catch(()=>{
        res.send("Error!")
      })
    }else{
      res.send("UserName exist")
    }
});

module.exports = router;
