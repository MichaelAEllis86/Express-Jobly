const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // console.log("inside sqlForPartialUpdate")
  // console.log("inside sqlForPartialUpdate", "here is the datatoupdate ---->", dataToUpdate)
  // console.log("inside sqlForPartialUpdate","here is the jsToSql---->", jsToSql)
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");
  // console.log("inside sqlForPartialUpdate","this is keys----->", keys)

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
  // console.log("inside sqlForPartialUpdate","this is cols----->", cols)

  const formatted={
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
  // console.log("inside sqlForPartialUpdate","this is formatted----->", formatted)
  return formatted
}

module.exports = { sqlForPartialUpdate };
