var express = require('express');
var router = express.Router();
var db = require('../db/database');

// GET courses listing with pagination
router.get('/v1/courses', function(req, res, next) {
  const perPage = parseInt(req.query.per_page) || 10;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * perPage;

  // Get total count
  db.get('SELECT COUNT(*) as total FROM courses', (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get paginated courses
    db.all(
      'SELECT * FROM courses LIMIT ? OFFSET ?',
      [perPage, offset],
      (err, courses) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          data: courses || [],
          pagination: {
            per_page: perPage,
            page: page,
            total: countResult.total
          }
        });
      }
    );
  });
});

// POST - Create a new course
router.post('/v1/courses', function(req, res, next) {
  const { title, description, instructor } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  db.run(
    'INSERT INTO courses (title, description, instructor) VALUES (?, ?, ?)',
    [title, description || null, instructor || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        title,
        description,
        instructor,
        message: 'Course created successfully'
      });
    }
  );
});

// GET - Get a single course by ID
router.get('/v1/courses/:id', function(req, res, next) {
  const { id } = req.params;

  db.get('SELECT * FROM courses WHERE id = ?', [id], (err, course) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  });
});

// PUT - Update a course
router.put('/v1/courses/:id', function(req, res, next) {
  const { id } = req.params;
  const { title, description, instructor } = req.body;

  db.run(
    'UPDATE courses SET title = ?, description = ?, instructor = ? WHERE id = ?',
    [title, description, instructor, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Course not found' });
      }
      res.json({ message: 'Course updated successfully' });
    }
  );
});

// DELETE - Delete a course
router.delete('/v1/courses/:id', function(req, res, next) {
  const { id } = req.params;

  db.run('DELETE FROM courses WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully' });
  });
});

module.exports = router;
