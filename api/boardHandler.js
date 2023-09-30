const { Router } = require('express');
const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const Task = require('../models/Task');
const Favourite = require('../models/Favourite');
const Activity = require('../models/Activity');
const { auth } = require('../middlewares/auth');
const router = Router();

// fetch all the boards for a user
router.get('/', auth, async (req, res, next) => {
  try {
    const boardsList = await Board.find({
      user: { $elemMatch: { userId: req.user } },
    }).populate({
      path: 'user',
      populate: {
        path: 'userId',
        model: 'user',
      },
    });

    res.json(boardsList);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get('/count', auth, async (req, res, next) => {
  try {
    const boardsCount = await Board.find({
      user: { $elemMatch: { userId: req.user, role: 'Admin' } },
    }).countDocuments();

    if (!boardsCount) {
      return res.json({ success: false, message: 'No boards found!' });
    }

    res.json({ success: true, boardsCount });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'No boards found!' });
  }
});

// create new board for a user
router.post('/', auth, async (req, res, next) => {
  try {
    const board = new Board(req.body);
    const respData = await board.save();

    res.json({ board: respData, success: true, message: 'Board created!' });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

// get board based on id
router.get('/:id', auth, async (req, res, next) => {
  const _id = req.params.id;

  try {
    const board = await Board.findOne({
      _id,
      user: { $elemMatch: { userId: req.user } },
    }).populate({
      path: 'user',
      populate: {
        path: 'userId',
        model: 'user',
      },
    });

    if (!board) return res.status(404).send();

    res.json({ success: true, board });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

// get lists based on boardId
router.get('/:id/lists', auth, async (req, res, next) => {
  const _id = req.params.id;

  try {
    const board = await Board.findOne({
      _id,
      user: { $elemMatch: { userId: req.user } },
    }).populate({
      path: 'user',
      populate: {
        path: 'userId',
        model: 'user',
      },
    });

    if (!board) return res.status(404).send();

    const lists = await List.find({
      boardId: _id,
      user: { $elemMatch: { userId: req.user } },
    }).populate({
      path: 'user',
      populate: {
        path: 'userId',
        model: 'user',
      },
    });

    res.json({ success: true, lists });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

// get cards based on boardId
router.get('/:id/cards', auth, async (req, res, next) => {
  const _id = req.params.id;
  try {
    const board = await Board.findOne({
      _id,
      user: { $elemMatch: { userId: req.user } },
    }).populate({
      path: 'user',
      populate: {
        path: 'userId',
        model: 'user',
      },
    });

    if (!board) return res.status(404).send();

    const cards = await Card.find({
      boardId: _id,
      user: { $elemMatch: { userId: req.user } },
    }).populate({
      path: 'user',
      populate: {
        path: 'userId',
      },
    });

    res.json({ success: true, cards });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

// get activities based on boardId
router.get('/:id/activities', auth, async (req, res, next) => {
  const _id = req.params.id;
  const _last = req.query.last;
  const _limit = Number.parseInt(req.query.limit, 10) || 10;

  try {
    const board = await Board.findOne({
      _id,
      user: { $elemMatch: { userId: req.user } },
    });

    if (!board) return res.status(404).send();

    const query = { boardId: _id };

    if (_last) query._id = { $lt: _last };

    const activities = await Activity.find(query, null, {
      limit: _limit + 1,
      sort: { _id: 'desc' },
    });

    res.append(
      'X-Has-More',
      activities.length === _limit + 1 ? 'true' : 'false',
    );

    res.send(activities.slice(0, _limit));
  } catch (error) {
    console.log(error);

    next(error);
  }
});

router.put('/udpateFavourite/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const board = await Board.findByIdAndUpdate(id, data, {
      useFindAndModify: false,
    });

    if (!board) {
      return res.json({
        success: false,
        message: 'Board could not be updated!',
      });
    }

    res.json({
      success: true,
      message: 'Board updated!',
      board,
    });
  } catch (e) {
    console.log(e);

    res.json({
      success: false,
      message: 'Board could not be updated!',
    });
  }
});

router.put('/updateBoard/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const board = await Board.findByIdAndUpdate(id, data, {
      useFindAndModify: false,
    });

    if (!board) {
      return res.json({
        success: false,
        message: 'Board could not be updated!',
      });
    }

    res.json({
      success: true,
      message: 'Board updated!',
      board,
    });
  } catch (e) {
    console.log(e);

    res.json({
      success: false,
      message: 'Board could not be updated!',
    });
  }
});

// update board content based on id
router.patch('/:id', auth, async (req, res, next) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'image'];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update),
  );
  if (!isValidOperation)
    return res.status(400).send({ error: 'Invalid updates!' });
  try {
    const board = await Board.findOneAndUpdate(
      { _id, user: { $elemMatch: { userId: req.user } } },
      req.body,
      { new: true, runValidators: true, useFindAndModify: false },
    );
    if (!board) return res.status(404).send({ error: 'Board not found!' });
    res.send(board);
  } catch (error) {
    console.log(error);

    next(error);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    const { user } = req.body;
    // const boardUsers = await Board.findById({
    //   user: { $elemMatch: { userId: user.userId } },
    // });
    let change = false;
    const boardUsers = await Board.findById(id);
    boardUsers.user.map(
      (boardUser) => boardUser.userId == user.userId && (change = true),
    );

    if (change) {
      let array = [];
      // array = boardUsers.user.filter((boardUser) => boardUser);

      array = boardUsers.user.filter(
        (boardUser) => boardUser.userId != user.userId,
      );
      array.push(user);

      const board = await Board.findByIdAndUpdate(
        id,
        { user: array },
        { useFindAndModify: false },
      );

      if (!board) {
        return res.json({
          success: false,
          message: 'User could not be updated!',
        });
      }

      res.json({ success: true, message: 'Access Granted!', board });
    } else {
      const board = await Board.findByIdAndUpdate(
        id,
        { $push: { user } },
        { useFindAndModify: false },
      );

      if (!board) {
        return res.json({
          success: false,
          message: 'User could not be updated!',
        });
      }

      res.json({ success: true, message: 'Access Granted!', board });
    }
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'User could not be updated!' });
  }
});

