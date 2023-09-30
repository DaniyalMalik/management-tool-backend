const { Router } = require('express');
const axios = require('axios');
const Meeting = require('../models/Meeting');
const { auth } = require('../middlewares/auth');
const router = Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const { userId } = req.query;
    const meetings = await Meeting.find({ 'user.userId': userId })
      .sort('-createdAt')
      .populate({
        path: 'user',
        populate: {
          path: 'userId',
        },
      });

    if (!meetings) {
      return res.json({
        success: false,
        message: 'No meetings found!',
      });
    }

    res.json({
      success: true,
      meetings,
    });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'No meetings found!' });

    next(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const data = req.body;
    // const id = data?.companyId ? data.companyId : data?.employId;
    // const exists = await Company.findById(id);

    // if (!exists) {
    //   return res.json({
    //     success: false,
    //     message: 'Company does not exist!',
    //   });
    // }

    if (data?.password) {
      const response = await axios.post(
        'https://api.zoom.us/v2/users/CnoSvLu0Tiy7FeIzPb6hmg/meetings',
        {
          topic: data.topic,
          type: '1',
          password: data.password,
          agenda: data.meetingAgenda,
          settings: {
            waiting_room: true,
          },
        },
        {
          headers: {
            Authorization: 'Bearer ' + process.env.ZOOM_ACCESS_TOKEN,
          },
        },
      );

      if (!response) {
        return res.json({
          success: false,
          message: 'Meeting could not be scheduled!',
        });
      }

      const meeting = await Meeting.create({
        ...data,
        startUrl: response.data.start_url,
        joinUrl: response.data.join_url,
        meetingPassword: response.data.password,
      });

      if (!meeting) {
        return res.json({
          success: false,
          message: 'Meeting could not be scheduled!',
        });
      }

      res.json({
        success: true,
        message: 'Meeting Scheduled!',
        meeting,
      });
    } else {
      const meeting = await Meeting.create({
        ...data,
      });

      if (!meeting) {
        return res.json({
          success: false,
          message: 'Meeting could not be scheduled!',
        });
      }

      res.json({
        success: true,
        message: 'Meeting Scheduled!',
        meeting,
      });
    }
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'Meeting could not be scheduled!' });

    next(error);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  const { id } = req.params;
  try {
    const meeting = await Meeting.findById(id).populate({
      path: 'user',
      populate: {
        path: 'userId',
      },
    });

    if (!meeting) {
      return res.json({
        success: false,
        message: `No meeting with the id: ${id} found!`,
      });
    }

    res.json({
      success: true,
      message: `Meeting with the id: ${id} found!`,
      meeting,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: `No meeting with the id: ${id} found!`,
    });

    next(error);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  const { id } = req.params,
    updArchive = req.body;

  try {
    const meeting = await Meeting.findByIdAndUpdate(id, updArchive, {
      new: true,
      useFindAndModify: false,
    }).populate({
      path: 'user',
      populate: {
        path: 'userId',
      },
    });

    if (!meeting) {
      return res.json({
        success: false,
        message: `No meeting with the id: ${id} updated!`,
      });
    }

    res.json({ success: true, message: 'Meeting Schdedule Updated!', meeting });
  } catch (error) {
    res.json({
      success: false,
      message: `No meeting with the id: ${id} updated!`,
    });
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    const meeting = await Meeting.findByIdAndDelete(id);

    if (!meeting) {
      return res.json({
        success: false,
        message: `No meeting with the id: ${id} deleted!`,
      });
    }

    res.json({ success: true, message: 'Meeting Schedule Deleted!', meeting });
  } catch (error) {
    res.json({
      success: false,
      message: `No meeting with the id: ${id} deleted!`,
    });
  }
});

module.exports = router;
