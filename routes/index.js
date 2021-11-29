var db_config = require('../secrets');
var express = require('express');
var router = express.Router();
var pgp = require('pg-promise')(/* options */)
var db = pgp(db_config)


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/query-pur-db/', function(req, res, next) {

  console.log("made it")
  // query db
  db.one('SELECT COUNT(*) FROM ca_udc;')
      .then(function (data) {
        console.log('DATA:', data)
      })
      .catch(function (error) {
        console.log('ERROR:', error)
      })

  res.render('index', { title: 'Express' });
})

module.exports = router;
