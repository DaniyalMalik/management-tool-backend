const { Router } = require('express');
const Notification = require('../models/Notification');
const { auth } = require('../middlewares/auth');
const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { userId, companyId } = req.query;
    let notifications = '';

    if (companyId == 'undefined') {
      notifications = await Notification.find({
        'for.userId': userId,
      })
        .sort('-createdAt')
        .populate({
          path: 'for',
          populate: {
            path: 'userId',
          },
        })
        .populate('companyId from');
    } else {
      notifications = await Notification.find({
        'for.userId': userId,
        companyId,
      })
        .sort('-createdAt')
        .populate({
          path: 'for',
          populate: {
            path: 'userId',
          },
        })
        .populate('companyId from');
    }

    if (!notifications) {
      return res.json({
        success: false,
        message: 'No notifications found!',
      });
    }

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    res.json({ success: false, message: 'No notifications found!' });

    console.log(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const data = req.body;
    const notification = await Notification.create({
      ...data,
    });

    if (!notification) {
      return res.json({
        success: false,
        message: 'Notification could not be added!',
      });
    }

    // req.io.sockets.broadcast.emit('notification', notification);
    req.io.on('connection', function (socket) {
      socket.broadcast.emit('notification', notification);
    });

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'Notification could not be added!',
    });
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.json({
        success: false,
        message: `No notification with the id: ${id} deleted!`,
      });
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    res.json({
      success: false,
      message: `No notification with the id: ${id} deleted!`,
    });

    console.log(error);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  const { id } = req.params,
    updNotification = req.body;

  try {
    const notification = await Notification.findByIdAndUpdate(
      id,
      updNotification,
      {
        new: true,
        useFindAndModify: false,
      },
    )
      .populate({
        path: 'for',
        populate: {
          path: 'userId',
        },
      })
      .populate('companyId from');

    if (!notification) {
      return res.json({
        success: false,
        message: `No notification with the id: ${id} updated!`,
      });
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    res.json({
      success: false,
      message: `No notification with the id: ${id} updated!`,
    });

    console.log(error);
  }
});

module.exports = router;
