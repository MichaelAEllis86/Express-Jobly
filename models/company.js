"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }

  
/** buildDyanmicFilterQuery----> Given a company data obj, Apply correct query filter condtions and search for and return data about companies.
 * if no data obj given, empty obj is passed for destructuring. Default values are assigned via obj destructure if a given key in the data obj is missing--> Ex. {companyName= null, minNumEmployees=1, maxNumEmployees=1000000000} ={}
 * Returns[{ handle, name, description, numEmployees, logoUrl, jobs }]
 * --->
*/
  static async buildDyanmicFilterQuery({name="", minEmployees=1, maxEmployees=1000000000} ={}){
    console.log("inside company model's buildDynamicQuery()")
    console.log("inside company model's buildDynamicQuery()",`here are your fn arguments----->companyName->${name}  minEmployees->${minEmployees} maxEmployees->${maxEmployees}`)
    if (minEmployees > maxEmployees){
      throw new BadRequestError("minimum employees cannot be higher than max employees")
    }
    let baseQuery=`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE 1=1`
    //hold values for each param in our query

    // the code below is another way we could've formatted the query!

    // let queryV2=`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" 
    //   FROM companies 
    //   WHERE name ILIKE '%${name}%' 
    //   AND num_employees >= $${minEmployees} 
    //   AND num_employees <= $${maxEmployees}`

    const queryValues=[]
    //track the parameter values for our query Ex $1, $2, $3. Each time we add a param to the query we increment this
    let numParams4Query=0

    //set up company name part of query string.
    if(name){
      numParams4Query++
      baseQuery += ` AND name ILIKE $${numParams4Query}`
      queryValues.push(`%${name}%`)
    }
    // if no name given in function call, match all company names
    else{
      baseQuery += ` AND name ILIKE '%%' `
    }
    //set up min employees part of query string. Default is 1 if param is not given in func call.
    numParams4Query++
    baseQuery +=` AND num_employees >= $${numParams4Query}`
    queryValues.push(minEmployees)
    //set up max employees part of query string. Default is 1 billion (1000000000)  if param is not given in func call.
    numParams4Query++
    baseQuery += ` AND num_employees <= $${numParams4Query}`
    queryValues.push(maxEmployees)
 
    // order results by name
    baseQuery+= ` ORDER BY name`
    console.log("inside company model's buildDynamicQuery()","Here are the numParams4Query---->",numParams4Query)
    console.log("inside company model's buildDynamicQuery()","Here is the queryValues array---->",queryValues)
    console.log("inside company model's buildDynamicQuery()","Here is the final query---->",baseQuery)

    //execute the query
    const companyResults=await db.query(baseQuery,queryValues)
    console.log("inside company model's buildDynamicQuery()", "here is companyResults.rows---->",companyResults.rows)
    // not found if no result
    if (companyResults.rows.length===0) {
      throw new NotFoundError(`No companies found with args companyName---> ${name}  minNumEmployees---> ${minEmployees}  maxNumEmployees---> ${maxEmployees}`);
    }
    return companyResults.rows
  }

  /** buildDyanmicFilterQueryV2----> Given a company data obj, Apply correct query filter condtions and search for and return data about companies.
 * if no data obj given, empty obj is passed for destructuring. Default values are assigned via obj destructure if a given key in the data obj is missing--> Ex. {companyName= null, minNumEmployees=1, maxNumEmployees=1000000000} ={}
 * Returns[{ handle, name, description, numEmployees, logoUrl, jobs }]
 * 
 * This version is nearly identical to buildDyanmicFilterQueryV1! Difference is how the data obj argument is destructured and how default values are set.
 * In version 2 no default values are given and nothing is added to the forming query if name, minEmployees, or maxEmployees is not given/null.
 * This ensures that no properties are present in the query if they are not explicitly filtered for by the user per Springboard's instructions!
*/

  static async buildDyanmicFilterQueryV2({ name = null, minEmployees = null, maxEmployees = null } = {}) {
    console.log("inside company model's buildDynamicQuery()");
    console.log("inside company model's buildDynamicQuery()", `companyName->${name} minEmployees->${minEmployees} maxEmployees->${maxEmployees}`);
  
    if (minEmployees !== null && maxEmployees !== null && minEmployees > maxEmployees) {
      throw new BadRequestError("minimum employees cannot be higher than max employees");
    }
  
    let baseQuery = `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE 1=1`;
    const queryValues = [];
    let numParams4Query = 0;
  
    // Company name
    if (name) {
      numParams4Query++;
      baseQuery += ` AND name ILIKE $${numParams4Query}`;
      queryValues.push(`%${name}%`);
    }
  
    // Min employees
    if (minEmployees !== null) {
      numParams4Query++;
      baseQuery += ` AND num_employees >= $${numParams4Query}`;
      queryValues.push(minEmployees);
    }
  
    // Max employees
    if (maxEmployees !== null) {
      numParams4Query++;
      baseQuery += ` AND num_employees <= $${numParams4Query}`;
      queryValues.push(maxEmployees);
    }
  
    // Order results by name
    baseQuery += ` ORDER BY name`;
  
    console.log("Here is the final query---->", baseQuery);
    console.log("Here is the queryValues array---->", queryValues);
  
    const companyResults = await db.query(baseQuery, queryValues);
    if (companyResults.rows.length === 0) {
      throw new NotFoundError(`No companies found with the given filters`);
    }
  
    return companyResults.rows;
  }
  
    
  // dynamically evaluate

  // determines what kind of query is send along with /get to companies! Determines the filter conditions/functions we apply
  static async determineCompanyQuery(queryDataObj){
    console.log("inside company model's  determineCompanyQuery()")
    if(Object.keys(queryDataObj).length ===3){
      const queryResults=await this.filterCompanybyNameMaxMin(queryDataObj.name, queryDataObj.minEmployees, queryDataObj.maxEmployees)
      console.log("logging the query results via determineCompanyQuery()---->", queryResults)
      return queryResults
    }
    else if (Object.keys(queryDataObj).length ===2){
      if(!queryDataObj.name){
        const queryResults=await this.filterCompanybyMinMax(queryDataObj.minEmployees, queryDataObj.maxEmployees)
        console.log("logging the query results via determineCompanyQuery()---->", queryResults)
        return queryResults
      }
      else if(!queryDataObj.minEmployees){
        const queryResults=await this.filterCompanybyNameMax(queryDataObj.name, queryDataObj.maxEmployees)
        console.log("logging the query results via determineCompanyQuery()---->", queryResults)
        return queryResults
      }
      else if(!queryDataObj.maxEmployees){
        const queryResults=await this.filterCompanybyNameMin(queryDataObj.name, queryDataObj.minEmployees)
        console.log("logging the query results via determineCompanyQuery()---->", queryResults)
        return queryResults
      }
    }
    else if (Object.keys(queryDataObj).length ===1){
      if(queryDataObj.name){
        const queryResults=await this.filterCompanybyName(queryDataObj.name)
        console.log("logging the query results via determineCompanyQuery()---->", queryResults)
        return queryResults
      }
      else if(queryDataObj.minEmployees){
        const queryResults=await this.filterCompanybyMinEmp(queryDataObj.minEmployees)
        console.log("logging the query results via determineCompanyQuery()---->", queryResults)
        return queryResults
      }
      else if(queryDataObj.maxEmployees){
        const queryResults=await this.filterCompanybyMaxEmp(queryDataObj.maxEmployees)
        console.log("logging the query results via determineCompanyQuery()---->", queryResults)
        return queryResults
      }
    }
  }

  static coerceQueryStringToInt(queryDataObj){
    console.log("inside company model's coerceQueryStringToInt()")
    console.log("inside company model's coerceQueryStringToInt(), this is the queryDataObj BEFORE coercion------>",queryDataObj)
    console.log("inside company model's coerceQueryStringToInt(), this is the queryDataObj.minEmployees type BEFORE coercion------>",typeof(queryDataObj.minEmployees))
    console.log("inside company model's coerceQueryStringToInt(), this is the queryDataObj.minEmployees type BEFORE coercion------>",typeof(queryDataObj.maxEmployees))

    if(queryDataObj.minEmployees){
      queryDataObj.minEmployees=parseInt(queryDataObj.minEmployees)
    }
    if(queryDataObj.maxEmployees){
      queryDataObj.maxEmployees=parseInt(queryDataObj.maxEmployees)
    }
    console.log("inside company model's coerceQueryStringToInt(), this is the queryDataObj AFTER coercion------>",queryDataObj)
    console.log("inside company model's coerceQueryStringToInt(), this is the queryDataObj.minEmployees type AFTER coercion------>",typeof(queryDataObj.minEmployees))
    console.log("inside company model's coerceQueryStringToInt(), this is the queryDataObj.minEmployees type AFTER coercion------>",typeof(queryDataObj.maxEmployees))
    return queryDataObj

  }


