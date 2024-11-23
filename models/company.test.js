"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll,);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** create */

describe("create", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    description: "New Description",
    numEmployees: 1,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.create(newCompany);
    expect(company).toEqual(newCompany);

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'new'`);
    expect(result.rows).toEqual([
      {
        handle: "new",
        name: "New",
        description: "New Description",
        num_employees: 1,
        logo_url: "http://new.img",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Company.create(newCompany);
      await Company.create(newCompany);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let companies = await Company.findAll();
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
    ]);
  });
});

/************************************** filterCompanybyName */
describe("filterCompanybyName", function(){
  test("works: filters by name only", async function(){
    let companies=await Company.filterCompanybyName("C3")
    expect(companies).toEqual([{
      handle: "c3",
      name: "C3",
      description: "Desc3",
      numEmployees: 3,
      logoUrl: "http://c3.img"
    }
    ])
  })

  test("not found if no such company filterCompanybyName()", async function(){
    try{
    let companies=await Company.filterCompanybyName("nope");
     console.log("here is companies.length ---->", companies.length);
     console.log("here is companies ---->", companies);
    //  console.log("before fail")
    //  fail();
    //  console.log("after fail we shouldnt reach this line")
      expect(companies.length).toBe(0);
    }
    catch(err){
      console.log("here is the error in filterCompanybyName ----->",err)
      console.log(" is the instance error in filterCompanybyName belongs to a notFoundError? ----->",err instanceof NotFoundError )
      expect(err instanceof NotFoundError).toBeTruthy();
    }
    
  })
})


/************************************** filterCompanybyMinEmp */
describe("filterCompanybyMinEmp", function(){
  test("works: filters companies by filtering out companies below a minimum amt of employees", async function(){
    let companies=await Company.filterCompanybyMinEmp(2);
    console.log("here is companies filterCompanybyMinEmp()---->", companies)
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
      handle: "c3",
      name: "C3",
      description: "Desc3",
      numEmployees: 3,
      logoUrl: "http://c3.img"
    }
    ])
  })
  test("not found if no such result for filterCompanybyMinEmp()", async function(){
    try{
      let companies=await Company.filterCompanybyMinEmp(4);
      console.log("here is companies filterCompanybyMinEmp() Not Found---->", companies)
      console.log("here is companies.length ---->", companies.length);
      expect(companies.length).toBe(0)
    }
    catch(err){
      console.log("here is the error in filterCompanybyMinEmp ----->",err)
      console.log(" is the instance error in filterCompanybyMinEmp belongs to a notFoundError? ----->",err instanceof NotFoundError )
      expect(err instanceof NotFoundError).toBeTruthy();

    }
  })
})


/************************************** filterCompanybyMaxEmp */
describe("filterCompanybyMaxEmp", function(){
  test("works: filters companies by filtering out companies above a max amt of employees", async function(){
    let companies=await Company.filterCompanybyMaxEmp(2);
    console.log("here is companies filterCompanybyMaxEmp()---->", companies)
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      }
    ])
  })
  test("not found if no such result for filterCompanybyManEmp()", async function(){
    try{
      let companies=await Company.filterCompanybyMaxEmp(0);
      console.log("here is companies filterCompanybyMaxEmp() Not Found---->", companies)
      console.log("here is companies.length ---->", companies.length);
      expect(companies.length).toBe(0)
    }
    catch(err){
      console.log("here is the error in filterCompanybyMaxEmp ----->",err)
      console.log(" is the instance error in filterCompanybyMaxEmp belongs to a notFoundError? ----->",err instanceof NotFoundError )
      expect(err instanceof NotFoundError).toBeTruthy();

    }
  })
})
/************************************** filterCompanybyNameMaxMin */
describe("filterCompanybyNameMaxMin", function(){
  test("works: filters companies by filtering out companies within a range of employees and by name", async function(){
    let companies=await Company.filterCompanybyNameMaxMin("c2", 2,3)
    console.log("here is companies filterCompanybyNameMaxMin()---->", companies)
    expect(companies).toEqual([ 
      {
      handle: "c2",
      name: "C2",
      description: "Desc2",
      numEmployees: 2,
      logoUrl: "http://c2.img",
    }
    ])
  })
  test("not found if no results returned", async function(){
    try{
      let companies=await Company.filterCompanybyNameMaxMin("c4", 2, 3)
      console.log("here is companies filterCompanybyNameMaxMin() Not Found---->", companies)
      console.log("here is companies.length ---->", companies.length);
      expect(companies.length).toBe(0)
    }
    catch(err){
      console.log("here is the error in filterCompanybyNameMaxMin Not Found ----->",err)
      console.log(" is the instance error in filterCompanybyNameMaxMin belongs to a notFoundError? ----->",err instanceof NotFoundError )
      expect(err instanceof NotFoundError).toBeTruthy();
    }
    
  })
  test("bad request if min employee number is greater than max employee number", async function() {
    try{
      let companies=await Company.filterCompanybyNameMaxMin("c1",2,1)
      console.log("here is companies filterCompanybyNameMaxMin() bad request ---->", companies);
    }
    catch(err){
      console.log(" is the instance error in filterCompanybyNameMaxMin bad request belong to a BadRequestError? ----->",err instanceof BadRequestError )
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  })

})
/************************************** filterCompanybyMinMax */

describe("filterCompanybyMinMax", function(){
  test("works: filters companies within a range of min and max employess including the min and max", async function(){
    let companies=await Company.filterCompanybyMinMax(2,3)
    console.log("here is companies filterCompanybyMinMax()---->", companies)
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
      handle: "c3",
      name: "C3",
      description: "Desc3",
      numEmployees: 3,
      logoUrl: "http://c3.img"
    }
    ])
  })
  test("not found if no results returned", async function(){
    try{
    let companies=await Company.filterCompanybyMinMax(4,5)
    console.log("here is companies filterCompanybyMinMax() Not Found---->", companies)
    console.log("here is companies.length ---->", companies.length);
    expect(companies.length).toBe(0)
    }
    catch(err){
      console.log("here is the error in filterCompanybyMinMax() Not Found ----->",err)
      console.log("does the instance error in filterCompanybyMinMax() belong to a notFoundError? ----->",err instanceof NotFoundError )
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })
  test("bad request if min employee number is greater than max employee number", async function() {
    try{
      let companies=await Company.filterCompanybyMinMax(2,1)
      console.log("here is companies filterCompanybyMinMax() bad request ---->", companies);
    }
    catch(err){
      console.log(" is the instance error in filterCompanybyMinMax() bad request belong to a BadRequestError? ----->",err instanceof BadRequestError )
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  })

})
/************************************** filterCompanybyNameMin */
describe("filterCompanybyNameMin", function(){
  test("works: filters companies by name and by a minimum number of employees", async function(){
    let companies=await Company.filterCompanybyNameMin("C3",2)
    console.log("here is companies filterCompanybyNameMin()---->", companies)
    expect(companies).toEqual([
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img"
      }
    ])
  })
  test("not found if no results returned", async function (){
    try{
      let companies=await Company.filterCompanybyNameMin("C3",4)
      console.log("here is companies filterCompanybyNameMin() Not Found---->", companies)
      console.log("here is companies.length ---->", companies.length);
      expect(companies.length).toBe(0)
    }
    catch(err){
      console.log("here is the error in filterCompanybyNameMin() Not Found ----->",err)
      console.log("does the instance error in filterCompanybyNameMin() belong to a notFoundError? ----->",err instanceof NotFoundError )
      expect(err instanceof NotFoundError).toBeTruthy();

    }
  })
})

/************************************** filterCompanybyNameMax */
describe("filterCompanybyNameMax", function(){
  test("works: filters companies by name and by a maximum number of employees", async function(){
    let companies=await Company.filterCompanybyNameMax("C2",2)
    console.log("here is companies filterCompanybyNameMax()---->", companies)
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      }
    ])
  })
  test("not found if no results returned", async function (){
    try{
      let companies=await Company.filterCompanybyNameMax("C3",2)
      console.log("here is companies filterCompanybyNameMax() Not Found---->", companies)
      console.log("here is companies.length ---->", companies.length);
      expect(companies.length).toBe(0)
    }
    catch(err){
      console.log("here is the error in filterCompanybyNameMax() Not Found ----->",err)
      console.log("does the instance error in filterCompanybyNameMax() belong to a notFoundError? ----->",err instanceof NotFoundError)
      expect(err instanceof NotFoundError).toBeTruthy();

    }
  })
})


/************************************** get */

describe("get", function () {
  test("works", async function () {
    let company = await Company.get("c1");
    expect(company).toEqual({
      handle: "c1",
      name: "C1",
      description: "Desc1",
      numEmployees: 1,
      logoUrl: "http://c1.img",
      jobs:[
        {
          id:1,
          title:"testjob1",
          salary:10000,
          equity:"0",
          companyHandle:"c1"
        }

      ]
    });
  });

  test("not found if no such company", async function () {
    try {
      await Company.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    name: "New",
    description: "New Description",
    numEmployees: 10,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.update("c1", updateData);
    expect(company).toEqual({
      handle: "c1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Company.update("c1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Company.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Company.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Company.remove("c1");
    const res = await db.query(
        "SELECT handle FROM companies WHERE handle='c1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Company.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** coerceQueryStringToInt unittest */
describe("coerceQueryStringToInt", function(){
  test("works: converts a string of a number to a true integer within a query string data object", function(){
   const conversion= Company.coerceQueryStringToInt({minEmployees:"1", maxEmployees:"3"})
   expect(conversion).toEqual({minEmployees:1, maxEmployees:3})
  })
  test("unchanged object if the keys of minEmployees and maxEmployees are not present but the key of name is", function(){
    const conversion=Company.coerceQueryStringToInt({name:"dow chemical"})
    expect(conversion).toEqual({name:"dow chemical"})
  })
})


/************************************** determineCompanyQuery tests for correct fn calls and logic per what filter to! */
// does not test db actions/data return here! See next describe for that.

describe("determineCompanyQuery", function () {
  beforeAll(() => {
    // Setting up the necessary mocks only for this describe block
    jest.spyOn(Company, 'filterCompanybyNameMaxMin').mockImplementation(() => [{ name: 'MockCompany' }]);
    jest.spyOn(Company, 'filterCompanybyMinMax').mockImplementation(() => [{ name: 'MockCompany' }]);
    jest.spyOn(Company, 'filterCompanybyNameMin').mockImplementation(() => [{ name: 'MockCompany' }]);
    jest.spyOn(Company, 'filterCompanybyNameMax').mockImplementation(() => [{ name: 'MockCompany' }]);
    jest.spyOn(Company, 'filterCompanybyName').mockImplementation(() => [{ name: 'MockCompany' }]);
    jest.spyOn(Company, 'filterCompanybyMinEmp').mockImplementation(() => [{ name: 'MockCompany' }]);
    jest.spyOn(Company, 'filterCompanybyMaxEmp').mockImplementation(() => [{ name: 'MockCompany' }]);
  });

  afterAll(() => {
    // Clearing the mocks after all the tests in this block
    jest.restoreAllMocks();
  });

  test("works/chooses correct filter with all three parameters", async function () {
    const results = await Company.determineCompanyQuery({
      name: 'MockCompany',
      minEmployees: 10,
      maxEmployees: 100
    });
    expect(Company.filterCompanybyNameMaxMin).toHaveBeenCalled()
    expect(Company.filterCompanybyNameMaxMin).toHaveBeenCalledWith('MockCompany', 10, 100);
    expect(results).toEqual([{ name: 'MockCompany' }]);
  });
  test("works/chooses correct filter with 2 params min and max employees", async function (){
    const results=await Company.determineCompanyQuery({
      minEmployees: 10,
      maxEmployees: 100
    });
    expect(Company.filterCompanybyMinMax).toHaveBeenCalled()
    expect(Company.filterCompanybyMinMax).toHaveBeenCalledWith(10,100);
    expect(results).toEqual([{ name: 'MockCompany' }]);
  })

  test("works/chooses correct filter with 2 params name and min employees", async function (){
    const results=await Company.determineCompanyQuery({
      name: 'MockCompany',
      minEmployees: 10,
    });
    expect(Company.filterCompanybyNameMin).toHaveBeenCalled()
    expect(Company.filterCompanybyNameMin).toHaveBeenCalledWith('MockCompany', 10);
    expect(results).toEqual([{ name: 'MockCompany' }]);
  })

  test("works/chooses correct filter with 2 params name and max employees", async function (){
    const results=await Company.determineCompanyQuery({
      name: 'MockCompany',
      maxEmployees: 100
    });
    expect(Company.filterCompanybyNameMax).toHaveBeenCalled()
    expect(Company.filterCompanybyNameMax).toHaveBeenCalledWith('MockCompany',100);
    expect(results).toEqual([{ name: 'MockCompany' }]);
  })

  test("works/chooses correct filter with 1 param name", async function(){
    const results=await Company.determineCompanyQuery({
       name: 'MockCompany'
    })
    expect(Company.filterCompanybyName).toHaveBeenCalled()
    expect(Company.filterCompanybyName).toHaveBeenCalledWith('MockCompany')
    expect(results).toEqual([{ name: 'MockCompany' }]);
  })

  test("works/chooses correct filter with 1 param minEmployees", async function(){
    const results=await Company.determineCompanyQuery({
      minEmployees: 10,
    })
    expect(Company.filterCompanybyMinEmp).toHaveBeenCalled()
    expect(Company.filterCompanybyMinEmp).toHaveBeenCalledWith(10)
    expect(results).toEqual([{ name: 'MockCompany' }]);
  })

  test("works/chooses correct filter with 1 param maxEmployees", async function(){
    const results=await Company.determineCompanyQuery({
      maxEmployees: 100
    })
    expect(Company.filterCompanybyMaxEmp).toHaveBeenCalled()
    expect(Company.filterCompanybyMaxEmp).toHaveBeenCalledWith(100)
    expect(results).toEqual([{ name: 'MockCompany' }]);
  })
});

//************************************** determineCompanyQuery tests for correct data returned from DB */

describe("determineCompanyQuery", function(){
  test("works/returns correct db data with all 3 params", async function(){
    let companies=await Company.determineCompanyQuery({
      name:"C",
      minEmployees:2,
      maxEmployees:3
    })
    console.log("INSIDE TEST works/returns correct db data with all 3 params!!!!!!!!!--------->", companies)
    console.log("This is companies in TEST: works/returns correct db data with all 3 params--------->", companies)
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
      handle: "c3",
      name: "C3",
      description: "Desc3",
      numEmployees: 3,
      logoUrl: "http://c3.img"
    }
    ])
  })
  test("not found if no companies fit all 3 params", async function(){
    try{
      let companies=await Company.determineCompanyQuery({
        name:"nope",
        minEmployees:2,
        maxEmployees:3
      })
      console.log("here is companies in determineCompanyQuery() 3 params Not Found---->", companies)
      console.log("here is companies.length ---->", companies.length);
      expect(companies.length).toBe(0)
    }
    catch(err){
      console.log("here is the error in determineCompanyQuery() 3 params Not Found ----->",err)
      console.log("does the instance error in determineCompanyQuery() 3 params Not Found belong to a notFoundError? ----->",err instanceof NotFoundError )
      expect(err instanceof NotFoundError).toBeTruthy();
    }

    
  })
  test("works/returns correct db data with 2 params min and max employees", async function(){
    let companies=await Company.determineCompanyQuery({
        minEmployees:2,
        maxEmployees:2
    })
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      }
    ])
  })
  test("not found if no companies returned with 2 params min and max employees", async function (){
    try{
      let companies=await Company.determineCompanyQuery({
        minEmployees:7,
        maxEmployees:8
      })
      console.log("here is companies in determineCompanyQuery() 2 params min and max employees Not Found---->", companies)
      console.log("here is companies.length ---->", companies.length);
      expect(companies.length).toBe(0)
    }
    catch(err){
      console.log("here is the error in determineCompanyQuery()  2 params min and max employees Not Found ----->",err)
      console.log("does the instance error in determineCompanyQuery() 3  2 params min and max employees Not Found belong to a notFoundError? ----->",err instanceof NotFoundError )
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })
  test("bad request if min employee number is greater than max employee number with 2 params min and maxEmployees", async function(){
    try{
      let companies=await Company.determineCompanyQuery({
        minEmployees:2,
        maxEmployees:1
      })
      console.log("here is companies determineCompanyQuery() 2 params min and max employees, bad request  ---->", companies);
    }
    catch(err){
      console.log(" is the instance error in filterCompanybyMinMax() bad request belong to a BadRequestError? ----->",err instanceof BadRequestError )
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  })
  test("works/returns correct db data with 2 params name and minEmployees", async function(){
    let companies=await Company.determineCompanyQuery({
      name:"c",
      minEmployees:2
    })
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
      handle: "c3",
      name: "C3",
      description: "Desc3",
      numEmployees: 3,
      logoUrl: "http://c3.img"
    }
    ])
  })
  test("not found if no companies returned with 2 params name and min employeees", async function (){
    try{
      let companies=await Company.determineCompanyQuery({
        name:"nope",
        minEmployees:1
      })
      console.log("here is companies in determineCompanyQuery() 2 params name and min employeees, Not Found---->", companies)
      console.log("here is companies.length ---->", companies.length);
      expect(companies.length).toBe(0)
    }
    catch(err){
      console.log("here is the error in determineCompanyQuery()   2 params name and min employeees, Not Found ----->",err)
      console.log("does the instance error in determineCompanyQuery() 2 params name and min employeees, Not Found belong to a notFoundError? ----->",err instanceof NotFoundError )
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })
  test("works/returns correct db data with 2 parans name and maxEmployees", async function(){
    let companies=await Company.determineCompanyQuery({
      name:"c",
      maxEmployees:1
    })
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      }
    ])
  })
  test("not found if no companies returned with 2 params name and max employeees", async function(){
    try{
      let companies=await Company.determineCompanyQuery({
        name:"nope",
        maxEmployees:1
      })
      console.log("here is companies in determineCompanyQuery() 2 params name and max employeees, Not Found---->", companies)
      console.log("here is companies.length ---->", companies.length);
      expect(companies.length).toBe(0)
    }
   catch(err){
    console.log("here is the error in determineCompanyQuery()   2 params name and max employeees, Not Found ----->",err)
    console.log("does the instance error in determineCompanyQuery() 2 params name and max employeees, Not Found belong to a notFoundError? ----->",err instanceof NotFoundError )
    expect(err instanceof NotFoundError).toBeTruthy();
   }
  })
  test("works/returns correct db data with 1 param name", async function(){
    let companies=await Company.determineCompanyQuery({
      name:"c"
    })
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img"
      }
    ])
  })
  test("not found if no companies returned with 1 param name", async function(){
    try{
      let companies=await Company.determineCompanyQuery({
        name:"nope"
      })
      console.log("here is companies in determineCompanyQuery() 1 param name, Not Found---->", companies)
      console.log("here is companies.length ---->", companies.length);
      expect(companies.length).toBe(0)
    }
    catch(err){
      console.log("here is the error in determineCompanyQuery()   1 param name, Not Found ----->",err)
      console.log("does the instance error in determineCompanyQuery() 1 param name, Not Found belong to a notFoundError? ----->",err instanceof NotFoundError )
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })
  test("works/returns correct db data with 1 param minEmployees", async function(){
    let companies=await Company.determineCompanyQuery({
      minEmployees:1
    })
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img"
      }
    ])
  })
  test("Not found if no companies returned with 1 param minEmployees", async function(){
    try{
      let companies=await Company.determineCompanyQuery({
        minEmployees:10
      })
      console.log("here is companies in determineCompanyQuery() 1 param minEmployees, Not Found---->", companies)
        console.log("here is companies.length ---->", companies.length);
        expect(companies.length).toBe(0)
    }
    catch(err){
      console.log("here is the error in determineCompanyQuery()   1 param minEmployees, Not Found ----->",err)
      console.log("does the instance error in determineCompanyQuery() 1 param minEmployees, Not Found belong to a notFoundError? ----->",err instanceof NotFoundError )
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })
  test("works/returns correct db data with 1 param maxEmployees", async function(){
    let companies=await Company.determineCompanyQuery({
      maxEmployees:1
    })
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      }
    ])
  })
  test("Not found if no companies returned with 1 param maxEmployees", async function(){
    try{
      let companies=await Company.determineCompanyQuery({
        maxEmployees:0
      })
      console.log("here is companies in determineCompanyQuery() 1 param maxEmployees, Not Found---->", companies)
      console.log("here is companies.length ---->", companies.length);
      expect(companies.length).toBe(0)
    }
    catch(err){
      console.log("here is the error in determineCompanyQuery()   1 param maxEmployees, Not Found ----->",err)
      console.log("does the instance error in determineCompanyQuery() 1 param maxEmployees , Not Found belong to a notFoundError? ----->",err instanceof NotFoundError )
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })
})

describe("buildDyanmicFilterQuery", function (){
  test("works: filters companies using all 3 parameters (name, minEmployees, maxEmployees) given by user as non-default values", async function(){
    let companies=await Company.buildDyanmicFilterQuery({name:"c", minEmployees:2, maxEmployees:3})
    console.log("inside company model's buildDynamicQuery() TEST", "here is companies---->", companies)
    expect(companies).toEqual([
      {
      handle: "c2",
      name: "C2",
      description: "Desc2",
      numEmployees: 2,
      logoUrl: "http://c2.img",
    },
    {
    handle: "c3",
    name: "C3",
    description: "Desc3",
    numEmployees: 3,
    logoUrl: "http://c3.img"
  }
    ])

  })
  test("works: filters companies using no parameters and or using DEFAULTS", async function(){
    let companies=await Company.buildDyanmicFilterQuery()
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img"
      }
    ])
  })
  test("works: filters companies using 2 parameters name and minEmployees with default maxEmployees", async function(){
    let companies=await Company.buildDyanmicFilterQuery({name:"c", minEmployees:3})
    expect(companies).toEqual([
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img"
      }
    ])
  })
  test("works: filters companies using 2 parameters name and maxEmployees with default minEmployees", async function(){
    let companies=await Company.buildDyanmicFilterQuery({name:"c", maxEmployees:1})
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img"
      }
    ])
  })
  test("works: filters companies using 2 parameters min and maxEmployees with default companyName", async function(){
    let companies=await Company.buildDyanmicFilterQuery({ minEmployees:2, maxEmployees:2})
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      }
    ])
  })
  test("works:filters companies using a single parameter companyName", async function(){
    let companies=await Company.buildDyanmicFilterQuery({name:"c"})
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img"
      }
    ])
  })
  test("works:filters companies using a single paramter minNumEmployees", async function(){
    let companies=await Company.buildDyanmicFilterQuery({minEmployees:3})
      expect(companies).toEqual([
        {
          handle: "c3",
          name: "C3",
          description: "Desc3",
          numEmployees: 3,
          logoUrl: "http://c3.img"
        }
      ])
  })
  test("works:filters companies using a single paramter maxNumEmployees", async function(){
    let companies=await Company.buildDyanmicFilterQuery({maxEmployees:1})
      expect(companies).toEqual([
        {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img"
        }
      ])
  })
  test("Not found if no companies returned", async function(){
    try{
      let companies=await Company.buildDyanmicFilterQuery({
        minEmployees:10
      })
      console.log("here is companies in buildDyanmicFilterQuery(), Not Found---->", companies)
      console.log("here is companies.length ---->", companies.length);
      expect(companies.length).toBe(0)
    }
    catch(err){
      console.log("here is the error in buildDyanmicFilterQuery(), Not Found ----->",err)
      console.log("does the instance error in buildDyanmicFilterQuery(), Not Found belong to a notFoundError? ----->",err instanceof NotFoundError )
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })
})



describe("filterCompanybyNameMaxMin", function(){
  test("works: filters companies by filtering out companies within a range of employees and by name", async function(){
    let companies=await Company.filterCompanybyNameMaxMin("c2", 2,3)
    console.log("here is companies filterCompanybyNameMaxMin()---->", companies)
    expect(companies).toEqual([ 
      {
      handle: "c2",
      name: "C2",
      description: "Desc2",
      numEmployees: 2,
      logoUrl: "http://c2.img",
    }
    ])
  })
  test("not found if no results returned", async function(){
    try{
      let companies=await Company.filterCompanybyNameMaxMin("c4", 2, 3)
      console.log("here is companies filterCompanybyNameMaxMin() Not Found---->", companies)
      console.log("here is companies.length ---->", companies.length);
      expect(companies.length).toBe(0)
    }
    catch(err){
      console.log("here is the error in filterCompanybyNameMaxMin Not Found ----->",err)
      console.log(" is the instance error in filterCompanybyNameMaxMin belongs to a notFoundError? ----->",err instanceof NotFoundError )
      expect(err instanceof NotFoundError).toBeTruthy();
    }
    
  })
  test("bad request if min employee number is greater than max employee number", async function() {
    try{
      let companies=await Company.filterCompanybyNameMaxMin("c1",2,1)
      console.log("here is companies filterCompanybyNameMaxMin() bad request ---->", companies);
    }
    catch(err){
      console.log(" is the instance error in filterCompanybyNameMaxMin bad request belong to a BadRequestError? ----->",err instanceof BadRequestError )
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  })

})