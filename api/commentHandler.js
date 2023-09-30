const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const Comment = require('../models/Comment');
const Card = require('../models/Card');

// get comments based on cardId
router.get('/', auth, async (req, res) => {
  try {
    const { cardId } = req.query;
    const comments = await Comment.find({ cardId }).populate('from cardId');

    if (!comments) {
      return res.json({
        success: false,
        message: 'No comments found!',
      });
    }

    res.json({ success: true, comments });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'No comments found!',
    });
  }
});

// add comment
router.post('/', auth, async (req, res) => {
  try {
    const data = req.body;
    const comment = await Comment.create(data);

    if (!comment) {
      return res.json({
        success: false,
        message: 'Comment could not be added!',
      });
    }

    req.io.sockets.emit('comment', comment);

    res.json({ success: true, message: 'Comment added!', comment });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'Comment could not be added!',
    });
  }
});

module.exports = router;
