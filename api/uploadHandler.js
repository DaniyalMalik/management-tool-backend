const express = require('express'),
  router = express.Router(),
  Card = require('../models/Card'),
  User = require('../models/User'),
  Company = require('../models/Company'),
  Task = require('../models/Task'),
  TodoList = require('../models/TodoList'),
  GroupMessage = require('../models/GroupMessage'),
  Group = require('../models/Group'),
  Conversation = require('../models/Conversation'),
  mongoose = require('mongoose'),
  Message = require('../models/Message'),
  Board = require('../models/Board'),
  { auth } = require('../middlewares/auth'),
  // Grid = require('gridfs-stream'),
  aws = require('aws-sdk'),
  multer = require('multer'),
  multerS3 = require('multer-s3'),
  path = require('path'),
  upload = multer();
// rimraf = require('rimraf'),
// mkdirp = require('mkdirp');

// let gfs;

// const conn = mongoose.connection;
// conn.once('open', function () {
//   gfs = Grid(conn.db, mongoose.mongo);
//   gfs.collection('photos');
// });

const s3 = new aws.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_BUCKET_REGION,
});

const s3UploadFile = (
  bucketName,
  companyId,
  userId,
  type,
  boardId,
  todoId,
  cardId,
  taskId,
  convoId,
) =>
  multer({
    storage: multerS3({
      s3,
      bucket: bucketName,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        const extension = path.extname(file.originalname);

        if (type === 'board') {
          companyId
            ? cb(
                null,
                `companies/${companyId}/users/${userId}/boards/${boardId}/${
                  Date.now() + extension
                }`,
              )
            : cb(
                null,
                `users/${userId}/boards/${boardId}/${Date.now() + extension}`,
              );
        } else if (type === 'card') {
          companyId
            ? cb(
                null,
                `companies/${companyId}/users/${userId}/boards/${boardId}/cards/${cardId}/${
                  Date.now() + extension
                }`,
              )
            : cb(
                null,
                `users/${userId}/boards/${boardId}/cards/${cardId}/${
                  Date.now() + extension
                }`,
              );
        } else if (type === 'task') {
          if (!cardId) {
            cb(
              null,
              `companies/${companyId}/users/${userId}/tasks/${taskId}/${
                Date.now() + extension
              }`,
            );
          } else {
            cb(
              null,
              `companies/${companyId}/users/${userId}/boards/${boardId}/cards/${cardId}/tasks/${taskId}/${
                Date.now() + extension
              }`,
            );
          }
        } else if (type === 'todo') {
          companyId
            ? cb(
                null,
                `companies/${companyId}/users/${userId}/todos/${todoId}/${
                  Date.now() + extension
                }`,
              )
            : cb(
                null,
                `users/${userId}/todos/${todoId}/${Date.now() + extension}`,
              );
        } else if (type === 'user') {
          companyId
            ? cb(
                null,
                `companies/${companyId}/users/${userId}/${
                  Date.now() + extension
                }`,
              )
            : cb(null, `users/${userId}/${Date.now() + extension}`);
        } else if (type === 'group') {
          cb(
            null,
            `companies/${companyId}/users/${userId}/conversations/${convoId}/${
              Date.now() + extension
            }`,
          );
        } else if (type === 'message') {
          cb(
            null,
            `companies/${companyId}/users/${userId}/conversations/${convoId}/${
              Date.now() + extension
            }`,
          );
        }
      },
    }),
  });

const s3DeleteFile = function (bucketName, url) {
  const params = {
    Bucket: bucketName,
    Key: url,
  };

  return s3.deleteObject(params, function (err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log('Successfully deleted attachment from bucket!');
    }
  });
};

const s3DeleteFolder = (bucketName, url) => {
  let params = {
    Bucket: bucketName,
    Prefix: url,
  };

  s3.listObjects(params, function (err, data) {
    if (err) return console.log(err);

    if (data.Contents.length == 0) return console.log('Nothing to delete!');

    params = { Bucket: bucketName };
    params.Delete = { Objects: [] };

    data.Contents.forEach(function (content) {
      params.Delete.Objects.push({ Key: content.Key });
    });

    s3.deleteObjects(params, function (err, data) {
      if (err) return console.log(err);
      else {
        console.log('Folder deleted!');
      }
    });
  });
};