router.put('/removeAccess/:id', auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    const { user } = req.body;

    const boardUsers = await Board.findById(id);

    let array = [];

    array = boardUsers.user.filter((boardUser) => boardUser.userId != user._id);

    const board = await Board.findByIdAndUpdate(
      id,
      { user: array },
      { useFindAndModify: false },
    );

    if (!board) {
      return res.json({
        success: false,
        message: 'Access could not be Removed!',
      });
    }

    res.json({ success: true, message: 'Access Removed!', board });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'Access could not be Removed!' });
  }
});

router.delete(
  '/deletebulkbycompanyid/:companyId',
  auth,
  async (req, res, next) => {
    try {
      const { companyId } = req.params;
      const cards = await Card.deleteMany({
        companyId,
      });

      if (!cards) {
        return res.json({
          message: 'Cards could not be deleted!',
          success: false,
        });
      }

      const lists = await List.deleteMany({
        companyId,
      });

      if (!lists) {
        return res.json({
          message: 'Lists could not be deleted!',
          success: false,
        });
      }

      const boards = await Board.deleteMany({
        companyId,
      });

      if (!boards) {
        return res.json({
          message: 'Boards could not be deleted!',
          success: false,
        });
      }

      res.json({
        message: 'Boards deleted!',
        success: true,
      });
    } catch (e) {
      console.log(e);

      res.json({
        message: 'Boards could not be deleted!',
        success: false,
      });
    }
  },
);

// delete board based on id
router.delete('/:id', auth, async (req, res, next) => {
  const _id = req.params.id;

  try {
    const board = await Board.findOneAndDelete({
      _id,
      user: { $elemMatch: { userId: req.user } },
    });

    if (!board) {
      return res.json({
        message: 'Board could not be deleted!',
        success: false,
      });
    }

    const lists = await List.find({
      boardId: _id,
      user: { $elemMatch: { userId: req.user } },
    });

    if (!lists) {
      return res.json({
        message: 'An error occurred while deleting board!',
        success: false,
      });
    }

    lists.forEach(async (list) => {
      // find all cards within each lists and delete them as well
      const cards = await Card.find({
        listId: list._id,
        user: { $elemMatch: { userId: req.user } },
      });

      if (!cards) {
        return res.json({
          message: 'An error occurred while deleting board!',
          success: false,
        });
      }

      cards.forEach(async (card) => {
        const tasks = await Task.find({
          cardId: card._id,
        });

        tasks.forEach(async (task) => {
          await Task.findByIdAndDelete(task._id);
        });

        await Card.findByIdAndDelete(card._id);
      });
      await List.findByIdAndDelete(list._id);
    });

    const favourite = await Favourite.deleteOne({
      boardId: _id,
    });

    if (!favourite) {
      return res.json({
        message: 'An error occurred while deleting board!',
        success: false,
      });
    }

    const activities = await Activity.find({ boardId: _id });

    activities.forEach(async (activity) => {
      await Activity.findByIdAndDelete(activity._id);
    });

    if (!activities) {
      return res.json({
        message: 'An error occurred while deleting board!',
        success: false,
      });
    }

    res.json({ board, message: 'Board deleted', success: true });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
