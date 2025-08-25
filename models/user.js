var mongoose = require("mongoose");
var moment = require("moment");
//const validator = require("validator");
//const bcrypt = require("bcrypt");
//const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },

  phone: {
    type: String,
    required: false,
    unique: true,
    trim: true
  },

  date: {
    type: String,
    default: moment().format("MMMM Do YYYY, h:mm:ss a")
  },

  history: [
    {
      type: String,
      default: "Joined on " + moment().format("l")
    }
  ],

  balance: {
    type: Number,
    default: 0 // Changed from 100000 to 0
  },

  cash: {
    type: Number,
    default: 0 // Changed from 100000 to 0
  },

  email: {
    type: String,
    lowercase: true,
    unique: true
  },

  password: {
    type: String
  },

  tokens: [
    {
      token: {
        type: String,
        required: true
      }
    }
  ]
});

/*
// Example for password hashing or token generation if needed
*/

const User = mongoose.model("user", UserSchema);
module.exports = User;
