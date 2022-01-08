var db_config = require('../secrets');
var express = require('express');
var router = express.Router();
var pgp = require('pg-promise')(/* options */)
var db = pgp(db_config)
const cors = require("cors");

var queryPURTable = require('../server-control-plane/query-pur-db')

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Anto' });
});

/* a sanity check */
router.get('/test', cors(), function(req, res) {

    console.log(db_config)
    console.log(pgp)
    console.log(db)

    res.status(200).send("Welcome to ca-pur-control-plane-data-accessor, the middleware + backend for the Anto system.")
})

/*
 * format of query is ?counties=["count1_id","count2_id", "count3_id",...] where countyX_id is the id for a CA county
 * responds with ["county1_count", "county2_count", "county3_count", ...] where countyX_count is the number of used pesticides for a county
 */
router.get('/query-pur-db', cors(), function(req, res, next) {

    // grab the query parameter and clean it up for using in SQL in the future do more stringent cleaning & validation
    let counties = req.query.counties.replace('[', '').replace(']', '').split(',', )
    if (counties.length > 58) {
        console.log("invalid query")
        res.send("Invalid query parameters. ")
        return
    }

    const pesticide_count_promises = [];
    queryPURTable(pesticide_count_promises, counties)

    // when all requests resolve then send them over
    // the format is [...counts, maxCount] <- maxCount is used to provide scaling for each of the count values
    Promise.all(pesticide_count_promises)
        .then((count) => {
            console.log("Counts:", count.slice(0, -1), "Max:", count.slice(-1))
            res.status(200).send(count) // return to sender
        })
        .catch((error) => {console.log('Query Promise Errors:', error)})
})

module.exports = router;