/** filterCompanybyName----> Given a company name query string, search for and return data about company 
 * Returns[{ handle, name, description, numEmployees, logoUrl, jobs }]
*/
  static async filterCompanybyName(companyName){
    console.log("inside company model's filterCompanyByName()")
    console.log("inside company model's filterCompanyByName()","here is your company name----->", companyName)
    const companyResults=await db.query(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"
      FROM companies WHERE name ILIKE $1 ORDER BY name`, [`%${companyName}%`])
      console.log("inside company model's filterCompanyByName()", "here are the company results.rows---->", companyResults.rows)
    if (companyResults.rows.length===0) {
      throw new NotFoundError(`No company: ${companyName}`);
    }
    return companyResults.rows
  }

  /** filterCompanybyMinEmp----> Given a minimum number of employees given in query string, search for and return data about companys with equal or more emps than number given. 
 * Returns[{ handle, name, description, numEmployees, logoUrl, jobs }]
*/

  static async filterCompanybyMinEmp(minNumEmployees){
    console.log("inside company model's filterCompanybyMinEmp()")
    console.log("inside company model's filterCompanybyMinEmp()","here is your minNumEmployees----->", minNumEmployees)
    const companyResults=await db.query(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"
      FROM companies WHERE num_employees >= $1`,[minNumEmployees])
      if (companyResults.rows.length===0) {
        throw new NotFoundError(`No company with more than : ${minNumEmployees} employees`)
      }
        return companyResults.rows
  }


  
  /** filterCompanybyMaxEmp----> Given a maximum number of employees given in query string, search for and return data about company with equal or less than number given.
 * Returns[{ handle, name, description, numEmployees, logoUrl, jobs }]
*/

