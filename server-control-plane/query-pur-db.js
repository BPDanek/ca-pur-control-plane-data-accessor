var db_config = require('../secrets');
var pgp = require('pg-promise')(/* options */)
var db = pgp(db_config)

function getPesticideCounts(pesticide_count_promises, counties) {
    // query db using pgPromise for async db access. http://vitaly-t.github.io/pg-promise/Database.html#one
    for (let row_index = 0; row_index < counties.length; row_index++) {

        // build query for route parameters
        const query = `SELECT pesticide_count FROM ca_reduced_udc WHERE county_cd = '${counties[row_index]}';`

        console.log("non-yearly query: ", query)

        // unpack count and push to an array of async requests/Promises
        pesticide_count_promises.push(
            db.oneOrNone(query)
                .then((queryResponse) => {
                    console.log(query, queryResponse.pesticide_count)
                    return queryResponse.pesticide_count })
                .catch(() => {
                    console.log("failure on", query)
                    return 0
                })
        )
    }
}

function getYearlyPesticideCounts(pesticide_count_promises, counties) {
    // query db using pgPromise for async db access. http://vitaly-t.github.io/pg-promise/Database.html#one
    for (let row_index = 0; row_index < counties.length; row_index++) {

        // build query for route parameters
        const query = `SELECT count_2012, count_2013, count_2014, count_2015, count_2016, count_2017, count_2018 FROM ca_yearly_reduced_udc WHERE county_cd = '${counties[row_index]}';`

        console.log("yearly query: ", query)

        // unpack count and push to an array of async requests/Promises
        pesticide_count_promises.push(
            db.oneOrNone(query)
                .then(queryResponse => Object.values(queryResponse))
                .then(queryResult => {
                    console.log(query, queryResult)
                    return queryResult
                })
                .catch(() => {
                    console.log("failure on", query)
                    return 0
                })
        )
    }
}

/*
    returns highest reported pesticide count in table. Since this table only contains a recent, year it is the count of
    the pesticides for the county which has the most pesticides used.
    todo: make this more elegant
    precomputed to save time.
    'SELECT MAX(pesticide_count) FROM ca_reduced_udc;'
 */
function getMaxPesticideCount(pesticide_count_promises) {
    pesticide_count_promises.push(579034)}

/*
    returns highest reported pesticide count in table across all yearly pesticide usage reports (pur)

    todo: make this more elegant
    precomputed to save time
    SELECT MAX(count_2012) FROM ca_yearly_reduced_udc; --> 437571
    SELECT MAX(count_2013) FROM ca_yearly_reduced_udc; --> 491882
    SELECT MAX(count_2014) FROM ca_yearly_reduced_udc; --> 532544
    SELECT MAX(count_2015) FROM ca_yearly_reduced_udc; --> 535728
    SELECT MAX(count_2016) FROM ca_yearly_reduced_udc; --> 573328
    SELECT MAX(count_2017) FROM ca_yearly_reduced_udc; --> 549742
    SELECT MAX(count_2018) FROM ca_yearly_reduced_udc; --> 579034

 */
function getMaxYearlyPesticideCount(pesticide_count_promises) {
    pesticide_count_promises.push(579034)
}

// modify pesticide_count_promises in place
function queryPURTable(pesticide_count_promises, counties, yearly) {

    if (yearly) {
        getYearlyPesticideCounts(pesticide_count_promises, counties)
        getMaxYearlyPesticideCount(pesticide_count_promises)
    } else {
        getPesticideCounts(pesticide_count_promises, counties)
        getMaxPesticideCount(pesticide_count_promises)
    }
}

module.exports = queryPURTable
