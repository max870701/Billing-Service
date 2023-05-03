const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");
const User = require("./models/user");
const Record = require("./models/record");
const Admin = require("./models/admin");

/* GET users listing. */
router.get("/", async (req, res) => {
  try {
    let data = await User.find({});
    res.render("users", { data });
  } catch {
    res.send("Error with finding data.");
  }
});

router.get("/create", (req, res) => {
  res.render("userCreate");
});

router.get("/operation", (req, res) => {
  res.render("userOperation");
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    // All records
    let records = await Record.find({ id: id });
    // User info
    let data = await User.findOne({ id: id });
    if (data !== null) {
      res.render("userPage", { data, records });
    } else {
      res.send("Cannot find this user. Please enter a valid id.");
    }
  } catch(e) {
    res.send("Error!!");
    console.log(e);
  }
});

router.get("/edit/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let data = await User.findOne({ id : id});
    if (data !== null) {
      res.render("edit", { data });
    } else {
      res.send("Cannot find user.");
    }
  } catch {
    res.send("Error!");
  }
});

router.put("/edit/:id", async (req, res) => {
  let { id } = req.params;
  let { name } = req.body;
  try {
    let d = await User.findOneAndUpdate({ id }, { name });
    res.redirect(`/users/${id}`);
  } catch {
    res.render("reject");
  }
});

router.post("/create", async (req, res) => {
  let { id, name } = req.body;
  let service_type = "Create Account";
  let previous_balance = 0;
  let change_amount = 100;
  let current_balance = change_amount;

  const data = await User.findOne({ id: id });
  if (data !== null) {
    res.send("ID conflict.");
  } else {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const newUser = new User({
        id,
        name,
        current_balance,
      });

      const newRecord = new Record({
        id,
        service_type,
        previous_balance,
        change_amount,
        current_balance,
      });

      await newUser.save({ session });
      await newRecord.save({ session });
      await session.commitTransaction();

      console.log("user and record accepted.");
      res.render("accept");
    } catch (e) {
      console.log("user and record not accepted.");
      console.log(e);
      await session.abortTransaction();
      res.render("reject");
    } finally {
      session.endSession();
    }
  }
});

router.post("/operation", async (req, res) => {
  let { id, name, service_type, change_amount } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findOne({ id });
    if (!user) {
      throw new Error("User not found");
    }
    
    const previous_balance = Number(user.current_balance);
    change_amount = Number(change_amount);
    let current_balance;

    if (
      (service_type == "Deposit" || service_type == "Credit") &&
      change_amount > 0
    ) {
      current_balance = previous_balance + change_amount;
    } else if (
      (service_type == "Withdraw" || service_type == "Billing") &&
      change_amount > 0 &&
      change_amount <= previous_balance
    ) {
      current_balance = previous_balance - change_amount;
    } else {
      throw new Error("Invalid Service Type or Amount.");
    }
    
    const newRecord = new Record({
      id,
      service_type,
      previous_balance,
      change_amount,
      current_balance,
    });
    const filter = { id: id };
    const update = { $set: { current_balance: current_balance } };
    const options = {returnOriginal: false, session};

    await newRecord.save({ session });
    await User.findOneAndUpdate(filter, update, options);
    await session.commitTransaction();

    console.log("record accepted.");
    res.render("accept.ejs");
  } catch (e) {
    console.log("record not accepted.");
    await session.abortTransaction();
    res.render("reject.ejs");
  } finally {
    session.endSession();
  }
});

router.delete("/users/delete/:id", (req, res) => {
  let { id } = req.params;
  console.log(id)
  User.deleteOne({ id })
    .then((meg) => {
      console.log(meg);
    })
    .catch((e) => {
      console.log(e);
    });
    Record.deleteMany({ id })
    .then((meg) => {
      console.log(meg);
      res.send("Record and user Deleted successfully.");
    })
    .catch((e) => {
      console.log(e);
      res.send("Record and user  Delete failed.");
    });
});

module.exports = router;
