'use strict';

const mongoose = require("mongoose");

let termsSchema = mongoose.Schema({
  name: { type: String },
  1: { type: Number },
  2: { type: Number },
  3: { type: Number },
  4: { type: Number },
  5: { type: Number },
  6: { type: Number }
});

/* METHODS */

let Terms = mongoose.model("Terms", termsSchema);
module.exports = Terms;
