"use strict";

const Router = require("express").Router;
const router = new Router();
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config")
const User = require("../models/user")
const { UnauthorizedError } = require("../expressError")
/** POST /login: {username, password} => {token} */

router.post("/login", async function (req, res, next) {
  let {username, password} = req.body;
  if (await User.authenticate(username, password)) {
    let token = jwt.sign({ username }, SECRET_KEY);
    return res.json({ token });
  } 
  throw new UnauthorizedError("Invalid password/username combination");
});

router.post("/register", async function (req, res, next) {
  let { username } = await User.register(req.body);
  let token = jwt.sign({ username }, SECRET_KEY)
  return res.json({ token })
})

module.exports = router;