static async filterCompanybyMaxEmp(maxNumEmployees){
  console.log("inside company model's filterCompanybyMaxEmp()")
  console.log("inside company model's filterCompanybyMaxEmp()","here is your maxNumEmployees----->", maxNumEmployees)
  const companyResults=await db.query(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"
    FROM companies WHERE num_employees <= $1`,[maxNumEmployees])
    if (companyResults.rows.length===0){
      throw new NotFoundError(`No company with less than : ${maxNumEmployees} employees`)
    }
      return companyResults.rows
}


  /** filterCompanybyNameMaxMin----> Given a companyName, minimum, and maximum number of employees given in query string, search for and return data about companies fitting these params 
 * Returns[{ handle, name, description, numEmployees, logoUrl, jobs }]
*/

static async filterCompanybyNameMaxMin(companyName,minNumEmployees,maxNumEmployees){
  console.log("inside company model's filterCompanybyNameMaxMin()")
  console.log("inside company model's filterCompanybyMaxEmp()",`here are your fn arguments-----> companyName->${companyName}
    minNumEmployees->${minNumEmployees} maxNumEmployees->${maxNumEmployees}`)
  if (minNumEmployees > maxNumEmployees){
    throw new BadRequestError("minimum employees cannot be higher than max employees")
  }
  const companyResults=await db.query(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"
      FROM companies WHERE name ILIKE $1 AND num_employees BETWEEN $2 AND $3 `, [`%${companyName}%`,minNumEmployees,maxNumEmployees])
  if (companyResults.rows.length===0){
    throw new NotFoundError(`No company found with arguments -----> companyName->${companyName}
      minNumEmployees->${minNumEmployees} maxNumEmployees->${maxNumEmployees} `)
  } 
      return companyResults.rows
  }

    /** filterCompanybyMinMax----> Given a minimum and maximum number of employees given in query string, search for and return data about companies fitting these params 
 * Returns[{ handle, name, description, numEmployees, logoUrl, jobs }]
*/

