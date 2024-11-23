"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureIsAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyQuerySchema = require("../schemas/companyQuery.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login, Admin only
 */

router.post("/", ensureLoggedIn, ensureIsAdmin,  async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 * works via  Company model's buildDyanmicFilterQuery()
 */
// requires route testing!!!!!! 
router.get("/", async function (req, res, next) {
  try {
    console.log("inside GET /companies ()")
    console.log("inside GET /companies, here is req.query ----->", req.query)
    if(Object.keys(req.query).length !== 0){
      const coerced=Company.coerceQueryStringToInt(req.query)
      const validator=jsonschema.validate(coerced, companyQuerySchema)
      if(!validator.valid){
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
      const companies=await Company.buildDyanmicFilterQueryV2(coerced)
      return res.json({companies}) 
    }
    else{
    const companies = await Company.findAll();
    return res.json({ companies });
    }
  } catch (err) {
    return next(err);
  }
});



/** GET /dynamicQuery  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * works using buildDyanmicFilterQuery () engine in the Company model! This engine is better/requires much less code vrs determineCompanyQuery()!
 * route is same as GET / it just solves the search filters using a different method that builds a query string dynamically
 * this is in contrast to writing many different static queries depending upon what search filters are given! 
 * Authorization required: none
 */
// requires new testing!!!!!!
router.get("/dynamicQuery", async function (req, res, next){
  try{
    console.log("inside GET /companies/dynamicQuery")
    console.log("inside GET /companies/dynamicQuery", "here is req.query----->", req.query)
    if(Object.keys(req.query).length !==0){
      const coerced=Company.coerceQueryStringToInt(req.query)
      const validator=jsonschema.validate(coerced, companyQuerySchema)
      if(!validator.valid){
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
      const companies= await Company.buildDyanmicFilterQuery(coerced)
      return res.json({companies}) 
    }
    else{
      const companies = await Company.findAll();
      return res.json({ companies });
    }
  }
  catch(err){
    return next(err);
  }
})

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login, Admin only
 */

router.patch("/:handle", ensureLoggedIn, ensureIsAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login Admin only
 */

router.delete("/:handle", ensureLoggedIn, ensureIsAdmin, async function (req, res, next) {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
