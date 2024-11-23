"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, ensureIsAdmin, ensureIsAdminOrUser } = require("../middleware/auth");
const { BadRequestError, ExpressError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const jobApplicationSchema=require("../schemas/userJobApplication.json")

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: login, admin only
 **/

router.post("/", ensureLoggedIn, ensureIsAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});

/** POST /:username/jobs/:id  => { user, token }
 *
 * Adds a new job application for the :user
 * 
 *  returns {applied: jobId }
 *
 * Authorization required: login, owning user, admin
 **/
router.post("/:username/jobs/:id",ensureLoggedIn, ensureIsAdminOrUser, async function(req,res,next){
  try{
    console.log("******************************************************")
    console.log("this is req.params /:username/jobs/:id---->", req.params)
    const validator=jsonschema.validate(req.params, jobApplicationSchema);
    if(!validator.valid){
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const application=await User.apply4Job(req.params.username,req.params.id)
    // convert to int because req.params.id is a string 
    return res.status(201).json({applied:parseInt(req.params.id)})
  }
  // error handling in this route is handled in a unique manner.
  // option 1 is We could've altered the model method User.apply4Job to do 2 additional queries checking if the user and job both exist.
  // However, rather than tax the db and make 2 async queries, we could just user the error object to tell a missing user apart from a missing job.
  // normally I would use the err.code to tell the two apart but a missing user and missing job give the same code for FKC violation,
  // thus, we are using the err.constraint to differentiate the two errors and therefore a missing user from a missing job!

  catch(err){
    console.log("the error data is --->",err)
    // if foreign key constraint is violated check which one
    if(err.code === "23503"){
      // if username doesn't exist we violate username FKC and repsond with missing user feedback
      if (err.constraint === "applications_username_fkey") {
        return next(new ExpressError(`No user found for ${req.params.username}. Please reapply with a valid user.`, 400));
      }
      // if job doesn't exist we violate job FKC and repsond with missing job feedback
      if (err.constraint === "applications_job_id_fkey") {
        return next(new ExpressError(`No job found for jobId ${req.params.id}. Please reapply with a valid job.`, 400));
      }
    }
    return next (err)
  }
})


/** GET / => { users: [ {username, firstName, lastName, email, jobs:[jobid1...jobid2] }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: login, admin only
 **/

router.get("/", ensureLoggedIn, ensureIsAdmin, async function (req, res, next) {
  try {
    const users = await User.findAllWithJobApps();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: login
 **/

router.get("/:username", ensureLoggedIn, ensureIsAdminOrUser, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login
 **/

router.patch("/:username", ensureLoggedIn, ensureIsAdminOrUser, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login
 **/

router.delete("/:username", ensureLoggedIn, ensureIsAdminOrUser, async function (req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
