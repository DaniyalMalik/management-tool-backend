const express = require('express');
const User = require('../models/User');
const Board = require('../models/Board');
const List = require('../models/List');
const TodoList = require('../models/TodoList');
const Card = require('../models/Card');
const Task = require('../models/Task');
const PieChart = require('../models/PieChartData');
const Meeting = require('../models/Meeting');
const Archive = require('../models/Archive');
const Comment = require('../models/Comment');
const Company = require('../models/Company');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth } = require('../middlewares/auth');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');

// register a new user
router.post('/register', async (req, res, next) => {
  try {
    const { password, passwordCheck, firstName, email, lastName, employId } =
      req.body;

    if (employId) {
      try {
        const company = await Company.findById(employId);

        if (!company) {
          return res.json({
            success: false,
            message: 'No such company available in the database!',
          });
        }

        if (company?.locked) {
          return res.json({
            success: false,
            message: 'No such company available in the database!',
          });
        }

        let users = await User.find({ employId });
        const owner = await User.find({ companyId: employId });

        users.push(owner);

        if (company?.subscription === 'Bronze' && users.length === 15) {
          return res.json({
            success: false,
            message: 'No such company available in the database!',
          });
        } else if (company?.subscription === 'Silver' && users.length === 50) {
          return res.json({
            success: false,
            message: 'No such company available in the database!',
          });
        }
      } catch (error) {
        return res.json({
          success: false,
          message: 'No such company available in the database!',
        });
      }
    }

    if (!password || !passwordCheck || !firstName || !email || !lastName)
      return res.json({
        success: false,
        message: "Enter all fields' values!",
      });

    if (password.length < 6) {
      return res.json({
        success: false,
        message: 'Password is too short!',
      });
    }

    if (password != passwordCheck)
      return res.json({ success: false, message: 'Passwords do not match!' });

    const existingUser = await User.findOne({ email });

    if (existingUser)
      return res.json({
        success: false,
        message: 'Email ID already exists!',
      });

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = new User({
      password: passwordHash,
      email,
      registeredAt: new Date().toLocaleDateString(),
      lastName,
      employId: employId && employId,
      firstName,
    });
    const response = await newUser.save();

    req.io.sockets.emit('users', response.email);

    res.json({
      message: 'User Registered!',
      success: true,
      user: response,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'An error occurred!',
    });

    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  try {
    if (!email || !password)
      return res.json({
        success: false,
        message: 'Enter all fields!',
      });

    const user = await User.findOne({ email }).select(
      'firstName lastName email phoneNumber imagePath employId companyId password emailVerified registeredAt createdAt updatedAt emailVerifyExpire emailVerifyToken subscribed',
    );

    if (user?.employId) {
      const company = await Company.findById(user?.employId);

      if (company?.locked) {
        return res.json({
          success: false,
          message: 'Your account is blocked!',
        });
      }
    } else if (user?.companyId) {
      const company = await Company.findById(user?.companyId);

      if (company?.locked) {
        return res.json({
          success: false,
          message: 'Your account is blocked!',
        });
      }
    }

    if (!user)
      return res.json({ success: false, message: 'User does not exist!' });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.json({ success: false, message: 'Invalid Credentials!' });

    const token = jwt.sign({ id: user._id }, process.env.secretKey);

    res.json({
      success: true,
      message: 'Logged In!',
      user,
      token,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'An error occurred!',
    });

    next(error);
  }
});

router.post('/tokenIsValid', auth, async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');

    if (!token) return res.json(false);

    const verified = jwt.verify(token, process.env.secretKey);

    if (!verified) return res.json(false);

    const user = await User.findById(verified.id);

    if (!user) return res.json(false);

    res.json(true);
  } catch (error) {
    console.log(error);

    next(error);
  }
});

router.get('/', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user).populate('employId companyId');

    if (!user) return res.json({ success: false, message: 'User not found!' });

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

