const { Router } = require('express');
const Task = require('../models/Task');
const { auth } = require('../middlewares/auth');
const router = Router();

// fetch all the task entries from db /api/tasks
router.get('/', auth, async (req, res, next) => {
  try {
    const tasks = await Task.find().populate('cardId');

    if (!tasks) {
      return res.json({
        success: false,
      });
    }

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

router.get('/byUserId', auth, async (req, res, next) => {
  try {
    // const { companyId } = req.query;
    const tasks = await Task.find({
      // companyId,
      user: { $elemMatch: { userId: req.user } },
    })
      .sort('-createdAt')
      .populate({
        path: 'user',
        populate: {
          path: 'userId',
          model: 'user',
        },
      })
      .populate({
        path: 'cardId',
        populate: [
          {
            path: 'boardId',
            model: 'board',
          },
          {
            path: 'listId',
            model: 'list',
          },
        ],
      });

    if (!tasks) {
      return res.json({
        success: false,
        message: `No tasks with the id ${companyId} found!`,
      });
    }

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: `No tasks with the id ${companyId} found!`,
    });

    next(error);
  }
});

// create new task entry
router.post('/', auth, async (req, res, next) => {
  try {
    const newTask = req.body;
    const task = await Task.create(newTask);

    if (!task) {
      return res.json({
        success: false,
        message: 'Task could not be added!',
      });
    }

    res.json({
      success: true,
      message: 'New task added!',
      task,
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: 'Task could not be added!',
    });
  }
});

// get tasks based on card id
router.get('/byCardId/:id', auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    const tasks = await Task.find({ cardId: id })
      .populate({
        path: 'user',
        populate: {
          path: 'userId',
          model: 'user',
        },
      })
      .populate({
        path: 'cardId',
        populate: [
          {
            path: 'boardId',
            model: 'board',
          },
          {
            path: 'listId',
            model: 'list',
          },
        ],
      });

    if (!tasks) {
      return res.json({
        success: false,
        message: 'No tasks found!',
      });
    }

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

// get task based on id
router.get('/:id', auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    const task = await Task.findById(id);

    if (!task) {
      return res.json({
        success: false,
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params,
      updatedData = req.body,
      task = await Task.findByIdAndUpdate(id, updatedData, {
        useFindAndModify: false,
        new: true,
      }).populate({
        path: 'user',
        populate: {
          path: 'userId',
          model: 'user',
        },
      });

    if (!task)
      return res.json({
        success: false,
        message: 'Task could not be updated!',
      });

    res.json({
      message: 'Task updated!',
      success: true,
      task,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

// delete task based on id
router.delete('/:id', auth, async (req, res, next) => {
  const { id } = req.params;

  try {
    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.json({
        success: false,
        message: 'Task could not be deleted!',
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully!',
      task,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'Task could not be deleted!',
    });

    next(error);
  }
});

module.exports = router;
