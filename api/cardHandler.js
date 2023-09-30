const { Router } = require('express');
const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const Task = require('../models/Task');
const { auth } = require('../middlewares/auth');
const router = Router();

// fetch all the card entries from db /api/cards
router.get('/', auth, async (req, res, next) => {
  try {
    const cardEntries = await Card.find({
      user: { $elemMatch: { userId: req.user } },
    }).populate({
      path: 'user',
      populate: {
        path: 'userId',
      },
    });

    res.json(cardEntries);
  } catch (error) {
    console.log(error);

    next(error);
  }
});

router.put('/removeAccess/:id', auth, async (req, res, next) => {
  const { id } = req.params;
  try {
    const { user } = req.body;

    const cardUsers = await Card.findById(id);

    let array = [];

    array = cardUsers.user.filter((cardUser) => cardUser.userId != user._id);

    const card = await Card.findByIdAndUpdate(
      id,
      { user: array },
      { useFindAndModify: false },
    );

    if (!card) {
      return res.json({
        success: false,
        message: 'Access could not be Removed!',
      });
    }

    res.json({ success: true, message: 'Access Removed!', card });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'Access could not be Removed!' });
  }
});

// create new card entry
router.post('/', auth, async (req, res, next) => {
  try {
    const boardId = req.body.boardId;
    const board = await Board.findOne({
      _id: boardId,
      user: { $elemMatch: { userId: req.user } },
    });
    if (!board) return res.status(404).send();
    const list = await List.findOne({
      boardId,
      user: { $elemMatch: { userId: req.user } },
    });
    if (!list) return res.status(404).send();

    const card = new Card(req.body);
    const respData = await card.save();
    res.send(respData);
  } catch (error) {
    console.log(error);

    if (error.name === 'ValidationError') res.status(422);
    next(error);
  }
});

// get cards based on cardId
router.get('/:id', auth, async (req, res, next) => {
  const _id = req.params.id;
  try {
    const cards = await Card.findById({
      _id,
      user: { $elemMatch: { userId: req.user } },
    }).populate({
      path: 'user',
      populate: {
        path: 'userId',
      },
    });

    if (!cards)
      return res.status(404).send({
        error: 'Card not found!',
      });

    res.send(cards);
  } catch (error) {
    console.log(error);

    next(error);
  }
});

router.put('/bulkUpdate/:id', auth, async (req, res, next) => {
  const { id } = req.params;
  const { user } = req.body;
  const lists = await List.find({ boardId: id });

  lists.forEach(async (list) => {
    const cards = await Card.find({ listId: list._id });

    cards.forEach(async (card) => {
      // const cardUsers = await Card.findOne({
      //   user: { $elemMatch: { userId: user.userId } },
      // });
      let change = false;
      const cardUsers = await Card.findById(card._id);

      cardUsers.user.map(
        (cardUser) => cardUser.userId == user.userId && (change = true),
      );

      if (change) {
        let array = [];
        // array = boardUsers.user.filter((boardUser) => boardUser);

        array = cardUsers.user.filter(
          (cardUser) => cardUser.userId != user.userId,
        );
        array.push(user);

        await Card.findByIdAndUpdate(
          card._id,
          { user: array },
          { useFindAndModify: false },
        );
      } else {
        await Card.findByIdAndUpdate(
          card._id,
          { $push: { user } },
          { useFindAndModify: false },
        );
      }
    });
  });

  if (!lists) {
    return res.json({
      success: false,
      message: "Cards' access could not be given!",
      cards,
    });
  }

  res.json({ success: true, message: 'Access Granted!' });
});

router.put('/bulkRemove/:id', auth, async (req, res, next) => {
  const { id } = req.params;
  const { user } = req.body;
  const lists = await List.find({ boardId: id });

  lists.forEach(async (list) => {
    const cards = await Card.find({ listId: list._id });

    cards.forEach(async (card) => {
      const cardUsers = await Card.findById(card._id);

      let array = [];

      array = cardUsers.user.filter((cardUser) => cardUser.userId != user._id);

      await Card.findByIdAndUpdate(
        card._id,
        { user: array },
        { useFindAndModify: false },
      );
    });
  });

  if (!lists) {
    return res.json({
      success: false,
      message: 'Cards could not be updated!',
      cards,
    });
  }

  res.json({ success: true, message: 'Cards updated!' });
});

router.put('/:id', auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    if (req.body.description || req.body.pieChartId || req.body.commentId) {
      try {
        const card = await Card.findByIdAndUpdate(id, req.body, {
          useFindAndModify: false,
          new: true,
        });

        if (!card)
          return res.json({
            message: 'Card not found!',
            success: false,
          });

        return res.json({
          message: 'Card Updated!',
          success: true,
          card,
        });
      } catch (error) {
        console.log(error);

        res.json({ success: false, message: 'Card could not be updated!' });
      }
    }

    const { user } = req.body;

    // const cardUsers = await Card.findOne({
    //   user: { $elemMatch: { userId: user.userId } },
    // });
    let change = false;
    const cardUsers = await Card.findById(id);
    cardUsers.user.map(
      (cardUser) => cardUser.userId == user.userId && (change = true),
    );
    if (change) {
      let array = [];
      // array = cardUsers.user.filter((cardUser) => cardUser);

      array = cardUsers.user.filter(
        (cardUser) => cardUser.userId != user.userId,
      );
      array.push(user);

      const card = await Card.findByIdAndUpdate(
        id,
        { user: array },
        { useFindAndModify: false },
      );

      if (!card) {
        return res.json({
          success: false,
          message: 'Card could not be updated!',
        });
      }

      res.json({ success: true, message: 'Access Granted!', card });
    } else {
      const card = await Card.findByIdAndUpdate(
        id,
        { $push: { user } },
        { useFindAndModify: false },
      );

      if (!card) {
        return res.json({
          success: false,
          message: 'Card could not be updated!',
        });
      }

      res.json({ success: true, message: 'Access Granted!', card });
    }
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'Card could not be updated!' });
  }
});

// update card content based on id
router.patch('/:id', auth, async (req, res, next) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'listId', 'order'];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update),
  );
  if (!isValidOperation)
    return res.status(400).send({
      error: 'Invalid updates!',
    });
  try {
    const card = await Card.findByIdAndUpdate(_id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    if (!card)
      return res.status(404).send({
        error: 'Card not found!',
      });
    res.send(card);
  } catch (error) {
    console.log(error);

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

      res.json({
        message: 'Cards deleted!',
        success: true,
      });
    } catch (e) {
      console.log(e);

      res.json({
        message: 'Cards could not be deleted!',
        success: false,
      });
    }
  },
);

// delete card based on id
router.delete('/:id', auth, async (req, res, next) => {
  const _id = req.params.id;

  try {
    const card = await Card.findByIdAndDelete(_id, {
      user: { $elemMatch: { userId: req.user } },
    });

    if (!card) return res.status(404).send();

    const tasks = await Task.find({ cardId: _id });

    tasks.length > 0
      ? tasks.map(async (t) => await Task.findByIdAndDelete(t._id))
      : null;

    res.json({ success: true, message: 'Card deleted!', card });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

module.exports = router;
