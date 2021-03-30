"use strict";

const Router = require("express").Router;
const { UnauthorizedError } = require("../expressError")
const { authenticateJWT } = require("../middleware/auth");
const router = new Router();
const Message = require("../models/message")

router.use(authenticateJWT);
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", async (req, res, next) => {
  const message = await Message.get(req.params.id);
  if (res.locals.user.username === message.to_user.username || res.locals.user.username === message.from_user.username) {
    return res.json({ message });
  } 
  return next(new UnauthorizedError());
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", async (req, res, next) => {
  const {to_username, body} = req.body;
  const from_username = res.locals.user.username;
  return res.json({message: await Message.create({from_username, to_username, body})})
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", async (req, res, next) => {
  const {id} = req.params;
  const toUsername = (await Message.get(id)).to_user.username;
  if ( res.locals.user.username === toUsername) {
    return res.json({message: await Message.markRead(id)})
  }
  return next(new UnauthorizedError());
});

module.exports = router;