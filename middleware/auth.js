"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError, ForbiddenError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

// tokens information is sent via request.headers! like so "authorization": bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im1vb2tzMjAyMiIsImlzQWRtaW4iOmZhbHNlLCJpYXQiOjE3Mjc2NDg5OTh9._f9ZuiYyDQMqWc3UAPaP70u04i4Gsi9kiJTsxydpu18
function authenticateJWT(req, res, next) {
  try {
    console.log("inside authJWT()")
    console.log("this is req.headers in authJWT---->", req.headers)
    console.log("this is req.headers.authorization in authJWT---->", req.headers.authorization)
    const authHeader = req.headers && req.headers.authorization;
    console.log("this is authHeader in authJWT---->", authHeader)
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      console.log("this is the token---->", token)
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    console.log("inside ensureLoggedIN()", "this is res.locals.user----->", res.locals.user)
    if (!res.locals.user) throw new UnauthorizedError();
    console.log("token is valid moving to next middleware or route...")
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when route is admin only!.
 *
 * If not admin, raises Forbidden.
 */

function ensureIsAdmin(req,res,next){
  try{
    console.log("inside ensureIsAdmin()", "this is res.locals.user----->", res.locals.user)
    console.log("inside ensureIsAdmin()", "this is res.locals.user.isAdmin----->", res.locals.user.isAdmin)
    if (!res.locals.user.isAdmin) throw new ForbiddenError();
    console.log("token is valid admin!", "moving to next middleware or route...")
    return next()
  }
  catch(err){
    return next (err);
  }
}

/** Middleware to use when route is admin or user must have ownership!.
 *
 * If not admin, or the user's token does not match the route param /:username raises Forbidden.
 */

function ensureIsAdminOrUser(req,res,next){
  try{
    console.log("inside ensureIsAdminOrUser", "this is res.locals.user----->", res.locals.user)
    if(res.locals.user.isAdmin === true || res.locals.user.username === req.params.username){
      if(res.locals.user.isAdmin===true){
        console.log("user is a valid admin and is allowed to GET, PATCH, and DELETE users/!")
      }
      if(res.locals.user.username === req.params.username){
        console.log("user ownership match detected! user is allowed to GET PATCH and DELETE their own profile")
      }
      return next()
    }
    else{
      throw new ForbiddenError();
    }
  }
  catch(err){
    return next(err)
  }

}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureIsAdmin,
  ensureIsAdminOrUser
};
