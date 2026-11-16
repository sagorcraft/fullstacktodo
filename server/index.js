require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/userModel");

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URL).then(() => {
  console.log("Database Connected!");
});

let PORT = process.env.PORT || 5000;
let pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post("/registration", async (req, res) => {
  let { fullname, email, password, confirmPassword } = req.body;

  if (!fullname || !email || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Please fill the all fields!",
    });
  }

  if (!pattern.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email",
    });
  }

  let exsistingUser = await User.findOne({ email: email });

  if (exsistingUser) {
    return res.status(400).json({
      success: false,
      message: "User already exsist",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Please enter confirm Password",
    });
  }

  let user = new User({
    fullname: fullname,
    email: email,
    password: password,
  });

  await user.save();

  res.status(201).json({
    success: true,
    message: "Registration Successful",
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (user.password !== password) {
    return res.status(401).json({
      success: false,
      message: "Invalid password",
    });
  }

  res.status(200).json({
    success: true,
    message: "Login successful",
  });
});

app.listen(PORT, () => {
  console.log("Server is running");
});
