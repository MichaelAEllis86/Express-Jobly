"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  // the u4 token has admin privileges
  u4Token
} = require("./_testCommon");
const { post } = require("./users");
const { BadRequestError } = require("../expressError");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** GET /jobs */

describe("GET /jobs", function(){
    test("works/ok for anon users, no filters used", async function (){
        const resp=await request(app).get("/jobs");
        expect (resp.body).toEqual({
            jobs:[
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
            ]
        })
    })
    test("fails: test next() handler", async function(){
    // as with GET /companies there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp=await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
    })
    /************************************** GET /jobs Filtering tests */
    test("works 4 anon with all 3 filters present", async function(){
        const resp=await request(app)
        .get("/jobs?title=testjob&minSalary=20000&hasEquity=true")
        expect(resp.body).toEqual({
            jobs:[
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
            ]
        })
    })
    test("works 4 anon with 2 filters present", async function(){
        const resp=await request(app)
        .get("/jobs?minSalary=30000&hasEquity=true")
        expect(resp.body).toEqual({
            jobs:[
                {
                    id:3,
                    title:"testjob3",
                    salary:30000,
                    equity:"0.03",
                    companyHandle:"c3"
                }
            ]
        })
    })
    test("works 4 anon 1 filter present", async function(){
        const resp=await request(app)
        .get("/jobs?&hasEquity=true")
        expect(resp.body).toEqual({
            jobs:[
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
            ]
        })
    })
    test("not found if no results can be found with given filters", async function(){
        const resp=await request(app)
        .get("/jobs?&minSalary=500000")
        expect(resp.body).toEqual({"error": {"message": "No jobs found!", "status": 404}})
        expect(resp.statusCode).toEqual(404)
    })
    test("bad request if filter is passed with unallowed query property (id in this example)", async function(){
     //this would be any property not named title, minSalary, hasEquity
    const resp=await request(app)
    .get("/jobs?minSalary=10000&id=1")
    expect(resp.statusCode).toEqual(400)})
})


/************************************** POST /jobs */
describe("POST /jobs",function(){
    const newJob={
        title:"newJobTitle",
        name:"newJobName",
        salary:100000,
        equity:0,
        companyHandle:"c1"

    }
    test("works for admin users", async function(){
    const resp=await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization",`Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
        job:{
            id:4,
            title:"newJobTitle",
            salary:100000,
            equity:"0",
            companyHandle:"c1"
        }

    })
    const check4NewJob=await request(app)
        .get("/jobs/4")
        expect(check4NewJob.body).toEqual({
            job: {
                 id:4,
                 title:"newJobTitle",
                 salary:100000,
                 equity:"0",
                 companyHandle:"c1"
             }
     
         })
    })
    test("forbidden for non admin users", async function(){
        const resp=await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization",`Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(403);
        expect(resp.body).toEqual({error:{
            message: "Forbidden Requires Admin! Bad Request",
            status:403    
        }})
    })
    test("bad request with missing data", async function(){
        const resp=await request(app)
            .post("/jobs")
            .send({
                title:"newJobTitle",
                salary:100000
            })
            .set("authorization",`Bearer ${u4Token}`);
        expect(resp.statusCode).toEqual(400)
    })

    test("bad request with invalid data", async function(){
        const resp=await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                salary:"not a salary"
            })
            .set("authorization", `Bearer ${u4Token}`);
        expect(resp.statusCode).toEqual(400);
    })
})

/************************************** GET /jobs/":id" */
describe("GET /jobs/:id", function(){
    test("works for anon", async function(){
        const resp=await request(app).get(`/jobs/1`)
        expect(resp.body).toEqual({
           job: {
                id:1,
                title:"testjob1",
                salary:10000,
                equity:"0",
                companyHandle:"c1"
            }
    
        })
    })
    test("not found for no such job", async function(){
        const resp=await request(app).get(`/jobs/370`);
        expect (resp.statusCode).toEqual(404);
    })
})

/************************************** GET /jobs/title/":title" */

describe("GET /jobs/title/:title", function(){
    test("works for anon", async function(){
        const resp=await request(app).get(`/jobs/title/testjob2`)
        expect(resp.body).toEqual({jobs:[
           {
                id:2,
                title:"testjob2",
                salary:20000,
                equity:"0.02",
                companyHandle:"c2"
            }
    
    ]})
    })
    test("not found for no such job", async function(){
        const resp=await request(app).get(`/jobs/title/nope`);
        expect (resp.statusCode).toEqual(404);
    })
})

/************************************** DELETE /jobs/:id */
describe("DELETE /jobs/:id", function(){
    test("works for admin user", async function(){
        const resp=await request(app)
            .delete(`/jobs/3`)
            .set("authorization",`Bearer ${u4Token}`);
            expect(resp.body).toEqual({deleted:{
                id:3,
                title:"testjob3"
            }})
        })

    test("forbidden for non admin", async function (){
        const resp=await request(app)
            .delete(`/jobs/2`)
            .set("authorization",`Bearer ${u1Token}`)
        expect(resp.statusCode).toEqual(403);
        expect(resp.body).toEqual({error:{
            message: "Forbidden Requires Admin! Bad Request",
            status:403
    }})
    })

    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/companies/c1`);
        expect(resp.statusCode).toEqual(401);
      });
    
    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/companies/nope`)
            .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });
})

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id",function(){
    test("works for admin user updates 1 field", async function(){
        const resp=await request(app)
            .patch(`/jobs/1`)
            .send({
                title:"updatedjobtitle1"
            })
            .set("authorization", `Bearer ${u4Token}`)
        expect(resp.body).toEqual({
            job:{
                id:1,
                title:"updatedjobtitle1",
                salary:10000,
                equity:"0",
                companyHandle:"c1"
            }
        })
    })
    test("works for admin user updates mutiple fields", async function(){
        const resp=await request(app)
            .patch(`/jobs/1`)
            .send({
                title:"updatedjobtitle1",
                salary:3500,
                equity:0.05
            })
            .set("authorization", `Bearer ${u4Token}`)
        expect(resp.body).toEqual({
            job:{
                id:1,
                title:"updatedjobtitle1",
                salary:3500,
                equity:"0.05",
                companyHandle:"c1"
            }
        })
    })
    test("forbidden for non admins", async function(){
        const resp=await request(app)
            .patch(`/jobs/1`)
            .send({
                title:"updatedjobtitle1"
             })
        .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(403);
        expect(resp.body).toEqual({error:{
            message: "Forbidden Requires Admin! Bad Request",
            status:403
      }})
    })

    test("unauth for anon", async function (){
        const resp=await request(app)
            .patch(`/jobs/1`)
            .send({
                title:"updatedjobtitle1"
            })
        expect(resp.statusCode).toEqual(401);
    })

    test("not found if no such job", async function(){
        const resp=await request(app)
            .patch(`/jobs/8000`)
            .send({
                title:"updatedjobtitle1"
            })
            .set("authorization", `Bearer ${u4Token}`)
        expect(resp.statusCode).toEqual(404)
    })

    test("bad request if invalid field", async function(){
        const resp=await request(app)
        .patch(`/jobs/2`)
        .send({
            id:300,
            title:"updatedjobtitle2"
        })
        .set("authorization", `Bearer ${u4Token}`)
        expect(resp.statusCode).toEqual(400)
    })
    
})
