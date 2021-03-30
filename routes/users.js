"use strict";

const Router = require("express").Router;
const User = require("../models/user");
const {authenticateJWT, ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth");

const router = new Router();

router.use(authenticateJWT);

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get('/', ensureLoggedIn, async (req, res) => {
  return res.json({users: await User.all()});
})


/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get('/:username', ensureCorrectUser, async (req, res) => {
  return res.json({user: await User.get(req.params.username)});
})



/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/to', ensureCorrectUser, async (req, res) => {
  return res.json({messages: await User.messagesTo(req.params.username)})
})


/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/from', ensureCorrectUser, async (req, res) => {
  return res.json({messages: await User.messagesFrom(req.params.username)})
})

module.exports = router;