router.get('/today', auth, async (req, res, next) => {
  try {
    const { date } = req.query;
    const users = await User.find({ registeredAt: date }).populate(
      'employId companyId',
    );

    if (!users)
      return res.json({ success: false, message: 'No users were found!' });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

router.get('/users', auth, async (req, res, next) => {
  try {
    const users = await User.find().populate('employId companyId');

    if (!users)
      return res.json({ success: false, message: 'No users were found!' });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

router.get('/getbyemployid', auth, async (req, res, next) => {
  try {
    const { employId } = req.query;
    let users = await User.find({ employId });
    const owner = await User.findOne({ companyId: employId });

    users.push(owner);

    if (!users.length === 0)
      return res.json({ success: false, message: 'No users were found!' });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

router.get('/getcompanyuserscount', auth, async (req, res, next) => {
  try {
    const { employId } = req.query;
    let users = await User.find({ employId });
    const owner = await User.findOne({ companyId: employId });

    users.push(owner);

    if (users.length === 0)
      return res.json({ success: false, message: 'No users were found!' });

    res.json({
      success: true,
      usersCount: users.length,
    });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'No users were found!' });

    next(error);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate('employId companyId');

    if (!user) return res.json({ success: false, message: 'User not found!' });

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'User not found!' });

    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    const employId = user?.companyId;
    const employeeId = user?.employId;
    console.log(user, 'user');
    console.log(id, 'id');
    console.log(employId, 'employId');
    console.log(employeeId, 'employeeId');
    if (!user)
      return res.json({ success: false, message: 'User cannot be deleted!' });
    console.log('here1');
    if (employId) {
      console.log(employId, 'employId');
      const company = await Company.findByIdAndDelete(employId);

      if (!company) {
        return res.json({
          success: false,
          message: 'Company cannot be deleted!',
        });
      }

      const users = await User.deleteMany({
        employId: employId,
      });
      console.log(users, 'users');
      if (!users) {
        return res.json({
          success: false,
          message: 'Company users not found!',
        });
      }

      const archives = await Archive.deleteMany({
        userId: id,
      });

      if (!archives)
        res.json({
          success: false,
          message: 'Data in archive not found!',
        });

      const comments = await Comment.deleteMany({
        from: id,
      });

      if (!comments)
        res.json({
          success: false,
          message: 'Comments not found!',
        });

      let boards = await Board.find({
        user: { $elemMatch: { userId: id, role: 'Admin' } },
      });
      console.log(boards, 'boards');
      if (!boards) res.json({ success: false, message: 'Boards not found!' });

      boards.forEach(async (b) => {
        await Board.findByIdAndDelete(b._id);
      });

      boards = await Board.find({
        user: { $elemMatch: { userId: id } },
      });

      boards.forEach(async (b) => {
        const board = await Board.findById(b._id);

        let array = [];

        array = board.user.filter((boardUser) => boardUser.userId != id);

        const response = await Board.findByIdAndUpdate(
          b._id,
          { user: array },
          { useFindAndModify: false },
        );

        if (!response)
          res.json({
            success: false,
            message: 'Board cannot be updated!',
          });
      });

      let lists = await List.find({
        user: { $elemMatch: { userId: id, role: 'Admin' } },
      });

      if (!lists) res.json({ success: false, message: 'Lists not found!' });

      lists.forEach(async (l) => {
        await List.findByIdAndDelete(l._id);
      });

      lists = await List.find({
        user: { $elemMatch: { userId: id } },
      });

      lists.forEach(async (l) => {
        const list = await List.findById(l._id);

        let array = [];

        array = list.user.filter((listUser) => listUser.userId != id);

        const response = await List.findByIdAndUpdate(
          l._id,
          { user: array },
          { useFindAndModify: false },
        );

        if (!response)
          res.json({
            success: false,
            message: 'List cannot be updated!',
          });
      });

      let cards = await Card.find({
        user: { $elemMatch: { userId: id, role: 'Admin' } },
      });

      if (!cards) res.json({ success: false, message: 'Cards not found!' });

      cards.forEach(async (c) => {
        await Card.findByIdAndDelete(c._id);
      });

      cards = await Card.find({
        user: { $elemMatch: { userId: id } },
      });

      cards.forEach(async (c) => {
        const card = await Card.findById(c._id);

        await PieChart.deleteOne({ cardId: c._id });

        let array = [];

        array = card.user.filter((cardUser) => cardUser.userId != id);

        const response = await Card.findByIdAndUpdate(
          c._id,
          { user: array },
          { useFindAndModify: false },
        );

        if (!response)
          res.json({
            success: false,
            message: 'Card cannot be updated!',
          });
      });

      let tasks = await Task.find({
        user: { $elemMatch: { userId: id, role: 'Admin' } },
      });

      if (!tasks) res.json({ success: false, message: 'Tasks not found!' });

      tasks.forEach(async (t) => {
        await Task.findByIdAndDelete(t._id);
      });

      tasks = await Task.find({
        user: { $elemMatch: { userId: id } },
      });

      tasks.forEach(async (t) => {
        const task = await Task.findById(t._id);
        let array = [];

        array = task.user.filter((taskUser) => taskUser.userId != id);

        const response = await Task.findByIdAndUpdate(
          t._id,
          { user: array },
          { useFindAndModify: false },
        );

        if (!response)
          res.json({
            success: false,
            message: 'Task cannot be updated!',
          });
      });

      let meetings = await Meeting.find({
        user: { $elemMatch: { userId: id, role: 'Admin' } },
      });

      if (!meetings)
        res.json({ success: false, message: 'Meetings not found!' });

      meetings.forEach(async (m) => {
        await Meeting.findByIdAndDelete(m._id);
      });

      meetings = await Meeting.find({
        user: { $elemMatch: { userId: id } },
      });

      meetings.forEach(async (m) => {
        const meeting = await Meeting.findById(m._id);

        let array = [];

        array = meeting.user.filter((meetingUser) => meetingUser.userId != id);

        const response = await Meeting.findByIdAndUpdate(
          m._id,
          { user: array },
          { useFindAndModify: false },
        );

        if (!response)
          res.json({
            success: false,
            message: 'Meeting cannot be updated!',
          });
      });

      const todos = await TodoList.deleteMany({ userId: user?._id });

      if (!todos) {
        res.json({ success: false, message: 'Todos not found!' });
      }
    } else if (employeeId) {
      console.log(employeeId, 'employeeId');

      const archives = await Archive.deleteMany({
        userId: id,
      });

      if (!archives)
        res.json({
          success: false,
          message: 'Data in archive not found!',
        });

      const comments = await Comment.deleteMany({
        from: id,
      });

      if (!comments)
        res.json({
          success: false,
          message: 'Comments not found!',
        });

      let boards = await Board.find({
        user: { $elemMatch: { userId: id, role: 'Admin' } },
      });
      console.log(boards, 'boards');
      if (!boards) res.json({ success: false, message: 'Boards not found!' });

      boards.forEach(async (b) => {
        await Board.findByIdAndDelete(b._id);
      });

      boards = await Board.find({
        user: { $elemMatch: { userId: id } },
      });

      boards.forEach(async (b) => {
        const board = await Board.findById(b._id);

        let array = [];

        array = board.user.filter((boardUser) => boardUser.userId != id);

        const response = await Board.findByIdAndUpdate(
          b._id,
          { user: array },
          { useFindAndModify: false },
        );

        if (!response)
          res.json({
            success: false,
            message: 'Board cannot be updated!',
          });
      });

      let lists = await List.find({
        user: { $elemMatch: { userId: id, role: 'Admin' } },
      });

      if (!lists) res.json({ success: false, message: 'Lists not found!' });

      lists.forEach(async (l) => {
        await List.findByIdAndDelete(l._id);
      });

      lists = await List.find({
        user: { $elemMatch: { userId: id } },
      });

      lists.forEach(async (l) => {
        const list = await List.findById(l._id);

        let array = [];

        array = list.user.filter((listUser) => listUser.userId != id);

        const response = await List.findByIdAndUpdate(
          l._id,
          { user: array },
          { useFindAndModify: false },
        );

        if (!response)
          res.json({
            success: false,
            message: 'List cannot be updated!',
          });
      });

      let cards = await Card.find({
        user: { $elemMatch: { userId: id, role: 'Admin' } },
      });

      if (!cards) res.json({ success: false, message: 'Cards not found!' });

      cards.forEach(async (c) => {
        await Card.findByIdAndDelete(c._id);
      });

      cards = await Card.find({
        user: { $elemMatch: { userId: id } },
      });

      cards.forEach(async (c) => {
        const card = await Card.findById(c._id);

        await PieChart.deleteOne({ cardId: c._id });

        let array = [];

        array = card.user.filter((cardUser) => cardUser.userId != id);

        const response = await Card.findByIdAndUpdate(
          c._id,
          { user: array },
          { useFindAndModify: false },
        );

        if (!response)
          res.json({
            success: false,
            message: 'Card cannot be updated!',
          });
      });

      let tasks = await Task.find({
        user: { $elemMatch: { userId: id, role: 'Admin' } },
      });

      if (!tasks) res.json({ success: false, message: 'Tasks not found!' });

      tasks.forEach(async (t) => {
        await Task.findByIdAndDelete(t._id);
      });

      tasks = await Task.find({
        user: { $elemMatch: { userId: id } },
      });

      tasks.forEach(async (t) => {
        const task = await Task.findById(t._id);
        let array = [];

        array = task.user.filter((taskUser) => taskUser.userId != id);

        const response = await Task.findByIdAndUpdate(
          t._id,
          { user: array },
          { useFindAndModify: false },
        );

        if (!response)
          res.json({
            success: false,
            message: 'Task cannot be updated!',
          });
      });

      let meetings = await Meeting.find({
        user: { $elemMatch: { userId: id, role: 'Admin' } },
      });

      if (!meetings)
        res.json({ success: false, message: 'Meetings not found!' });

      meetings.forEach(async (m) => {
        await Meeting.findByIdAndDelete(m._id);
      });

      meetings = await Meeting.find({
        user: { $elemMatch: { userId: id } },
      });

      meetings.forEach(async (m) => {
        const meeting = await Meeting.findById(m._id);

        let array = [];

        array = meeting.user.filter((meetingUser) => meetingUser.userId != id);

        const response = await Meeting.findByIdAndUpdate(
          m._id,
          { user: array },
          { useFindAndModify: false },
        );

        if (!response)
          res.json({
            success: false,
            message: 'Meeting cannot be updated!',
          });
      });

      const todos = await TodoList.deleteMany({ userId: user?._id });

      if (!todos) {
        res.json({ success: false, message: 'Todos not found!' });
      }
    } else {
      console.log(employeeId, 'no employeeId');
      const archives = await Archive.deleteMany({
        userId: id,
      });

      if (!archives)
        res.json({
          success: false,
          message: 'Data in archive not found!',
        });

      const comments = await Comment.deleteMany({
        from: id,
      });
      console.log(comments, 'comments');
      if (!comments)
        res.json({
          success: false,
          message: 'Comments not found!',
        });

      const boards = await Board.find({
        user: { $elemMatch: { userId: id } },
      });

      if (!boards) res.json({ success: false, message: 'Boards not found!' });

      boards.forEach(async (b) => {
        await Board.findByIdAndDelete(b._id);
      });

      const lists = await List.find({
        user: { $elemMatch: { userId: id } },
      });

      if (!lists) res.json({ success: false, message: 'Lists not found!' });

      lists.forEach(async (l) => {
        await List.findByIdAndDelete(l._id);
      });

      const cards = await Card.find({
        user: { $elemMatch: { userId: id } },
      });

      if (!cards) res.json({ success: false, message: 'Cards not found!' });

      cards.forEach(async (c) => {
        await Card.findByIdAndDelete(c._id);
        await PieChart.deleteOne({ cardId: c._id });
      });

      const todos = await TodoList.deleteMany({ userId: user?._id });

      if (!todos) {
        res.json({ success: false, message: 'Todos not found!' });
      }
    }
    console.log('here2');
    res.json({
      success: true,
      user,
      message: 'User deleted!',
    });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'An error occurred!' });

    next(error);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  const { id } = req.params,
    updUser = req.body;

  try {
    const user = await User.findByIdAndUpdate(id, updUser, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }).populate('companyId employId');

    if (!user) {
      return res.json({
        success: false,
        message: 'User not found!',
      });
    }

    res.json({ success: true, message: 'User Updated!', user });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'User not found!',
    });
  }
});

router.put('/updatepassword/:id', auth, async (req, res, next) => {
  const { id } = req.params,
    updUser = req.body;
  try {
    const oldUser = await User.findById(id).select('password');
    const isMatch = await bcrypt.compare(updUser.oldPassword, oldUser.password);

    if (!isMatch)
      return res.json({
        success: false,
        message: 'Old password is incorrect!',
      });

    if (updUser.password != updUser.passwordCheck)
      return res.json({ success: false, message: 'Passwords not matched' });

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(updUser.password, salt);
    const user = await User.findByIdAndUpdate(
      id,
      { password: passwordHash },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      },
    );

    if (!user) {
      return res.json({
        success: false,
        message: 'An error occurred!',
      });
    }

    res.json({ success: true, message: 'Password Updated!', user });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'An error occurred!',
    });
  }
});

