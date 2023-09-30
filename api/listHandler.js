const { Router } = require('express');
const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const { auth } = require('../middlewares/auth');
const router = Router();

// fetch all the list entries from the db
router.get('/', auth, async (req, res, next) => {
  try {
    const listEntries = await List.find({
      user: { $elemMatch: { userId: req.user } },
    }).populate({
      path: 'user',
      populate: {
        path: 'userId',
        model: 'user',
      },
    });

    res.json(listEntries);
  } catch (error) {
    next(error);
  }
});

// create new entry of list
router.post('/', auth, async (req, res, next) => {
  try {
    const { boardId } = req.body;

    const board = await Board.findOne({
      _id: boardId,
      user: { $elemMatch: { userId: req.user } },
    });

    if (!board) return res.status(404).send();

    let list = new List(req.body).populate({
      path: 'user',
      populate: {
        path: 'userId',
        model: 'user',
      },
    });

    await list.save();

    if (list?._id) {
      list = await List.findById(list._id).populate({
        path: 'user',
        populate: {
          path: 'userId',
          model: 'user',
        },
      });
    }

    res.send(list);
  } catch (error) {
    console.log(error);

    if (error.name === 'ValidationError') res.status(422);

    next(error);
  }
});

// get list based on listId
router.get('/:id', auth, async (req, res, next) => {
  const _id = req.params.id;

  try {
    const lists = await List.findById({
      _id,
      user: { $elemMatch: { userId: req.user } },
    }).populate({
      path: 'user',
      populate: {
        path: 'userId',
        model: 'user',
      },
    });

    if (!lists) return res.status(404).send();

    res.send(lists);
  } catch (error) {
    next(error);
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

      res.json({
        message: 'Lists deleted!',
        success: true,
      });
    } catch (e) {
      console.log(e);

      res.json({
        message: 'Lists could not be deleted!',
        success: false,
      });
    }
  },
);

// fetch cards based on list-id
router.get('/:id/cards', auth, async (req, res, next) => {
  const _id = req.params.id;

  try {
    const lists = await List.findById({
      _id,
      user: { $elemMatch: { userId: req.user } },
    }).populate({
      path: 'user',
      populate: {
        path: 'userId',
        model: 'user',
      },
    });

    if (!lists) return res.status(404).send();

    const cards = await Card.find({ listId: _id }).populate({
      path: 'user',
      populate: {
        path: 'userId',
      },
    });

    res.send(cards);
  } catch (error) {
    next(error);
  }
});

router.put('/bulkUpdate/:id', auth, async (req, res, next) => {
  const { id } = req.params;
  const { user } = req.body;

  const lists = await List.find({ boardId: id });

  lists.forEach(async (list) => {
    let change = false;
    const listUsers = await List.findById(list._id);

    listUsers.user.map(
      (listUser) => listUser.userId == user.userId && (change = true),
    );

    if (change) {
      let array = [];

      array = listUsers.user.filter(
        (listUser) => listUser.userId != user.userId,
      );
      array.push(user);

      await List.findByIdAndUpdate(
        list._id,
        { user: array },
        { useFindAndModify: false },
      );
    } else {
      await List.findByIdAndUpdate(
        list._id,
        { $push: { user } },
        { useFindAndModify: false },
      );
    }
  });

  if (!lists) {
    return res.json({
      success: false,
      message: "Lists' access could not be given!",
      lists,
    });
  }

  res.json({ success: true, message: 'Access Granted!', lists });
});

router.put('/bulkRemove/:id', auth, async (req, res, next) => {
  const { id } = req.params;
  const { user } = req.body;
  const lists = await List.find({ boardId: id });

  lists.forEach(async (list) => {
    const listUsers = await List.findById(list._id);
    let array = [];

    array = listUsers.user.filter((listUser) => listUser.userId != user._id);

    await List.findByIdAndUpdate(
      list._id,
      { user: array },
      { useFindAndModify: false },
    );
  });

  if (!lists) {
    return res.json({
      success: false,
      message: 'Lists could not be updated!',
      lists,
    });
  }

  res.json({ success: true, message: 'Lists updated!', lists });
});

router.put('/removeAccess/:id', auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    const { user } = req.body;
    const listUsers = await List.findById(id);
    let array = [];

    array = listUsers.user.filter((listUser) => listUser.userId != user._id);

    const list = await List.findByIdAndUpdate(
      id,
      { user: array },
      { useFindAndModify: false },
    );

    if (!list) {
      return res.json({
        success: false,
        message: 'Access could not be Removed!',
      });
    }

    res.json({ success: true, message: 'Access Removed!', list });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'Access could not be Removed!' });
  }
});

router.put('/:id', auth, async (req, res, next) => {
  const { id } = req.params;
  try {
    const { user } = req.body;
    let change = false;
    const listUsers = await List.findById(id);

    listUsers.user.map(
      (listUser) => listUser.userId == user.userId && (change = true),
    );

    if (change) {
      let array = [];

      array = listUsers.user.filter(
        (listUser) => listUser.userId != user.userId,
      );
      array.push(user);

      const list = await List.findByIdAndUpdate(
        id,
        { user: array },
        { useFindAndModify: false },
      );

      if (!list) {
        return res.json({
          success: false,
          message: 'User could not be updated!',
        });
      }

      res.json({ success: true, message: 'Access Granted!', list });
    } else {
      const list = await List.findByIdAndUpdate(
        id,
        { $push: { user } },
        { useFindAndModify: false },
      );

      if (!list) {
        return res.json({
          success: false,
          message: 'List could not be updated!',
        });
      }

      res.json({ success: true, message: 'Access Granted!', list });
    }
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'List could not be updated!' });
  }
});

// update list content based on id
router.patch('/:id', auth, async (req, res, next) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'order', 'color'];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update),
  );

  if (!isValidOperation)
    return res.status(400).send({ error: 'Invalid updates!' });

  try {
    const list = await List.findByIdAndUpdate(_id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    if (!list) return res.status(404).send({ error: 'List not found!' });

    res.json({ list, success: true, message: 'List updated!' });
  } catch (error) {
    next(error);
  }
});

// delete list based on id
router.delete('/:id', auth, async (req, res, next) => {
  const _id = req.params.id;
  try {
    const list = await List.findByIdAndDelete({
      _id,
      user: { $elemMatch: { userId: req.user } },
    });

    if (!list) return res.status(404).send();
    // find all cards within list and delete them as well
    const cards = await Card.find({
      listid: _id,
      user: { $elemMatch: { userId: req.user } },
    });

    cards.forEach(async (card) => await Card.deleteOne({ _id: card._id }));

    res.json({ success: true, list, message: 'List deleted!' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
