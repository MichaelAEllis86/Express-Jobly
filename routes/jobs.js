"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureIsAdmin } = require("../middleware/auth");
const Job = require("../models/jobs");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema=require("../schemas/jobUpdate.json");
const jobQuerySchema=require("../schemas/jobQuery.json");
const { JsonWebTokenError } = require("jsonwebtoken");
// const companyQuerySchema = require("../schemas/companyQuery.json");
// const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Authorization required: none

 */

router.get("/", async function(req,res,next){
    try{
        console.log("inside GET /jobs ()")
        console.log("inside GET /jobs, here is req.query ----->", req.query)
        if (Object.keys(req.query).length !==0){
          const coerced=Job.coerceQueryStrings(req.query)
          const validator=jsonschema.validate(coerced,jobQuerySchema ) 
          if(!validator.valid){
            const errs=validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
          }
          const jobs=await Job.buildDynamicFilterQueryJobs(coerced)
          return res.json({jobs})
        }
        else{
          const jobs=await Job.buildDynamicFilterQueryJobs();
          return res.json({jobs})

        }
    }
    catch(err){
        return next(err)

    }
})

/** GET /[id]  =>{ job } fetches single job by id
 *   job is { id, title, salary, equity, companyHandle }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
    try {
      const job = await Job.getById(req.params.id);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });

/** GET /title/[title]  =>
 * { jobs:[{id, title, salary, equity, companyHandle},...] }
 *   
 *
 * Authorization required: none
 * 
 * this is a secondary access to finding a job! If a user would like to search by title they can!
 */

router.get("/title/:title", async function (req, res, next) {
    try {
      const jobs = await Job.getByTitle(req.params.title);
      return res.json({ jobs });
    } catch (err) {
      return next(err);
    }
  });

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns {id, title, salary, equity, companyHandle }
 *
 * Authorization required: login + Admin only
 */


router.post("/", ensureLoggedIn, ensureIsAdmin, async function(req,res,next){
    try{
        const validator=jsonschema.validate(req.body,jobNewSchema)
        if(!validator.valid){
            const errs=validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const job= await Job.create(req.body);
        return res.status(201).json({job});
    }
    catch(err){
        return next(err);
    }
})

/** DELETE /[id]  =>  { deleted: id, title}
 *
 * Authorization: login + Admin only
 */

router.delete("/:id", ensureLoggedIn, ensureIsAdmin, async function (req,res,next){
    try{
        const job=await Job.remove(req.params.id);
        return res.json({deleted: job})
    }
    catch(err){
        return next(err);

    }
})

/** PATCH /[id]  =>  { deleted: id, title}
 *
 * Authorization: login + Admin only
 * 
 * fields can be {title, salary, equity}! cannot update id or companyHandle!
 * 
 *  Returns {id, title, salary, equity, companyHandle }
 */

router.patch("/:id", ensureLoggedIn, ensureIsAdmin, async function (req,res,next){
  try{
    const validator=jsonschema.validate(req.body, jobUpdateSchema);
    if (! validator.valid){
      const errs=validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const job= await Job.update(req.params.id, req.body);
    return res.json({job})
  }
  catch(err){
    return next(err)
  }
})

module.exports = router;