router.post('/uploadprofilepicture', auth, async (req, res, next) => {
  const user = await User.findById(req.user).populate('employId companyId');
  const uploadSingle = s3UploadFile(
    'biztruc',
    user?.companyId?._id ? user.companyId._id : user?.employId?._id,
    user?._id,
    'user',
    null,
    null,
    null,
    null,
    null,
  ).single('file');

  if (user?.imagePath) {
    const company = user?.companyId ? user.companyId : user?.employId;
    const imagePath = user?.imagePath.split('/');
    const attachmentUrl = company
      ? `companies/${company._id}/users/${user._id}/${
          imagePath[imagePath.length - 1]
        }`
      : `users/${user._id}/${imagePath[imagePath.length - 1]}`;

    s3DeleteFile('biztruc', attachmentUrl);
  }

  uploadSingle(req, res, async (err) => {
    if (err) return res.json({ success: false, message: err.message });

    if (
      req.file.mimetype === 'image/png' ||
      req.file.mimetype === 'image/jpeg' ||
      req.file.mimetype === 'image/gif'
    ) {
      const user = await User.findById(req.user);
      const companyId = user?.companyId ? user.companyId : user?.employId;
      const company = await Company.findById(companyId);

      await Company.findByIdAndUpdate(
        companyId,
        {
          attachmentsSize: +company?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );
      await User.findByIdAndUpdate(
        req.user,
        {
          attachmentsSize: +user?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );

      res.json({
        success: true,
        message: 'Image Uploaded Successfully!',
        imageName: req.file.location,
      });
    } else {
      return res.json({
        success: false,
        message: 'Select a file of correct format!',
      });
    }
  });
});

router.post('/uploadchatattachment', auth, async (req, res, next) => {
  const user = await User.findById(req.user).populate('employId companyId');
  const { convoId, type, reset, fileType, to, body, from } = req.query;
  let groupMessage = '';
  const data = {
    to,
    body,
    from,
  };

  const uploadSingle = s3UploadFile(
    'biztruc',
    user?.companyId?._id ? user.companyId._id : user?.employId?._id,
    user?._id,
    type,
    null,
    null,
    null,
    null,
    convoId,
  ).single('file');

  uploadSingle(req, res, async (err) => {
    const newFileType = req?.file?.originalname?.split('.')[1];

    if (err) return res.json({ success: false, message: err.message });
    if (
      req.file.mimetype === 'image/png' ||
      req.file.mimetype === 'image/jpeg' ||
      req.file.mimetype === 'image/gif' ||
      req.file.mimetype === 'application/pdf' ||
      newFileType === 'pdf' ||
      newFileType === 'pptx' ||
      newFileType === 'ppt' ||
      newFileType === 'doc' ||
      newFileType === 'docx' ||
      newFileType === 'xlsx' ||
      newFileType === 'xls' ||
      req.file.mimetype === 'video/mp4' ||
      req.file.mimetype === 'video/x-m4v'
    ) {
      const user = await User.findById(req.user);
      const companyId = user?.companyId ? user.companyId : user?.employId;
      const company = await Company.findById(companyId);

      await Company.findByIdAndUpdate(
        companyId,
        {
          attachmentsSize: +company?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );
      await User.findByIdAndUpdate(
        req.user,
        {
          attachmentsSize: +user?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );

      if (type === 'group') {
        let updGroup = '';
        const newData = {
          groupId: convoId,
          ...data,
          imagePath: fileType === 'image' ? req.file.location : null,
          videoPath: fileType === 'video' ? req.file.location : null,
          filePath: fileType === 'file' ? req.file.location : null,
        };

        if (convoId.length == 24) {
          updGroup = await Group.findById(convoId);
        }

        const group = await Group.findOneAndUpdate(
          { _id: convoId },
          {
            lastMessage: newData.body,
            read: false,
            newMessagesCount:
              reset == 'true'
                ? 1
                : updGroup
                ? updGroup.newMessagesCount + 1
                : 1,
            from: newData.from,
          },
          { useFindAndModify: false, new: true },
        );

        if (!group) {
          return res.json({
            success: false,
            message: 'Message could not be sent!',
          });
        }

        groupMessage = await GroupMessage.create(newData);
        groupMessage = await GroupMessage.findById(groupMessage._id).populate(
          'from',
        );

        req.io.sockets.emit('groupMessages', group);
      } else {
        let from = mongoose.Types.ObjectId(req.user);
        let to = mongoose.Types.ObjectId(data.to);
        let convo = '';

        if (convoId.length == 24) {
          convo = await Conversation.findById(convoId);
        }

        Conversation.findOneAndUpdate(
          {
            recipients: {
              $all: [
                { $elemMatch: { $eq: from } },
                { $elemMatch: { $eq: to } },
              ],
            },
          },
          {
            recipients: [req.user, data.to],
            lastMessage: data.body,
            read: false,
            newMessagesCount:
              reset == 'true' ? 1 : convo ? convo.newMessagesCount + 1 : 1,
            from: data.from,
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
                ...data,
                imagePath: fileType === 'image' ? req.file.location : null,
                videoPath: fileType === 'video' ? req.file.location : null,
                filePath: fileType === 'file' ? req.file.location : null,
              });

              req.io.sockets.emit('messages', message);

              message.save((err) => {
                if (err) {
                  console.log(err);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({ message: 'Failure', success: false }),
                  );
                  res.sendStatus(500);
                }
              });
            }
          },
        );
      }

      groupMessage
        ? res.json({
            success: true,
            message: 'Attachment sent!',
            groupMessage,
          })
        : res.json({
            success: true,
            message: 'Attachment sent!',
          });
    } else {
      return res.json({
        success: false,
        message: 'Select a file of correct format!',
      });
    }
  });
});

