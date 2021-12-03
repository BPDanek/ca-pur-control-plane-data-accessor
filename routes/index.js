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

router.get('/test', function(req, res) {
    res.send("Welcome to ca-pur-control-plane-data-accessor, the middleware + backend for the Anto system.")
})

/*
 * format of query is ?counties=["count1_id","count2_id", "count3_id",...] where countyX_id is the id for a CA county
 * responds with ["county1_count", "county2_count", "county3_count", ...] where countyX_count is the number of used pesticides for a county
 */
router.get('/query-pur-db', cors(),function(req, res, next) {

    // part of route
    var counties = req.query.counties

    // in the future do more stringent cleaning
    counties = counties.replace('[', '').replace(']', '').split(',', )

    if (counties.length > 58) {
        console.log("invalid query")
        res.send("Invalid query parameters. ")
        return
    }

    var pesticide_count_promises = []

    // query db using pgPromise for async db access. http://vitaly-t.github.io/pg-promise/Database.html#one
    for (var row_index = 0; row_index < counties.length; row_index++) {

        // build query for rout parameters
        const query = `SELECT COUNT(*) FROM ca_udc WHERE county_cd = '${counties[row_index]}';`

        // unpack count and push to an array of async requests/Promises
        pesticide_count_promises.push(
            db.one(query)
                .then((data) => { return data.count })
                .catch(() => { return 0 })
        )
    }

    // when all requests resolve then
    Promise.all(pesticide_count_promises)
        .then((count) => {
            console.log("Counts:", count)
            res.status(200).send(count) // return to sender
        })
        .catch((error) => {console.log('Query Promise Errors:', error)})
})

module.exports = router;
