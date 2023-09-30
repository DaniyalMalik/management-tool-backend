const { Router } = require('express');
const Archive = require('../models/Archive');
const { auth } = require('../middlewares/auth');
const router = Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const { companyId } = req.query;

    if (companyId == 'undefined') {
      const archives = await Archive.find({ userId: req.user }).populate(
        'userId',
      );

      if (!archives)
        return res.json({
          success: false,
          message: 'Nothing was found in archive!',
        });

      res.json({
        success: true,
        archives,
      });
    } else {
      const archives = await Archive.find({ companyId }).populate('userId');

      if (!archives)
        return res.json({
          success: false,
          message: 'Nothing was found in archive!',
        });

      res.json({
        success: true,
        archives,
      });
    }
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'Nothing was found in archive!' });

    next(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const data = req.body;
    const archive = await Archive.create(data);

    if (!archive)
      return res.json({
        success: false,
        message: 'Nothing was added to archive!',
      });

    res.json({
      success: true,
      message: 'Added to archive!',
      archive,
    });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'Nothing was added to archive!' });

    next(error);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  const { id } = req.params;
  try {
    const archive = await Archive.findById(id).populate('userId');

    if (!archive)
      return res.json({
        success: false,
        message: `Nothing with the id: ${id} in archive found!`,
      });

    res.json({
      success: true,
      message: 'Found!',
      archive,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: `Nothing with the id: ${id} in archive found!`,
    });

    next(error);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  const { id } = req.params,
    updArchive = req.body;

  try {
    const archive = await Archive.findByIdAndUpdate(id, updArchive, {
      new: true,
      useFindAndModify: true,
    }).populate('userId');

    if (!archive) {
      return res.json({
        success: false,
        message: `No archive with the id: ${id} updated!`,
      });
    }

    res.json({ success: true, message: 'Archive Updated!', archive });
  } catch (error) {
    res.json({
      success: false,
      message: `No archive with the id: ${id} updated!`,
    });
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    const archive = await Archive.findByIdAndDelete(id);

    if (!archive) {
      return res.json({
        success: false,
        message: `No archive with the id: ${id} deleted!`,
      });
    }

    res.json({ success: true, message: 'Deleted!', archive });
  } catch (error) {
    res.json({
      success: false,
      message: `No archive with the id: ${id} deleted!`,
    });
  }
});

module.exports = router;
