"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
  } = require("./_testCommon");
const Job = require("./jobs");
const { NotFoundError } = require("../expressError");
const { buildDyanmicFilterQuery } = require("./company");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("findAll", function(){
    test("works: no filter", async function(){
        let jobs=await Job.findAll();
        expect(jobs).toEqual([
            {
                id:1,
                title:"testjob1",
                salary:10000,
                equity:"0",
                companyHandle:"c1"
                
            },
            {
                id:2,
                title:"testjob2",
                salary:20000,
                equity:"0.02",
                companyHandle:"c2"
                
            },
            {
                id:3,
                title:"testjob3",
                salary:30000,
                equity:"0.03",
                companyHandle:"c3"
                
            }
        ])
    })
})

/************************************** getByTitle */
describe("getByTitle", function(){
    test("works", async function(){
        let jobs=await Job.getByTitle("testjob1");
        expect(jobs).toEqual([
            {
                id:1,
                title:"testjob1",
                salary:10000,
                equity:"0",
                companyHandle:"c1"
                
            }  
        ])
    })

    test("not found if no such job(s)", async function (){
        try{
            let jobs=await Job.getByTitle("badtitle");
            expect(jobs.length).toBe(0)
        }
        catch(err){
            expect(err instanceof NotFoundError).toBeTruthy()
        }
    })

})

