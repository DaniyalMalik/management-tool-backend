const { Router } = require('express');
const Favourite = require('../models/Favourite');
const { auth } = require('../middlewares/auth');
const router = Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const { userId } = req.query;
    const favourites = await Favourite.find({ userId }).populate(
      'userId boardId',
    );

    if (!favourites) {
      return res.json({
        success: false,
        message: 'Nothing found in favourites!',
      });
    }

    res.json({
      success: true,
      favourites,
    });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'Nothing found in favourites!' });
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const data = req.body;
    const favourite = await Favourite.create({
      ...data,
    });

    if (!favourite) {
      return res.json({
        success: false,
        message: 'Board could not be added to favourites!',
      });
    }

    res.json({
      success: true,
      message: 'Added to favourite!',
      favourite,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'Board could not be added to favourites!',
    });
  }
});

router.get('/:id', auth, async (req, res, next) => {
  const { id } = req.params;
  try {
    const favourite = await Favourite.findById(id).populate('userId boardId');

    if (!favourite) {
      return res.json({
        success: false,
        message: `Board with the id: ${id} was not found in favourites!`,
      });
    }

    res.json({
      success: true,
      favourite,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: `Board with the id: ${id} was not found in favourites!`,
    });
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    const favourite = await Favourite.findByIdAndDelete(id);

    if (!favourite) {
      return res.json({
        success: false,
        message: 'Board could not be removed from the favourites',
      });
    }

    res.json({
      success: true,
      message: 'Board removed from favourites!',
      favourite,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'Board could not be removed from the favourites',
    });
  }
});

module.exports = router;
