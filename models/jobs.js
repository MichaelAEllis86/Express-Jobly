"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {

      /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */
  static async findAll(){
    console.log("inside job model's findAll()")
    const jobsRes=await db.query(
        `SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs`
    )
    console.log("inside job model's findAll()","this is jobsRes.rows----->", jobsRes.rows)
    return jobsRes.rows;

  }

  //test and document

  /** Finds jobs in GET /jobs according to filtering conditions by building a query in stages. 
   * 
   * If no filters given it finds all jobs ordered by id
   *
   * Can filter via queryString using all or any of the following properties title, minSalary, hasEquity
   * 
   * req.query data if filtering present used should be {title, minSalary, hasEquity}
   * any combination or single property will work!
   * 
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async buildDynamicFilterQueryJobs({title=null, minSalary=null, hasEquity=false}={}){
    console.log("inside buildDynamicFilterQueryJobs()");
    console.log("inside job model's buildDynamicFilterQueryJobs()",`here are your fn arguments----->title->${title}  minSalary->${minSalary} hasEquity->${hasEquity}`)

    let baseQuery=`SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE 1=1`

     //track the parameter values for our query Ex $1, $2, $3. Each time we add a param to the query we increment this
    const queryValues=[]

    //track parameter values for each param in our query
    let numParams4Query=0

    //set up job title part of query string
    if(title){
      numParams4Query++
      baseQuery +=` AND title ILIKE $${numParams4Query}`
      queryValues.push(`%${title}%`)
    }

    //minSalary
    if(minSalary){
      numParams4Query++;
      baseQuery +=` AND salary >= $${numParams4Query}`
      queryValues.push(minSalary)
    }

    //hasEquity--->As this value is a boolean to tell us whether or not to add to our query,
    // and not an actual value the user is supplying because the query is a static statment and lacks a param
    //we need not increment numParams4Query or push to queryValues! in fact doing so will cause an error


    if(hasEquity===true){
      baseQuery +=` AND equity > 0`
    }

    // Order results by id
    baseQuery += ` ORDER BY id`;

    console.log("Here is the final query---->", baseQuery);
    console.log("Here is the queryValues array---->", queryValues);
    
    //execute the query
    const jobResults=await db.query(baseQuery,queryValues)
    if (jobResults.rows.length === 0){
      throw new NotFoundError(`No jobs found!`)
    }
    return jobResults.rows

  }

//  could make a choice with this GET function to fetch 1 job!
// we chould pass in a title which is prolly more user friendly! (eg i want info about engineering jobs so i search for title engineer vrs an id fetch...)
// or we could pass in an id and fetch it that way or u could just make both versions and ping them on different routes!

  /** Find a job via title! Expects to find more than one job if there is multiple jobs with same title! Must be exact match to title in the db!.
   *
   * Returns [{ id, title, salary, equity, companyHandle}...]
   * */

  static async getByTitle(title){
    console.log("inside job model's getBytitle()")
    const jobsRes=await db.query(`
        SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE title = $1  `,[title])
    const jobs=jobsRes.rows
    if (jobs.length===0) throw new NotFoundError(`No jobs found with title: ${title}`)
    return jobs;
  }

    /** Find a job via id. Expects to find a single job with a given id! There should never be multiples of the same id in our db!
   * returns the found job
   * Returns { id, title, salary, equity, companyHandle }
   * */

  static async getById(id){
    console.log("inside job model's getById()")
    const jobsRes=await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`,[id])
    const job=jobsRes.rows[0]
    if (!job) throw new NotFoundError (`No job with id: ${id}`)
    return job
  }

   /** Create a new job (from data via req.body), update db, return new job data.
   *
   * data should be {title, salary, equity, companyHandle}
   * 
   * Returns { id, title, salary, equity, companyHandle }
   * */

  static async create({title, salary, equity, companyHandle}){

    // since duplicate jobs(same title, same company) are technically allowed we don't really need this logic so commented out! However, this would work if we wanted to prevent 
    // the posting of two jobs of the same title within the same company/companyHandle 

    // const duplicateCheck=await db.query(`SELECT title, company_handle AS "companyHandle"
    //     FROM jobs WHERE title = $1 and company_handle = $2`, [title,companyHandle])
    
    // if (duplicateCheck.rows[0])
    //     throw new BadRequestError(`Duplicate job: ${title}, at ${companyHandle}`)

    const result=await db.query(`INSERT INTO jobs
    (title, salary, equity, company_handle)
    VALUES($1, $2, $3, $4)
    RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,[title, salary, equity, companyHandle])
    const job=result.rows[0]

    return job

  }

   /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job  not found.
   **/

  static async remove(id){
    const result=await db.query(
        `DELETE from jobs WHERE id = $1 RETURNING id, title `,[id]
    );
    const job=result.rows[0];
    if (!job) throw new NotFoundError(`No job: ${id}`)
    return job
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   * 
   * The DB fields id (a SERIAL value) and company_handle cannot be updated and it doesn't make sense to do so! Altering ids could damage our db per it's schema!
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data){
    const {setCols, values}=sqlForPartialUpdate(data,{
      companyHandle:"company_handle"
    });
    const idVarIdx= "$" + (values.length + 1);

    const querySQL=`UPDATE jobs
                    SET ${setCols}
                    WHERE id = ${idVarIdx}
                    RETURNING id,
                              title,
                              salary,
                              equity,
                              company_handle AS "companyHandle"`
    
    const result=await db.query(querySQL, [...values, id]);
    const job=result.rows[0]

    if (!job) throw new NotFoundError(`No job: ${id}`)
    
    return job

  }

    /** Formats Query strings for GET/jobs filtering ` Needed because query string data is in form of string which is incorrect data type for properties!.
   *
   * Changes minSalary property in req.query aka queryDataObj from string to integer
   *
   * Changes hasEquity property in req.query aka queryDataObj from string to boolean
   * 
   * if properties are absent they are ignored and queryDataObj is returned unaltered
   * 
   * returns a coerced or unchanged queryDataObj see below!
   * 
   * Ex1 all fields 
   * {title:"jobtitle1", minSalary:"100", hasEquity:"false"} => {title:"jobtitle1", minSalary:100, hasEquity:false}
   * 
   * Ex2 no field for minSalary or hasEquity
   * {title:"jobtitle1" => {title:"jobtitle1"}
   * 
   * Ex3 single field change Salary
   * {title:"jobtitle1", minSalary:"100"} => {title:"jobtitle1", minSalary:100}
   * 
   * Ex4 single field change hasEquity
   * {title:"jobtitle1", hasEquity:"true"} => {title:"jobtitle1", hasEquity:true}
   * 
   */

  static coerceQueryStrings(queryDataObj){
    console.log("inside job model's coerceQueryStrings(), this is the queryDataObj BEFORE coercion------>",queryDataObj)
    console.log("inside job model's coerceQueryStrings(), this is the queryDataObj.minSalary type BEFORE coercion------>",typeof(queryDataObj.minSalary))
    console.log("inside job model's coerceQueryStrings(), this is the queryDataObj.hasEquity type BEFORE coercion------>",typeof(queryDataObj.hasEquity))
  
    if(queryDataObj.minSalary){
      queryDataObj.minSalary=parseInt(queryDataObj.minSalary)
    }

    if(queryDataObj.hasEquity){
      const stringValue = queryDataObj.hasEquity;
      const booleanValue = stringValue === "true"; // returns true if string value is "true" otherwise false
      queryDataObj.hasEquity=booleanValue

    }
    console.log("inside job model's coerceQueryStrings(), this is the queryDataObj AFTER coercion------>",queryDataObj)
    console.log("inside job model's coerceQueryStrings(), this is the queryDataObj.minEmployees type AFTER coercion------>",typeof(queryDataObj.minSalary))
    console.log("inside job model's coerceQueryStrings(), this is the queryDataObj.hasEquity type AFTER coercion------>",typeof(queryDataObj.hasEquity))
 
    return queryDataObj

  }


}

module.exports=Job;


