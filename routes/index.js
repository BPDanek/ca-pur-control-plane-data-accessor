var db_config = require('../secrets');
var express = require('express');
var router = express.Router();
var pgp = require('pg-promise')(/* options */)
var db = pgp(db_config)
var url = require('url');



/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

/*
 * format of query is ?counties=["count1_id","count2_id", "count3_id",...]
 */
router.get('/query-pur-db', function(req, res, next) {

    var counties = req.query.counties

    // in the future do more stringent cleaning
    console.log("before split", counties)
    counties = counties.replace('[', '').replace(']', '')
    console.log(counties)
    counties = counties.split(',', 58)
    console.log("after split", counties[0])

    if (count.length > 58) {
        console.log("invalid query")
        res.respond("Invalid query parameters. ")
    }

    // query db
    // use pgPromise for async db access. http://vitaly-t.github.io/pg-promise/Database.html#one
    var query = 'SELECT COUNT(*) FROM ca_udc;'
    db.one(query)
      .then(function (data) {
        console.log('DATA:', data)
      })
      .catch(function (error) {
        console.log('ERROR:', error)
      })

    res.render('index', { title: 'Express' });
})

module.exports = router;
