const express = require('express');
const User = require('../models/User');
const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const Task = require('../models/Task');
const Meeting = require('../models/Meeting');
const TodoList = require('../models/TodoList');
const Archive = require('../models/Archive');
const Comment = require('../models/Comment');
const Company = require('../models/Company');
const { auth } = require('../middlewares/auth');
const router = express.Router();

router.post('/', auth, async (req, res, next) => {
  try {
    const data = req.body;
    const exists_1 = await User.findById(data.companyOwner);

    if (!exists_1) {
      return res.json({
        success: false,
        message: 'User does not exist!',
      });
    }

    if (exists_1?.employId || exists_1?.companyId) {
      return res.json({
        success: false,
        message: 'You cannot create company!',
      });
    }

    const exists_2 = await Company.findOne({ email: data.email });

    if (exists_2) {
      return res.json({
        success: false,
        message: 'Company already exists!',
      });
    }

    data.registeredAt = new Date().toLocaleDateString();

    const company = await Company.create(data);

    if (!company) {
      return res.json({
        success: false,
        message: 'Company cannot be created!',
      });
    }

    await User.findByIdAndUpdate(
      { _id: data.companyOwner },
      {
        companyId: company._id,
      },
      { useFindAndModify: false },
    );

    res.json({
      success: true,
      message: 'Company created!',
      company,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'Company cannot be created!',
    });
  }
});

router.get('/', auth, async (req, res, next) => {
  try {
    const companies = await Company.find().populate('companyOwner');

    if (!companies) {
      return res.json({ success: false, message: 'No companies were found!' });
    }

    res.json({
      success: true,
      companies,
    });
  } catch (error) {
    console.log(error);

    return res.json({ success: false, message: 'No companies were found!' });
  }
});

router.get('/today', auth, async (req, res, next) => {
  try {
    const { date } = req.query;
    const companies = await Company.find({ registeredAt: date }).populate(
      'companyOwner',
    );

    if (!companies) {
      return res.json({ success: false, message: 'No companies were found!' });
    }

    res.json({
      success: true,
      companies,
    });
  } catch (error) {
    console.log(error);

    return res.json({ success: false, message: 'No companies were found!' });
  }
});

router.get('/companyowner', auth, async (req, res, next) => {
  try {
    const { companyOwner } = req.query;
    const companies = await Company.find({ companyOwner });

    if (!companies) {
      return res.json({ success: false, message: 'No companies were found!' });
    }

    res.json({
      success: true,
      companies,
    });
  } catch (error) {
    console.log(error);

    return res.json({ success: false, message: 'No companies were found!' });
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id).populate('companyOwner');

    if (!company) {
      return res.json({
        success: false,
        message: 'Company not found!',
      });
    }

    res.json({
      success: true,
      message: 'Company found!',
      company,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'Company not found!',
    });
  }
});

router.get('/checkOwner/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyOwner } = req.query;
    const company = await Company.findOne({ _id: id, companyOwner });

    if (!company) {
      return res.json({
        success: false,
        message: 'Not the owner of company!',
        owner: false,
      });
    }

    res.json({
      success: true,
      message: 'Is owner of company!',
      company,
      owner: true,
    });
  } catch (error) {
    console.log(error);

    res.json({
      owner: false,
      success: false,
      message: 'An error occurred!',
    });
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await Company.findByIdAndDelete(id);

    if (!company) {
      return res.json({
        success: false,
        message: 'Company cannot be deleted!',
      });
    }

    let user = await User.findById(company.companyOwner);

    user = await User.findByIdAndUpdate(
      user?._id,
      { companyId: null },
      { useFindAndModify: false },
    );

    if (!user)
      return res.json({
        success: false,
        message: 'User cannot be updated!',
      });

    const users = await User.deleteMany({
      employId: id,
    });
    conole.log(users, 'users');
    if (!users)
      res.json({
        success: false,
        message: 'Users not found!',
      });

    const archives = await Archive.deleteMany({
      companyId: id,
    });
    conole.log(archives, 'archives');

    if (!archives)
      res.json({
        success: false,
        message: 'Data in archive not found!',
      });

    const boards = await Board.deleteMany({
      companyId: id,
    });

    if (!boards)
      res.json({
        success: false,
        message: 'Boards not found!',
      });

    const lists = await List.deleteMany({
      companyId: id,
    });

    if (!lists)
      res.json({
        success: false,
        message: 'Lists not found!',
      });

    const cards = await Card.deleteMany({
      companyId: id,
    });

    if (!cards)
      res.json({
        success: false,
        message: 'Cards not found!',
      });

    const todos = await TodoList.deleteMany({
      companyId: id,
    });

    if (!todos)
      res.json({
        success: false,
        message: 'Todos not found!',
      });

    const tasks = await Task.deleteMany({
      companyId: id,
    });

    if (!tasks)
      res.json({
        success: false,
        message: 'Tasks not found!',
      });

    const comments = await Comment.deleteMany({
      companyId: id,
    });

    if (!comments)
      res.json({
        success: false,
        message: 'Comments not found!',
      });

    const meetings = await Meeting.deleteMany({
      companyId: id,
    });

    if (!meetings)
      res.json({
        success: false,
        message: 'Meetings not found!',
      });

    res.json({
      success: true,
      message: 'Company deleted!',
      company,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'Company cannot be deleted!',
    });
  }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updCompany = req.body;
    const company = await Company.findByIdAndUpdate(id, updCompany, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    if (!company) {
      return res.json({
        success: false,
        message: `Company was not found!`,
      });
    }

    res.json({ company, success: true, message: 'Company updated!' });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: `Company was not found!`,
    });
  }
});

module.exports = router;