router.post('/uploadgroupprofilepicture', auth, async (req, res, next) => {
  const user = await User.findById(req.user).populate('employId companyId');
  const { groupId } = req.query;
  const group = await Group.findById(groupId).populate('employId companyId');
  const uploadSingle = s3UploadFile(
    'biztruc',
    user?.companyId?._id ? user.companyId._id : user?.employId?._id,
    user?._id,
    'group',
    null,
    null,
    null,
    null,
    group?._id,
  ).single('file');

  if (group?.imagePath) {
    const company = user?.companyId ? user.companyId : user?.employId;
    const imagePath = user?.imagePath.split('/');
    const attachmentUrl = `companies/${company._id}/users/${user._id}/groups/${
      group._id
    }/${imagePath[imagePath.length - 1]}`;

    s3DeleteFile('biztruc', attachmentUrl);
  }

  uploadSingle(req, res, async (err) => {
    if (err) return res.json({ success: false, message: err.message });

    if (
      req.file.mimetype === 'image/png' ||
      req.file.mimetype === 'image/jpeg' ||
      req.file.mimetype === 'image/gif'
    ) {
      const user = await User.findById(req.user);
      const companyId = user?.companyId ? user.companyId : user?.employId;
      const company = await Company.findById(companyId);
      const group = await Group.findByIdAndUpdate(
        groupId,
        {
          imagePath: req.file.location,
        },
        { useFindAndModify: false },
      );

      await Company.findByIdAndUpdate(
        companyId,
        {
          attachmentsSize: +company?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );
      await User.findByIdAndUpdate(
        req.user,
        {
          attachmentsSize: +user?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );

      res.json({
        success: true,
        message: 'Image Uploaded Successfully!',
        group,
      });
    } else {
      return res.json({
        success: false,
        message: 'Select a file of correct format!',
      });
    }
  });
});

router.post('/uploadcardattachment', auth, async (req, res, next) => {
  const { cardId, boardId } = req.query;
  const user = await User.findById(req.user).populate('employId companyId');
  const uploadSingle = s3UploadFile(
    'biztruc',
    user?.companyId?._id ? user.companyId._id : user?.employId?._id,
    user?._id,
    'card',
    boardId,
    null,
    cardId,
    null,
    null,
  ).single('file');

  uploadSingle(req, res, async (err) => {
    if (err) return res.json({ success: false, message: err.message });

    const fileType = req.file.originalname.split('.')[1];

    if (
      fileType === 'pdf' ||
      fileType === 'pptx' ||
      fileType === 'ppt' ||
      fileType === 'doc' ||
      fileType === 'docx' ||
      fileType === 'xlsx' ||
      fileType === 'xls'
    ) {
      const card = await Card.findByIdAndUpdate(
        cardId,
        { $push: { filePath: req.file.location } },
        { useFindAndModify: false },
      );

      if (!card) {
        return res.json({ success: false, message: 'File failed to save!' });
      }

      const user = await User.findById(req.user);
      const companyId = user?.companyId ? user.companyId : user?.employId;
      const company = await Company.findById(companyId);

      await Company.findByIdAndUpdate(
        companyId,
        {
          attachmentsSize: +company?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );
      await User.findByIdAndUpdate(
        req.user,
        {
          attachmentsSize: +user?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );

      return res.json({
        success: true,
        message: 'File Uploaded Successfully!',
        card,
      });
    } else if (
      req.file.mimetype === 'image/png' ||
      req.file.mimetype === 'image/jpeg' ||
      req.file.mimetype === 'image/gif'
    ) {
      const card = await Card.findByIdAndUpdate(
        cardId,
        { $push: { imagePath: req.file.location } },
        { useFindAndModify: false },
      );

      if (!card) {
        return res.json({ success: false, message: 'Image failed to save!' });
      }

      const user = await User.findById(req.user);
      const companyId = user?.companyId ? user.companyId : user?.employId;
      const company = await Company.findById(companyId);

      await Company.findByIdAndUpdate(
        companyId,
        {
          attachmentsSize: +company?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );
      await User.findByIdAndUpdate(
        req.user,
        {
          attachmentsSize: +user?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );

      return res.json({
        success: true,
        message: 'Image Uploaded Successfully!',
        card,
      });
    } else if (
      req.file.mimetype === 'video/mp4' ||
      req.file.mimetype === 'video/x-m4v'
    ) {
      const card = await Card.findByIdAndUpdate(
        cardId,
        { $push: { videoPath: req.file.location } },
        { useFindAndModify: false },
      );

      if (!card) {
        return res.json({ success: false, message: 'Video failed to save!' });
      }

      const user = await User.findById(req.user);
      const companyId = user?.companyId ? user.companyId : user?.employId;
      const company = await Company.findById(companyId);

      await Company.findByIdAndUpdate(
        companyId,
        {
          attachmentsSize: +company?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );
      await User.findByIdAndUpdate(
        req.user,
        {
          attachmentsSize: +user?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );

      return res.json({
        success: true,
        message: 'Video Uploaded Successfully!',
        card,
      });
    } else {
      return res.json({
        success: false,
        message: 'Select a file of correct format!',
      });
    }
  });
});

router.post('/uploadtasksubmissionattachment', auth, async (req, res, next) => {
  const { taskId } = req.query;
  const user = await User.findById(req.user).populate('employId companyId');
  const task = await Task.findById(taskId);
  let card = '';

  task?.cardId && (card = await Card.findById(task.cardId));

  const uploadSingle = s3UploadFile(
    'biztruc',
    user?.companyId?._id ? user.companyId._id : user?.employId?._id,
    user?._id,
    'task',
    card ? card?.boardId : null,
    null,
    card ? card?._id : null,
    taskId,
    null,
  ).single('file');

  uploadSingle(req, res, async (err) => {
    if (err) return res.json({ success: false, message: err.message });

    const fileType = req.file.originalname.split('.')[1];

    if (
      fileType === 'pdf' ||
      fileType === 'pptx' ||
      fileType === 'ppt' ||
      fileType === 'doc' ||
      fileType === 'docx' ||
      fileType === 'xlsx' ||
      fileType === 'xls'
    ) {
      const user = await User.findById(req.user);
      const companyId = user?.companyId ? user.companyId : user?.employId;
      const company = await Company.findById(companyId);

      await Company.findByIdAndUpdate(
        companyId,
        {
          attachmentsSize: +company?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );
      await User.findByIdAndUpdate(
        req.user,
        {
          attachmentsSize: +user?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );

      return res.json({
        success: true,
        message: 'File Uploaded Successfully!',
        filePath: req.file.location,
      });
    } else if (
      req.file.mimetype === 'image/png' ||
      req.file.mimetype === 'image/jpeg' ||
      req.file.mimetype === 'image/gif'
    ) {
      const user = await User.findById(req.user);
      const companyId = user?.companyId ? user.companyId : user?.employId;
      const company = await Company.findById(companyId);

      await Company.findByIdAndUpdate(
        companyId,
        {
          attachmentsSize: +company?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );
      await User.findByIdAndUpdate(
        req.user,
        {
          attachmentsSize: +user?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );

      return res.json({
        success: true,
        message: 'Image Uploaded Successfully!',
        imagePath: req.file.location,
      });
    } else if (
      req.file.mimetype === 'video/mp4' ||
      req.file.mimetype === 'video/x-m4v'
    ) {
      const user = await User.findById(req.user);
      const companyId = user?.companyId ? user.companyId : user?.employId;
      const company = await Company.findById(companyId);

      await Company.findByIdAndUpdate(
        companyId,
        {
          attachmentsSize: +company?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );
      await User.findByIdAndUpdate(
        req.user,
        {
          attachmentsSize: +user?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );

      return res.json({
        success: true,
        message: 'Video Uploaded Successfully!',
        videoPath: req.file.location,
      });
    } else {
      return res.json({
        success: false,
        message: 'Select a file of correct format!',
      });
    }
  });
});

router.post('/uploadtaskattachment', auth, async (req, res, next) => {
  const { taskId } = req.query;
  const user = await User.findById(req.user).populate('employId companyId');
  const task = await Task.findById(taskId);
  let card = '';

  task?.cardId && (card = await Card.findById(task.cardId));

  const uploadSingle = s3UploadFile(
    'biztruc',
    user?.companyId?._id ? user.companyId._id : user?.employId?._id,
    user?._id,
    'task',
    card ? card?.boardId : null,
    null,
    card ? card?._id : null,
    taskId,
    null,
  ).single('file');

  uploadSingle(req, res, async (err) => {
    if (err) return res.json({ success: false, message: err.message });

    const fileType = req.file.originalname.split('.')[1];

    if (
      fileType === 'pdf' ||
      fileType === 'pptx' ||
      fileType === 'ppt' ||
      fileType === 'doc' ||
      fileType === 'docx' ||
      fileType === 'xlsx' ||
      fileType === 'xls'
    ) {
      const task = await Task.findByIdAndUpdate(
        taskId,
        { $push: { filePath: req.file.location } },
        { useFindAndModify: false },
      );

      if (!task) {
        return res.json({ success: false, message: 'File failed to save!' });
      }

      const user = await User.findById(req.user);
      const companyId = user?.companyId ? user.companyId : user?.employId;
      const company = await Company.findById(companyId);

      await Company.findByIdAndUpdate(
        companyId,
        {
          attachmentsSize: +company?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );
      await User.findByIdAndUpdate(
        req.user,
        {
          attachmentsSize: +user?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );

      return res.json({
        success: true,
        message: 'File Uploaded Successfully!',
        task,
      });
    } else if (
      req.file.mimetype === 'image/png' ||
      req.file.mimetype === 'image/jpeg' ||
      req.file.mimetype === 'image/gif'
    ) {
      const task = await Task.findByIdAndUpdate(
        taskId,
        { $push: { imagePath: req.file.location } },
        { useFindAndModify: false },
      );

      if (!task) {
        return res.json({ success: false, message: 'Image failed to save!' });
      }

      const user = await User.findById(req.user);
      const companyId = user?.companyId ? user.companyId : user?.employId;
      const company = await Company.findById(companyId);

      await Company.findByIdAndUpdate(
        companyId,
        {
          attachmentsSize: +company?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );
      await User.findByIdAndUpdate(
        req.user,
        {
          attachmentsSize: +user?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );

      return res.json({
        success: true,
        message: 'Image Uploaded Successfully!',
        task,
      });
    } else if (
      req.file.mimetype === 'video/mp4' ||
      req.file.mimetype === 'video/x-m4v'
    ) {
      const task = await Task.findByIdAndUpdate(
        taskId,
        { $push: { videoPath: req.file.location } },
        { useFindAndModify: false },
      );

      if (!task) {
        return res.json({ success: false, message: 'Video failed to save!' });
      }

      const user = await User.findById(req.user);
      const companyId = user?.companyId ? user.companyId : user?.employId;
      const company = await Company.findById(companyId);

      await Company.findByIdAndUpdate(
        companyId,
        {
          attachmentsSize: +company?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );
      await User.findByIdAndUpdate(
        req.user,
        {
          attachmentsSize: +user?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );

      return res.json({
        success: true,
        message: 'Video Uploaded Successfully!',
        task,
      });
    } else {
      return res.json({
        success: false,
        message: 'Select a file of correct format!',
      });
    }
  });
});

router.post('/uploadtodolistattachment', auth, async (req, res, next) => {
  const { todoId } = req.query;
  const user = await User.findById(req.user).populate('employId companyId');
  const todo = await TodoList.findById(todoId);
  const uploadSingle = s3UploadFile(
    'biztruc',
    user?.companyId?._id ? user.companyId._id : user?.employId?._id,
    user?._id,
    'todo',
    null,
    todo?._id,
    null,
    null,
    null,
  ).single('file');

  uploadSingle(req, res, async (err) => {
    if (err) return res.json({ success: false, message: err.message });

    const fileType = req.file.originalname.split('.')[1];

    if (
      fileType === 'pdf' ||
      fileType === 'pptx' ||
      fileType === 'ppt' ||
      fileType === 'doc' ||
      fileType === 'docx' ||
      fileType === 'xlsx' ||
      fileType === 'xls'
    ) {
      const todoListItem = await TodoList.findByIdAndUpdate(
        todoId,
        { $push: { filePath: req.file.location } },
        { useFindAndModify: false },
      );

      if (!todoListItem) {
        return res.json({ success: false, message: 'File failed to save!' });
      }

      const user = await User.findById(req.user);
      const companyId = user?.companyId ? user.companyId : user?.employId;
      const company = await Company.findById(companyId);

      await Company.findByIdAndUpdate(
        companyId,
        {
          attachmentsSize: +company?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );
      await User.findByIdAndUpdate(
        req.user,
        {
          attachmentsSize: +user?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );

      return res.json({
        success: true,
        message: 'File Uploaded Successfully!',
        todoListItem,
      });
    } else if (
      req.file.mimetype === 'image/png' ||
      req.file.mimetype === 'image/jpeg' ||
      req.file.mimetype === 'image/gif'
    ) {
      const todoListItem = await TodoList.findByIdAndUpdate(
        todoId,
        { $push: { imagePath: req.file.location } },
        { useFindAndModify: false },
      );

      if (!todoListItem) {
        return res.json({ success: false, message: 'Image failed to save!' });
      }

      const user = await User.findById(req.user);
      await User.findByIdAndUpdate(
        req.user,
        {
          attachmentsSize: +user?.attachmentsSize + +req.file.size,
        },
        { new: true, useFindAndModify: false },
      );

      return res.json({
        success: true,
        message: 'Image Uploaded Successfully!',
        todoListItem,
      });
    } else {
      return res.json({
        success: false,
        message: 'Select a file of correct format!',
      });
    }
  });
});

router.delete('/deletearchivedattachment', auth, async (req, res, next) => {
  const { url, cardId } = req.query;
  const user = await User.findById(req.user).populate('employId companyId');
  const card = await Card.findById(cardId).populate('boardId');
  const company = user?.companyId ? user.companyId : user?.employId;
  const imagePath = url.split('/');
  const attachmentUrl = company
    ? `companies/${company._id}/users/${user._id}/boards/${
        card.boardId._id
      }/cards/${cardId}/${imagePath[imagePath.length - 1]}`
    : `users/${user._id}/boards/${card.boardId._id}/cards/${cardId}/${
        imagePath[imagePath.length - 1]
      }`;

  s3DeleteFile('biztruc', attachmentUrl);
});

router.delete('/deletetodoattachment', auth, async (req, res, next) => {
  const { todoId } = req.query;
  const user = await User.findById(req.user).populate('employId companyId');
  const company = user?.companyId ? user.companyId : user?.employId;
  const attachmentUrl = company
    ? `companies/${company._id}/users/${user._id}/todos/${todoId}`
    : `users/${user._id}/todos/${todoId}`;

  s3DeleteFolder('biztruc', attachmentUrl);
});

router.delete('/deletecardattachment', auth, async (req, res, next) => {
  const { type, cardId, boardId } = req.query;

  if (type === 'card') {
    const user = await User.findById(req.user).populate('employId companyId');
    const company = user?.companyId ? user.companyId : user?.employId;
    const attachmentUrl = company
      ? `companies/${company._id}/users/${user._id}/boards/${boardId}/cards/${cardId}`
      : `users/${user._id}/boards/${boardId}/cards/${cardId}`;

    s3DeleteFolder('biztruc', attachmentUrl);
  } else {
    const user = await User.findById(req.user).populate('employId companyId');
    const company = user?.companyId ? user.companyId : user?.employId;
    const cards = await Card.find({ listId: cardId });

    cards.map((card) => {
      const attachmentUrl = company
        ? `companies/${company._id}/users/${user._id}/boards/${boardId}/cards/${card._id}`
        : `users/${user._id}/boards/${boardId}/cards/${card._id}`;

      s3DeleteFolder('biztruc', attachmentUrl);
    });
  }
});

router.delete('/deleteuserattachment', auth, async (req, res, next) => {
  const { userId, companyId } = req.query;
  const attachmentUrl = companyId
    ? `companies/${companyId}/users/${userId}`
    : `users/${userId}`;

  s3DeleteFolder('biztruc', attachmentUrl);
});

router.delete('/deletecompanyattachment', auth, async (req, res, next) => {
  const { companyId } = req.query;
  const attachmentUrl = `companies/${companyId}`;

  s3DeleteFolder('biztruc', attachmentUrl);
});

router.delete('/deleteboardattachment', auth, async (req, res, next) => {
  const { boardId } = req.query;
  const user = await User.findById(req.user).populate('employId companyId');
  const company = user?.companyId ? user.companyId : user?.employId;
  const attachmentUrl = company
    ? `companies/${company._id}/users/${user._id}/boards/${boardId}`
    : `users/${user._id}/boards/${boardId}`;

  s3DeleteFolder('biztruc', attachmentUrl);
});

router.delete('/deletetaskattachment', auth, async (req, res, next) => {
  const { taskId, boardId, cardId } = req.query;
  const user = await User.findById(req.user).populate('employId companyId');
  const company = user?.companyId ? user.companyId : user?.employId;
  let attachmentUrl = '';

  if (boardId && boardId != 'null' && cardId && cardId != 'null') {
    attachmentUrl = `companies/${company._id}/users/${user._id}/boards/${boardId}/cards/${cardId}/tasks/${taskId}`;
  } else {
    attachmentUrl = `companies/${company._id}/users/${user._id}/tasks/${taskId}`;
  }

  s3DeleteFolder('biztruc', attachmentUrl);
});

router.delete('/removecardattachment/:id', auth, async (req, res, next) => {
  try {
    const { type, url } = req.query;
    const { id } = req.params;

    if (type === 'image') {
      const card = await Card.findByIdAndUpdate(
        id,
        { $pull: { imagePath: url } },
        { useFindAndModify: false },
      );

      if (!card) {
        return res.json({
          success: false,
          message: 'Image could not be deleted!',
        });
      }

      res.json({
        success: true,
        message: 'Image archived!',
        card,
      });
    } else if (type === 'video') {
      const card = await Card.findByIdAndUpdate(
        id,
        { $pull: { videoPath: url } },
        { useFindAndModify: false },
      );

      if (!card) {
        return res.json({
          success: false,
          message: 'Video could not be deleted!',
        });
      }

      res.json({
        success: true,
        message: 'Video archived!',
        card,
      });
    } else {
      const card = await Card.findByIdAndUpdate(
        id,
        { $pull: { filePath: url } },
        { useFindAndModify: false },
      );

      if (!card) {
        return res.json({
          success: false,
          message: 'File could not be deleted!',
        });
      }

      res.json({
        success: true,
        message: 'File archived!',
        card,
      });
    }
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'Could not be deleted!' });
  }
});

router.put('/uploadboardpicture/:id', auth, async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(req.user).populate('employId companyId');
  const board = await Board.findById(id);
  const uploadSingle = s3UploadFile(
    'biztruc',
    user?.companyId?._id ? user.companyId._id : user?.employId?._id,
    user?._id,
    'board',
    board?._id,
    null,
    null,
    null,
    null,
  ).single('file');

  if (board?.image?.full) {
    const company = user?.companyId ? user.companyId : user?.employId;
    const imagePath = board.image.full.split('/');
    let attachmentUrl = '';

    attachmentUrl = company
      ? `companies/${company._id}/users/${user._id}/boards/${board._id}/${
          imagePath[imagePath.length - 1]
        }`
      : `users/${user._id}/boards/${board._id}/${
          imagePath[imagePath.length - 1]
        }`;

    s3DeleteFile('biztruc', attachmentUrl);
  }

  uploadSingle(req, res, async (err) => {
    if (err) return res.json({ success: false, message: err.message });

    let board = '';

    if (
      req.file.mimetype === 'image/png' ||
      req.file.mimetype === 'image/jpeg' ||
      req.file.mimetype === 'image/gif'
    ) {
      board = await Board.findByIdAndUpdate(
        id,
        { image: { full: req.file.location, thumb: '', color: '' } },
        { useFindAndModify: false },
      );
    } else {
      return res.json({
        success: false,
        message: 'Select a file of correct format!',
      });
    }

    if (!board) {
      return res.json({ success: false, message: 'Image save failed!' });
    }

    const user = await User.findById(req.user);
    const companyId = user?.companyId ? user.companyId : user?.employId;
    const company = await Company.findById(companyId);

    await Company.findByIdAndUpdate(
      companyId,
      {
        attachmentsSize: +company?.attachmentsSize + +req.file.size,
      },
      { new: true, useFindAndModify: false },
    );
    await User.findByIdAndUpdate(
      req.user,
      {
        attachmentsSize: +user?.attachmentsSize + +req.file.size,
      },
      { new: true, useFindAndModify: false },
    );

    res.json({
      success: true,
      message: 'Image Uploaded Successfully!',
      board,
    });
  });
});

// router.post('/uploadprofilepicture', auth, async (req, res) => {
//   try {
//     if (req.files === null) {
//       return res.json({ msg: 'Choose a file first!' });
//     }

//     const file = req.files.file,
//       { userId } = req.query,
//       extension = path.extname(file.name),
//       fileName = uniqid();

//     await mkdirp(`../frontend/public/uploads/${userId}/profile`);

//     if (file.mimetype === 'image/png' && file.mimetype === 'image/jpeg') {
//       return res.json({
//         success: false,
//         message: 'Select a file of correct format!',
//       });
//     }

//     file.mv(
//       `../frontend/public/uploads/${userId}/profile/${fileName + extension}`,
//       async (err) => {
//         // file.mv(`D:/projects/V1/frontend/public/files/${file.name}`, (err) => {
//         if (err) {
//           console.error(err);

//           return res.json({
//             success: false,
//             message: 'Image could not be uploaded!',
//           });
//         }

//         res.json({
//           success: true,
//           message: 'Image Uploaded Successfully!',
//           imageName: fileName + extension,
//         });
//       },
//     );
//   } catch (error) {
//     console.log(error);

//     res.json({
//       success: false,
//       message: 'An error occurred!',
//     });
//   }
// });

// router.post('/uploadcardattachment/:id', auth, async (req, res) => {
//   try {
//     if (req.files === null) {
//       return res.json({ msg: 'Choose a file first!' });
//     }

//     const file = req.files.file,
//       { userId } = req.query,
//       extension = path.extname(file.name),
//       fileName = uniqid();

//     await mkdirp(`../frontend/public/uploads/${userId}/card`);

//     if (
//       !file.mimetype === 'application/pdf' &&
//       !file.mimetype === 'application/msword' &&
//       !file.mimetype ===
//         'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
//       !file.mimetype === 'image/png' &&
//       !file.mimetype === 'image/jpeg' &&
//       !file.mimetype === 'image/gif' &&
//       !file.mimetype === 'video/mp4' &&
//       !file.mimetype === 'video/x-m4v'
//     ) {
//       return res.json({
//         success: false,
//         message: 'Select a file of correct format!',
//       });
//     }

//     file.mv(
//       `../frontend/public/uploads/${userId}/card/${fileName + extension}`,
//       async (err) => {
//         if (err) {
//           console.error(err);

//           return res.json({ success: false, message: 'An error occurred!' });
//         }

//         const { id } = req.params;
//         let card = '';

//         if (
//           file.mimetype === 'application/pdf' ||
//           file.mimetype === 'application/msword' ||
//           file.mimetype ===
//             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
//         ) {
//           card = await Card.findByIdAndUpdate(
//             id,
//             { filePath: fileName + extension },
//             { useFindAndModify: false },
//           );
//         } else if (
//           file.mimetype === 'image/png' ||
//           file.mimetype === 'image/jpeg' ||
//           file.mimetype === 'image/gif'
//         ) {
//           card = await Card.findByIdAndUpdate(
//             id,
//             { imagePath: fileName + extension },
//             { useFindAndModify: false },
//           );
//         } else if (
//           file.mimetype === 'video/mp4' ||
//           file.mimetype === 'video/x-m4v'
//         ) {
//           card = await Card.findByIdAndUpdate(
//             id,
//             { videoPath: fileName + extension },
//             { useFindAndModify: false },
//           );
//         } else {
//           return res.json({
//             success: false,
//             message: 'Select a file of correct format!',
//           });
//         }

//         if (!card) {
//           return res.json({ success: false, message: 'Image failed to save!' });
//         }

//         res.json({
//           success: true,
//           message: 'Image Uploaded Successfully!',
//           card,
//         });
//       },
//     );
//   } catch (error) {
//     console.log(error);

//     res.json({
//       success: false,
//       message: 'An error occurred!',
//     });
//   }
// });

// router.post('/uploadboardpicture/:id', auth, async (req, res) => {
//   try {
//     if (req.files === null) {
//       return res.json({ msg: 'No file uploaded' });
//     }

//     const file = req.files.file,
//       { userId } = req.query,
//       extension = path.extname(file.name),
//       fileName = uniqid();

//     await mkdirp(`../frontend/public/uploads/${userId}/board`);

//     if (!file.mimetype === 'image/png' && !file.mimetype === 'image/jpeg') {
//       return res.json({
//         success: false,
//         message: 'Select a file of correct format!',
//       });
//     }

//     file.mv(
//       `../frontend/public/uploads/${userId}/board/${fileName + extension}`,
//       async (err) => {
//         if (err) {
//           console.error(err);

//           return res.json({ success: false, message: 'An error occurred!' });
//         }

//         const { id } = req.params;
//         let board = '';

//         board = await Board.findByIdAndUpdate(
//           id,
//           { image: { full: fileName + extension, thumb: '', color: '' } },
//           { useFindAndModify: false },
//         );

//         if (!board) {
//           return res.json({ success: false, message: 'Image save failed!' });
//         }

//         res.json({
//           success: true,
//           message: 'Image Uploaded Successfully!',
//           board,
//         });
//       },
//     );
//   } catch (error) {
//     console.log(error);

//     res.json({
//       success: false,
//       message: 'An error occurred!',
//     });
//   }
// });

// router.post('/uploadcardattachment/:id', [auth, upload.single('file')], async (req, res) => {
//   if (req.file === undefined) return res.send('you must select a file.');

//   const path = `http://localhost:3000/file/${req.file.filename}`,
//     id = req.params.id;
//   let card = '';

//   if (
//     req.file.contentType === 'application/pdf' ||
//     req.file.contentType === 'application/msword' ||
//     req.file.contentType ===
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
//   ) {
//     card = await Card.findByIdAndUpdate(
//       id,
//       { filePath: path },
//       { useFindAndModify: false },
//     );
//   } else if (
//     req.file.contentType === 'image/png' ||
//     req.file.contentType === 'image/jpeg' ||
//     req.file.contentType === 'image/gif'
//   ) {
//     card = await Card.findByIdAndUpdate(
//       id,
//       { imagePath: path },
//       { useFindAndModify: false },
//     );
//   } else if (
//     req.file.contentType === 'video/mp4' ||
//     req.file.contentType === 'video/x-m4v'
//   ) {
//     card = await Card.findByIdAndUpdate(
//       id,
//       { videoPath: path },
//       { useFindAndModify: false },
//     );
//   } else {
//     return res.json({
//       success: false,
//       message: 'Select a file of correct format!',
//       fileType: req.file,
//     });
//   }

//   if (!card) {
//     return res.json({ success: false, message: 'Image save failed!' });
//   }

//   return res.json({
//     success: true,
//     message: 'Image Uploaded Successfully!',
//     path,
//   });
// });

// router.post(
//   '/uploadboardpicture/:id',
//   [auth, upload.single('file')],
//   async (req, res) => {
//     if (req.file === undefined)
//       return res.json({ message: 'You must select a file!' });

//     const path = `http://localhost:3000/file/${req.file.filename}`,
//       id = req.params.id;
//     let board = '';

//     if (
//       req.file.contentType === 'image/png' ||
//       req.file.contentType === 'image/jpeg'
//     ) {
//       board = await Board.findByIdAndUpdate(
//         id,
//         { image: { full: path, thumb: '', color: '' } },
//         { useFindAndModify: false },
//       );
//     } else {
//       return res.json({
//         success: false,
//         message: 'Select a file of correct format!',
//         fileType: req.file,
//       });
//     }

//     if (!board) {
//       return res.json({ success: false, message: 'Image save failed!' });
//     }

//     return res.json({
//       success: true,
//       message: 'Image Uploaded Successfully!',
//       path,
//     });
//   },
// );

// router.post(
//   '/uploadprofilepicture',
//   [auth, upload.single('file')],
//   async (req, res) => {
//     if (req.file === undefined) return res.send('you must select a file.');

//     try {
//       const path = `http://localhost:3000/file/${req.file.filename}`;

//       if (
//         req.file.contentType === 'image/png' ||
//         req.file.contentType === 'image/jpeg'
//       ) {
//         return res.json({
//           success: true,
//           message: 'Image Uploaded Successfully!',
//           path,
//         });
//       }

//       res.json({
//         success: false,
//         message: 'Select a file of correct format!',
//         fileType: req.file,
//       });
//     } catch (error) {
//       console.log(error);
//     }
//   },
// );

// router.get('/:filename', async (req, res) => {
//   try {
//     const file = await gfs.files.findOne({ filename: req.params.filename });
//     const readStream = gfs.createReadStream(file.filename);
//     readStream.pipe(res);
//   } catch (error) {
//     res.send('not found');
//   }
// });

// router.delete('/:filename', async (req, res) => {
//   try {
//     await gfs.files.deleteOne({ filename: req.params.filename });
//     res.send('success');
//   } catch (error) {
//     console.log(error);
//     res.send('An error occured.');
//   }
// });

module.exports = router;
