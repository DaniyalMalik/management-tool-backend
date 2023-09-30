const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const router = express.Router();
const Message = require('../models/Message');
const { auth } = require('../middlewares/auth');
const Conversation = require('../models/Conversation');
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');
const User = require('../models/User');

// Get conversations list
router.get('/conversations', auth, async (req, res) => {
  try {
    const recipientId = req.query.recipientId;
    const conversations = await Conversation.find({
      recipients: recipientId,
    }).populate('recipients from');

    if (!conversations) {
      return res.json({
        success: false,
        message: 'Conversations not found!',
      });
    }

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'Conversations not found!',
    });
  }
});

// Update read field of conversation
router.put('/conversations/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updConversation = req.body;
    const conversation = await Conversation.findByIdAndUpdate(
      id,
      updConversation,
      { useFindAndModify: false, new: true },
    ).populate('recipients from');

    if (!conversation) {
      return res.json({
        success: false,
        message: 'Conversation could not be updated!',
      });
    }

    res.json({
      success: true,
      conversation,
      message: 'Conversation updated!',
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'Conversation could not be updated!',
    });
  }
});

// Get messages from conversation
router.get('/conversations/query', auth, (req, res) => {
  let user1 = mongoose.Types.ObjectId(req.user);
  let user2 = mongoose.Types.ObjectId(req.query.userId);

  Message.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'to',
        foreignField: '_id',
        as: 'toObj',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'from',
        foreignField: '_id',
        as: 'fromObj',
      },
    },
  ])
    .match({
      $or: [
        { $and: [{ to: user1 }, { from: user2 }] },
        { $and: [{ to: user2 }, { from: user1 }] },
      ],
    })
    .project({
      'toObj.password': 0,
      'toObj.__v': 0,
      'toObj.date': 0,
      'fromObj.password': 0,
      'fromObj.__v': 0,
      'fromObj.date': 0,
    })
    .exec((err, messages) => {
      if (err) {
        console.log(err);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Failure', success: false }));
        res.sendStatus(500);
      } else {
        res.send(messages);
      }
    });
});

// Get groups based on participant
router.get('/group/query', auth, async (req, res) => {
  try {
    const participantId = req.query.participantId;
    const groups = await Group.find({
      participants: participantId,
    }).populate('from');

    if (!groups) {
      return res.json({
        success: false,
        message: 'Groups not found!',
      });
    }

    res.json({
      success: true,
      groups,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'Groups not found!',
    });
  }
});

// Update read field of group
router.put('/group/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updGroup = req.body;
    const group = await Group.findByIdAndUpdate(id, updGroup);

    if (!group) {
      return res.json({
        success: false,
        message: 'Group could not be updated!',
      });
    }

    res.json({
      success: true,
      message: 'Group updated!',
      group,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'Group could not be updated!',
    });
  }
});

// Get group messages
router.get('/group/messages/:id', auth, async (req, res) => {
  try {
    const groupId = req.params.id;
    const groupMessages = await GroupMessage.find({ groupId }).populate('from');

    if (!groupMessages) {
      return res.json({
        success: false,
        message: 'No messages of this group found!',
      });
    }

    res.json({ success: true, groupMessages });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'No messages of this group found!' });
  }
});

// Post private message
router.post('/', auth, async (req, res) => {
  try {
    let from = mongoose.Types.ObjectId(req.user);
    let to = mongoose.Types.ObjectId(req.body.to);
    const { convoId, reset } = req.query;
    let convo = '';

    if (convoId.length == 24) {
      convo = await Conversation.findById(convoId);
    }

    Conversation.findOneAndUpdate(
      {
        recipients: {
          $all: [{ $elemMatch: { $eq: from } }, { $elemMatch: { $eq: to } }],
        },
      },
      {
        recipients: [req.user, req.body.to],
        lastMessage: req.body.body,
        read: false,
        newMessagesCount:
          reset == 'true' ? 1 : convo ? convo.newMessagesCount + 1 : 1,
        from: req.body.from,
        date: Date.now(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        useFindAndModify: false,
      },
      function (err, conversation) {
        if (err) {
          console.log(err);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Failure', success: false }));
          res.sendStatus(500);
        } else {
          let message = new Message({
            conversation: conversation._id,
            to: req.body.to,
            from: req.user,
            body: req.body.body,
          });

          req.io.sockets.emit('messages', message);

          message.save((err) => {
            if (err) {
              console.log(err);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ message: 'Failure', success: false }));
              res.sendStatus(500);
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  response: 'Success',
                  message,
                  conversationId: conversation._id,
                }),
              );
            }
          });
        }
      },
    );
  } catch (error) {
    console.log(error);
  }
});

// create a group
router.post('/group', auth, async (req, res) => {
  try {
    const group = await Group.create(req.body);

    if (!group) {
      return res.json({ success: false, message: 'Group cannot be created!' });
    }

    req.io.sockets.emit('groups', group);

    res.json({ success: true, message: 'Group created!', group });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'Group cannot be created!' });
  }
});

// Post group message
router.post('/group/query', auth, async (req, res) => {
  try {
    const { groupId, reset } = req.query;
    let updGroup = '';
    const data = {
      groupId,
      ...req.body,
    };

    if (groupId.length == 24) {
      updGroup = await Group.findById(groupId);
    }

    const group = await Group.findOneAndUpdate(
      { _id: groupId },
      {
        lastMessage: req.body.body,
        read: false,
        newMessagesCount:
          reset == 'true' ? 1 : updGroup ? updGroup.newMessagesCount + 1 : 1,
        from: req.body.from,
      },
      { useFindAndModify: false, new: true },
    );

    if (!group) {
      return res.json({
        success: false,
        message: 'Message could not be sent!',
      });
    }

    const messageId = await GroupMessage.create(data);
    const groupMessage = await GroupMessage.findById(messageId).populate(
      'from',
    );

    if (!groupMessage) {
      return res.json({
        success: false,
        message: 'Message could not be sent!',
      });
    }

    req.io.sockets.emit('groupMessages', group);

    res.json({ success: true, message: 'Message sent!', groupMessage });
  } catch (error) {
    console.log(error);

    return res.json({ success: false, message: 'Message could not be sent!' });
  }
});

module.exports = router;
