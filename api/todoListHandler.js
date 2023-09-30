const { Router } = require('express');
const TodoList = require('../models/TodoList');
const { auth } = require('../middlewares/auth');
const router = Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const { userId } = req.query;
    const todos = await TodoList.find({ userId })
      .sort('-createdAt')
      .populate('userId');

    if (!todos) {
      return res.json({
        success: false,
        message: 'No todolist items found!',
      });
    }

    res.json({
      success: true,
      todos,
    });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'No todolist items found!' });
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const data = req.body;
    const todo = await TodoList.create({
      ...data,
    });

    if (!todo) {
      return res.json({
        success: false,
        message: 'Todolist item could not be added!',
      });
    }

    res.json({
      success: true,
      message: 'Todolist item added!',
      todo,
    });
  } catch (error) {
    console.log(error);

    res.json({ success: false, message: 'Todolist item could not be added!' });
  }
});

router.get('/:id', auth, async (req, res, next) => {
  const { id } = req.params;
  try {
    const todo = await TodoList.findById(id).populate('userId');

    if (!todo) {
      return res.json({
        success: false,
        message: 'Todolist item could not be found!',
      });
    }

    res.json({
      success: true,
      todo,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'Todolist item could not be found!',
    });
  }
});

router.put('/:id', auth, async (req, res, next) => {
  const { id } = req.params,
    updTodo = req.body;

  try {
    const todo = await TodoList.findByIdAndUpdate(id, updTodo, {
      new: true,
      useFindAndModify: false,
    }).populate('userId');

    if (!todo) {
      return res.json({
        success: false,
        message: 'Todolist item could not be updated!',
      });
    }

    res.json({ success: true, message: 'Todolist item Updated!', todo });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'Todolist item could not be updated!',
    });
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    const todo = await TodoList.findByIdAndDelete(id);

    if (!todo) {
      return res.json({
        success: false,
        message: 'Todolist item could not be deleted!',
      });
    }

    res.json({ success: true, message: 'Todolist item deleted!', todo });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'Todolist item could not be deleted',
    });
  }
});

module.exports = router;
