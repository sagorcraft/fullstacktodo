require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/userModel");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");

app.use(express.json());
app.use("/uploads", express.static("uploads"));
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

  // hashed password
  const hashedPassword = await bcrypt.hash(password, 10);

  let user = new User({
    fullname: fullname,
    email: email,
    password: hashedPassword,
  });

  await user.save();

  res.status(201).json({
    success: true,
    message: "Registration Successful",
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  //check require all fields
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }
  //Find user
  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invaild password",
    });
  }

  //Login successful
  return res.status(200).json({
    success: true,
    message: "Login successful",
    token: "dummy-token-" + user._id,
    user: {
      id: user._id,
      name: user.fullname,
      fullname: user.fullname,
      email: user.email,
    },
  });
});

// Multer Storage Configuration

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  },
});

const upload = multer({ storage: storage });

// image upload API
app.post("/upload", upload.single("profile"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      file: req.file,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log("Server is running");
});
