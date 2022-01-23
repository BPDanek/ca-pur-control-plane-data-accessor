var express = require('express');
var router = express.Router();
const cors = require("cors");
var db_config = require('../secrets');
var pgp = require('pg-promise')(/* options */)
var db = pgp(db_config)

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

    // I've been having some db connection issues--this is a sanity check
    // db.any('SELECT * FROM pur_archive_precursor.public.ca_reduced_udc WHERE id=1;')
    db.any('SELECT * FROM postgres.public.ca_reduced_udc WHERE id=1;')
        .then((data) => console.log("response", data))
        .catch((error) => console.log("error", error))

    res.status(200).send("Welcome to ca-pur-control-plane-data-accessor, the middleware + backend for the Anto system.")
})

/*
 * format of query is ?counties=["count1_id","count2_id", "count3_id",...] where countyX_id is the id for a CA county
 * responds with ["county1_count", "county2_count", "county3_count", ...] where countyX_count is the number of used pesticides for a county
 * ex: `http://localhost:3001/query-pur-db?counties=[10,11,12]`
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
    queryPURTable(pesticide_count_promises, counties, false)

    // when all requests resolve then send them over
    // the format is [...counts, maxCount] <- maxCount is used to provide scaling for each of the count values
    Promise.all(pesticide_count_promises)
        .then((count) => {
            console.log("Counts:", count.slice(0, -1), "Max:", count.slice(-1))
            res.status(200).send(count) // return to sender
        })
        .catch((error) => {console.log('Query Promise Errors:', error)})
})

/*
    An updated route that will query multiple databases depending on route parameters. Built to support different tables
    including ca_pur_reduced and ca_pur_yearly_reduced
    {hosturl}/pur?counties={str[]}&table={int}
    ex:
    .../pur?counties=["county_id", "county_id", ...]&table=0


    We are returning table 1 in all cases, except where they specifically request the non-yearly table
    table 0: ca_reduced_udc
    table 1: ca_yearly_reduced_udc (latest)
 */
router.get('/pur', cors(), function(req, res, next) {

    console.log("counties", req.query.counties)
    console.log("table", req.query.table)
    console.log("query", req.query)

    try {
        if (req.query.counties === undefined || req.query.table === undefined) {
            throw "Counties query parameter or table parameter in route `/pur` undefined."
        }

        // grab the query parameter and clean it up for using in SQL in the future do more stringent cleaning & validation
        let counties = req.query.counties.replace('[', '').replace(']', '').split(',', )
        if (counties.length > 58) {
            console.log("invalid query")
            res.send("Invalid query parameters. ")
            return
        }

        const pesticide_count_promises = [];
        queryPURTable(pesticide_count_promises, counties, req.query.table !== "1" ? false : true)

        // when all requests resolve then send them over
        // the format is [...counts, maxCount] <- maxCount is used to provide scaling for each of the count values
        Promise.all(pesticide_count_promises)
            .then((count) => {
                console.log("Counts:", count.slice(0, -1), "Max:", count.slice(-1))
                res.status(200).send(count) // return to sender
            })
            .catch((error) => {console.log('Query Promise Errors:', error)})

    } catch (e) {
        res.send("Invalid query parameters. ")
    }
})

module.exports = router;
