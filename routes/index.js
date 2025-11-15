var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET courses page. */
router.get('/courses', function(req, res, next) {
  res.render('courses');
});

/* GET dashboard page. */
router.get('/dashboard', function(req, res, next) {
  res.render('dashboard');
});

/* GET lottery predictions page. */
router.get('/lottery', function(req, res, next) {
  res.render('lottery');
});

module.exports = router;