static async filterCompanybyMinMax(minNumEmployees,maxNumEmployees){
  console.log("inside company model's filterCompanybyMinMax()")
  console.log("inside company model's filterCompanybyMinMax()",`here are your fn arguments----->
    minNumEmployees->${minNumEmployees} maxNumEmployees->${maxNumEmployees}`)
  if (minNumEmployees > maxNumEmployees){
    throw new BadRequestError("minimum employees cannot be higher than max employees")
    }
  const companyResults=await db.query(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"
      FROM companies WHERE num_employees BETWEEN $1 AND $2 `, [minNumEmployees,maxNumEmployees])
  if (companyResults.rows.length===0){
    throw new NotFoundError(`No company found with arguments ----->
      minNumEmployees->${minNumEmployees} maxNumEmployees->${maxNumEmployees}`)
      }
      return companyResults.rows
    }

    /** filterCompanybyNameMin----> Given a companyName, minimum, number of employees given in query string, search for and return data about companies fitting these params 
 * Returns[{ handle, name, description, numEmployees, logoUrl, jobs }]
*/

static async filterCompanybyNameMin(companyName, minNumEmployees){
  console.log("inside company model's filterCompanybyNameMin()")
  console.log("inside company model's filterCompanybyNameMin()",`here are your fn arguments----->
    companyName->${companyName} minNumEmployees->${minNumEmployees}`)
  const companyResults=await db.query(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"
    FROM companies WHERE name ILIKE $1 AND num_employees >= $2 `, [`%${companyName}%`,minNumEmployees])
    if (companyResults.rows.length===0){
      throw new NotFoundError(`No company found with arguments -----> companyName->${companyName}
        minNumEmployees->${minNumEmployees}`)
        }
        return companyResults.rows
}

    /** filterCompanybyNameMax----> Given a companyName, and maximum number of employees given in query string, search for and return data about companies fitting these params 
 * Returns[{ handle, name, description, numEmployees, logoUrl, jobs }]
*/

static async filterCompanybyNameMax(companyName, maxNumEmployees){
  console.log("inside company model's filterCompanybyNameMax()")
  console.log("inside company model's filterCompanybyNameMax()",`here are your fn arguments----->
    companyName->${companyName} maxNumEmployees->${maxNumEmployees}`)
  const companyResults=await db.query(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"
    FROM companies WHERE name ILIKE $1 AND num_employees <= $2 `, [`%${companyName}%`,maxNumEmployees])
    if (companyResults.rows.length===0){
      throw new NotFoundError(`No company found with arguments -----> companyName->${companyName}
        maxNumEmployees->${maxNumEmployees}`)
        }
        return companyResults.rows
}

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    let companyPromise=db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
       FROM companies
       WHERE handle = $1`,
    [handle]);

    // two options to handle jobs. Can make a 2nd query as we did below OR could write a JOIN Query.

    let jobPromise=db.query( `SELECT id, title, salary, equity, company_handle AS "companyHandle"
      FROM jobs WHERE company_handle= $1`,[handle])
    
    // make both requests in parallel could also use Promise.all() method here, but wtih only two promises this works just fine. If we needed more Promise.All would make more sense
    const companyRes = await companyPromise
    const jobRes=await jobPromise

    const company = companyRes.rows[0];
    if (!company) throw new NotFoundError(`No company: ${handle}`);
    // integrate the results of job query into to company object we will be returning to the user by mapping jobs results onto a new property
    company.jobs=jobRes.rows

   

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
