const { Router } = require('express');
const Activity = require('../models/Activity');
const Board = require('../models/Board');
const { auth } = require('../middlewares/auth');

const router = Router();

// // get all activities
router.get('/', auth, async (req, res, next) => {
  try {
    const { boardId } = req.body;
    const activities = await Activity.find({ boardId });
    res.json(activities);
  } catch (error) {
    next(error);
  }
});

// create new activity
router.post('/', auth, async (req, res, next) => {
  try {
    const boardId = req.body.boardId;
    const board = await Board.findOne({
      _id: boardId,
      user: { $elemMatch: { userId: req.user } },
    });
    if (!board) return res.status(404).send();
    const activity = new Activity(req.body);
    const respData = await activity.save();
    res.send(respData);
  } catch (error) {
    if (error.name === 'ValidationError') res.status(422);
    next(error);
  }
});

// delete activity based on id
router.delete('/:id', auth, async (req, res, next) => {
  const _id = req.params.id;
  try {
    const activity = await Activity.findByIdAndDelete(_id);
    if (!activity) return res.status(404).send();
    res.send(activity);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
