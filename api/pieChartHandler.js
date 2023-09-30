const { Router } = require('express');
const PieChartData = require('../models/PieChartData');
const { auth } = require('../middlewares/auth');
const router = Router();
// const Card = require('../models/Card');

router.post('/', auth, async (req, res, next) => {
  try {
    const { cardId } = req.query;
    const newPieChartData = req.body;
    const checkPieChart = await PieChartData.findOne({ cardId });

    if (!checkPieChart) {
      const pieChartData = await PieChartData.create({
        slices: newPieChartData,
        cardId,
      });
      // await Card.findByIdAndUpdate(
      //   cardId,
      //   {
      //     pieChartId: pieChartData._id,
      //   },
      //   { useFindAndModify: false, new: true },
      // );

      if (!pieChartData) {
        return res.json({
          success: false,
          message: 'Pie chart could not be updated!',
        });
      }

      res.json({
        success: true,
        message: 'Pie chart updated!',
        pieChartData,
      });
    } else {
      const pieChartData = await PieChartData.findByIdAndUpdate(
        { _id: checkPieChart._id },
        { slices: newPieChartData },
        { useFindAndModify: false, new: true },
      );

      if (!pieChartData) {
        return res.json({
          success: false,
          message: 'Pie chart could not be updated!',
        });
      }

      res.json({
        success: true,
        message: 'Pie chart updated!',
        pieChartData,
      });
    }
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'Pie chart data could not be added!',
    });
  }
});

router.get('/:id', auth, async (req, res, next) => {
  const { id } = req.params;
  try {
    const pieChartData = await PieChartData.findOne({ cardId: id });

    if (!pieChartData) {
      return res.json({
        success: false,
        message: 'No data found!',
      });
    }

    res.json({
      success: true,
      pieChartData,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'No data found!',
    });
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  const { id } = req.params;
  try {
    const pieChartData = await PieChartData.findByIdAndDelete(id);

    if (!pieChartData) {
      return res.json({
        success: false,
        message: 'Data of pie chart cannot be deleted!',
      });
    }

    res.json({
      success: true,
      pieChartData,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: 'Data of pie chart cannot be deleted!',
    });
  }
});

module.exports = router;
