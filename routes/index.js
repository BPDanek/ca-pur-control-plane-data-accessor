var db_config = require('../secrets');
var express = require('express');
var router = express.Router();
var pgp = require('pg-promise')(/* options */)
var db = pgp(db_config)
const cors = require("cors");

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Anto' });
});

/* a sanity check */
router.get('/test', cors(), function(req, res) {
    res.status(200).send("Welcome to ca-pur-control-plane-data-accessor, the middleware + backend for the Anto system.")
})

/*
 * run an sql query (risky, I know, but yolo?)
 */
// router.get('/sql', cors(), function(req, res, next) {
//
//     var sql_string = req.query.sql
//
//     console.log(sql_string)
//
//     db.one(sql_string)
//         .then((data) => { return console.log(data) })
//         .catch(() => { return 0 })
// })

/*
 * format of query is ?counties=["count1_id","count2_id", "count3_id",...] where countyX_id is the id for a CA county
 * responds with ["county1_count", "county2_count", "county3_count", ...] where countyX_count is the number of used pesticides for a county
 */
router.get('/query-pur-db', cors(), function(req, res, next) {

    // part of route
    var counties = req.query.counties

    // in the future do more stringent cleaning & validation
    counties = counties.replace('[', '').replace(']', '').split(',', )
    if (counties.length > 58) {
        console.log("invalid query")
        res.send("Invalid query parameters. ")
        return
    }

    // query db using pgPromise for async db access. http://vitaly-t.github.io/pg-promise/Database.html#one
    var pesticide_count_promises = []
    for (var row_index = 0; row_index < counties.length; row_index++) {

        // build query for route parameters
        const query = `SELECT pesticide_count FROM ca_reduced_udc WHERE county_cd = '${counties[row_index]}';`

        console.log("query: ", query)

        // unpack count and push to an array of async requests/Promises
        pesticide_count_promises.push(
            db.one(query)
                .then((data) => { return data.pesticide_count })
                .catch(() => { return 0 })
        )
    }

    const maxPesticideCountQuery = 'SELECT MAX(pesticide_count) FROM ca_reduced_udc;'
    pesticide_count_promises.push(
        db.one(maxPesticideCountQuery)
            .then((data) => { return data.max })
            .catch(() => {
                console.log('Using default max pesticide count. Query failed: ', maxPesticideCountQuery)
                return 579034
            } )
    )

    // when all requests resolve then send them over
    // the format is [...counts, maxCount] <- maxCount is used to provide scaling for each of the count values
    Promise.all(pesticide_count_promises)
        .then((count) => {
            console.log("Counts:", count.slice(0,-1), "Max:", count.at(-1))
            res.status(200).send(count) // return to sender
        })
        .catch((error) => {console.log('Query Promise Errors:', error)})
})

module.exports = router;