/************************************** getById */
describe ("getById", function(){
    test("works", async function(){
        let job=await Job.getById(1);
        expect(job).toEqual(
            {
                id:1,
                title:"testjob1",
                salary:10000,
                equity:"0",
                companyHandle:"c1"
                
            }  
        )
    })

    test("not found if no such job", async function(){
        try{
           let job=await Job.getById(7);
            expect(job.length).toBe(0)
        }
        catch(err){
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
})

/************************************** create */
describe("create", function(){
    const newJob={
        title:"testjob4",
        salary:40000,
        equity:0.04,
        companyHandle:"c3"
        };
    test("works, creates new job + job can be found in the DB successfully", async function(){
        //we wrote the returning clause to include id so this will likely be wrong
        let job=await Job.create(newJob);
        // the variable job is not equivalent to newJob in this case because we designed the returning clause to return the id!
        // also of note, equity as type NUMERIC will be returned expectedly as a string!!! Maintains the precision of the number
        expect(job).toEqual({
            id:4,
            title:"testjob4",
            salary:40000,
            equity:"0.04",
            companyHandle:"c3"
        });
        //verify the job was inserted into the db 
        const result= await db.query(`
            SELECT id, title, salary, equity, company_handle
            FROM jobs WHERE id=4`)
        expect(result.rows[0]).toEqual(
            {
                id:4,
                title:"testjob4",
                salary:40000,
                equity:"0.04",
                company_handle:"c3"
            }
        )
    })

/************************************** remove */
describe("remove", function(){
    test("works + job is removed from DB successfully", async function(){
        await Job.remove(1)
        const result=await db.query("SELECT id, title FROM jobs WHERE id=1");
        expect(result.rows.length).toBe(0)
    })

    test("not found if no such job with given id", async function(){
        try{
            // there is only ids in a range from 1-3 from our test db. 37 shouldn't be there!
            await Job.remove(37)
        }
        catch(err){
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update*/
describe("update", function (){
    const updateData={title:"editedjob1", salary:0}
    test("works updates a job", async function(){
        let job =await Job.update(1,updateData)
        expect(job).toEqual({
            id:1,
            title:"editedjob1",
            salary:0,
            equity:"0",
            companyHandle:"c1"
        })
    })
    test("verify edit is in the db", async function(){
        await Job.update(1,updateData)
        let job=await Job.getById(1)
        expect(job).toEqual({
            id:1,
            title:"editedjob1",
            salary:0,
            equity:"0",
            companyHandle:"c1"
        })
    })
    test("not found if no such job", async function(){
        try{
            let job=await Job.update(7,updateData);
            // this line below doesn't run if error is triggered, err is just passed to catch
            // expect(job.length).toBe(0);
            }
        catch(err){
                expect(err instanceof NotFoundError).toBeTruthy();
            }
        })
    })
   
})
/************************************** coerceQueryStrings*/
describe("coerceQueryStrings", function(){
    test("works: converts minSalary and hasEquity with all 3 fields", function(){
        const conversion=Job.coerceQueryStrings({title:"jobtitle1",minSalary:"100", hasEquity:"true"})
        expect(conversion).toEqual({title:"jobtitle1",minSalary:100, hasEquity:true})
    })
    test("works:unchanged if neither minSalary or hasEquity properties present", function(){
        const conversion=Job.coerceQueryStrings({title:"jobtitle1"})
        expect(conversion).toEqual({title:"jobtitle1"})
    })
    test("works single property minSalary", function(){
        const conversion=Job.coerceQueryStrings({minSalary:"100"})
        expect(conversion).toEqual({minSalary:100})
    })
    test("works single property hasEquity", function(){
        const conversion=Job.coerceQueryStrings({hasEquity:"false"})
        expect(conversion).toEqual({hasEquity:false})
    })
    test("works converts both fields hasEquity + minSalary", function(){
        const conversion=Job.coerceQueryStrings({minSalary:"100",hasEquity:"false"})
        expect(conversion).toEqual({minSalary:100, hasEquity:false})
    })
    test("works if non numeric string for hasEquity", function(){
        const conversion=Job.coerceQueryStrings({title:"jobtitle1",hasEquity:"teststring"})
        expect(conversion).toEqual({title:"jobtitle1", hasEquity:false})
    })

})

/************************************** buildDynamicFilterQueryJobs*/

describe("buildDynamicFilterQueryJobs", function(){
    test("works no filter passed in, fetches all jobs", async function(){
        const jobs=await Job.buildDynamicFilterQueryJobs()
        expect(jobs).toEqual([
            {
                id:1,
                title:"testjob1",
                salary:10000,
                equity:"0",
                companyHandle:"c1"
                
            },
            {
                id:2,
                title:"testjob2",
                salary:20000,
                equity:"0.02",
                companyHandle:"c2"
                
            },
            {
                id:3,
                title:"testjob3",
                salary:30000,
                equity:"0.03",
                companyHandle:"c3"
                
            }
        ])
    })
    test("works empty query passed in, fetches all jobs", async function(){
        const jobs=await Job.buildDynamicFilterQueryJobs({})
        expect(jobs).toEqual([
            {
                id:1,
                title:"testjob1",
                salary:10000,
                equity:"0",
                companyHandle:"c1"
                
            },
            {
                id:2,
                title:"testjob2",
                salary:20000,
                equity:"0.02",
                companyHandle:"c2"
                
            },
            {
                id:3,
                title:"testjob3",
                salary:30000,
                equity:"0.03",
                companyHandle:"c3"
                
            }
        ])
    })
    test("works 3 all filters present", async function(){
        const jobs=await Job.buildDynamicFilterQueryJobs({title:"testjob3", minSalary:10000, hasEquity:true})
        expect(jobs).toEqual([{
            id:3,
                title:"testjob3",
                salary:30000,
                equity:"0.03",
                companyHandle:"c3"
            }])
    })
    test("works 2 filters present", async function(){
        const jobs=await Job.buildDynamicFilterQueryJobs({minSalary:10000, hasEquity:true})
        expect(jobs).toEqual([
            {
                id:2,
                title:"testjob2",
                salary:20000,
                equity:"0.02",
                companyHandle:"c2"
                
            },
            {
                id:3,
                title:"testjob3",
                salary:30000,
                equity:"0.03",
                companyHandle:"c3"
                
            }
        ])
    })
    test("works 1 filter present hasEquity also tests false for this property", async function(){
        const jobs=await Job.buildDynamicFilterQueryJobs({hasEquity:false})
        expect(jobs).toEqual([
            {
                id:1,
                title:"testjob1",
                salary:10000,
                equity:"0",
                companyHandle:"c1"
                
            },
            {
                id:2,
                title:"testjob2",
                salary:20000,
                equity:"0.02",
                companyHandle:"c2"
                
            },
            {
                id:3,
                title:"testjob3",
                salary:30000,
                equity:"0.03",
                companyHandle:"c3"
                
            }
        ])
    })
    test("not found error if no jobs!", async function(){
        try{
            const jobs=await Job.buildDynamicFilterQueryJobs()
        }
        catch(err){
            expect(err instanceof NotFoundError).toBeTruthy
        }
        
    })
})