// Forgot Password Token
router.post('/forgotpassword', async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      success: false,
      message: 'User not found!',
    });
  }

  const resetToken = await user.getForgotPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.BASE_URL_FRONTEND}/resetpassword/${resetToken}`;

  try {
    const response = await axios.post(
      `${process.env.BASE_URL_BACKEND}/email/forgotpasswordlink`,
      {
        email: req.body.email,
        resetUrl,
        subject: 'Forgot Password Link',
      },
    );

    res.json({
      success: response.data.success,
      message: response.data.message,
      resetToken,
    });
  } catch (error) {
    console.log(error);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return res.json({
      success: false,
      message: `Email to ${user.email} could not be sent!`,
    });
  }
});

router.post('/getverifyemailtoken', auth, async (req, res, next) => {
  try {
    const { _id, email } = req.body;
    const user = await User.findOne({ _id, email });

    if (!user) {
      return res.json({
        success: false,
        message: 'User not found!',
      });
    }

    const resetToken = await user.getVerifyToken();

    await user.save({ validateBeforeSave: false });

    return res.json({
      success: true,
      resetToken,
    });
  } catch (e) {
    console.log(e);

    res.json({
      success: false,
      message: 'An error occurred!',
    });
  }
});

router.put('/verifyemailtoken/:verifyToken', async (req, res, next) => {
  // router.put('/verifyemailtoken/:verifyToken', auth, async (req, res, next) => {
  try {
    const verifyEmailToken = crypto
      .createHash('sha256')
      .update(req.params.verifyToken)
      .digest('hex');
    const user = await User.findOne({
      emailVerifyToken: verifyEmailToken,
      emailVerifyExpire: { $gt: Date.now() },
    });

    // if (user?._id !== req.user) {
    //   return res.json({ success: false, message: 'Invalid Token!' });
    // }

    if (!user) {
      return res.json({ success: false, message: 'Invalid Token!' });
    }

    user.emailVerified = true;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ success: true, message: 'Email Verified!' });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'An error occurred!' });
  }
});

// Reset Password
router.put('/resetpassword/:forgotPasswordToken', async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.forgotPasswordToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.json({ success: false, message: 'Invalid Token!' });
    }

    if (req.body.newPassword !== req.body.repeatNewPassword) {
      return res.json({ success: false, message: 'Passwords not match!' });
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(req.body.newPassword, salt);

    user.password = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ success: true, message: 'Password Updated!' });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'An error occurred!' });
  }
});

module.exports = router;
