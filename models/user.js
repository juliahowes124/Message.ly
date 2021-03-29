"use strict";

const bcrypt = require('bcrypt');

const { BCRYPT_WORK_FACTOR } = require('../config');

const { NotFoundError } = require("../expressError");
const db = require("../db");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    console.log("WE MADE IT TO register.")
    const hashedPwd = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const resp = await db.query(`
    INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING username, password, first_name, last_name, phone
    `, [username, hashedPwd, first_name, last_name, phone])

    return resp.rows[0]
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const resp = await db.query(`
    SELECT password FROM users
    WHERE username = $1
    `, [username]);

    if(resp.rows.length === 0) throw new NotFoundError();

    const hashed_pwd = resp.rows[0].password;
    const isValidCredentials = await bcrypt.compare(password, hashed_pwd);
    if(isValidCredentials) {
      await this.updateLoginTimestamp(username)
    }
    return isValidCredentials
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    await db.query(`
    UPDATE users
    SET last_login_at=CURRENT_TIMESTAMP
    WHERE username = $1
    `, [username])
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const resp = await db.query(`
      SELECT username, first_name, last_name
      FROM users
    `)
    return resp.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const resp = await db.query(`
    SELECT username, first_name, last_name, phone, join_at, last_login_at
    FROM users
    WHERE username = $1
    `, [username])

    if(resp.rows.length === 0) throw new NotFoundError();
    return resp.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const resp = await db.query(`
    SELECT m.id, m.body, m.sent_at, m.read_at, u.username, u.first_name, u.last_name, u.phone
    FROM messages AS m
    JOIN users AS u
    ON u.username = m.to_username
    WHERE m.from_username = $1
    `, [username])

    if(resp.rows.length === 0) throw new NotFoundError();
    
    return resp.rows.map((row) => {
      const {id, body, sent_at, read_at, username, first_name, last_name, phone} = row
      return {id, body, sent_at, read_at, to_user: 
              {username, first_name, last_name, phone}}
    })

  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const resp = await db.query(`
    SELECT m.id, m.body, m.sent_at, m.read_at, u.username, u.first_name, u.last_name, u.phone
    FROM messages AS m
    JOIN users AS u
    ON u.username = m.from_username
    WHERE m.to_username = $1
    `, [username])

    if(resp.rows.length === 0) throw new NotFoundError();

    return resp.rows.map((row) => {
      const {id, body, sent_at, read_at, username, first_name, last_name, phone} = row
      return {id, body, sent_at, read_at, from_user: 
              {username, first_name, last_name, phone}}
    })
  }
}


module.exports = User;
