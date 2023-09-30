const { Router } = require('express');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth } = require('../middlewares/auth');
const router = Router();

router.post('/register', async (req, res, next) => {
  return res.json({
    success: false,
    message: "You are not authorized to acces this api!",
  });

  const { password, passwordCheck, email } = req.body;
  try {
    if (!password || !passwordCheck || !email)
      return res.json({
        success: false,
        message: "Enter all fields' value!",
      });

    if (password.length < 6) {
      return res.json({
        success: false,
        message: 'Password is short!',
      });
    }
    if (password != passwordCheck)
      return res.json({ success: false, message: 'Passwords do not match!' });

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin)
      return res.json({
        success: false,
        message: 'Admin already exists!',
      });

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);
    const newAdmin = await Admin.create({ email, password: passwordHash });

    res.json({
      message: 'Admin Registered!',
      success: true,
      newAdmin,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: `An error occurred!`,
    });
  }
});

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  try {
    if (!email || !password)
      return res.json({
        success: false,
        message: "Enter all fields' value!",
      });

    const admin = await Admin.findOne({ email }).select('email password');

    if (!admin)
      return res.json({ success: false, message: 'Admin does not exist!' });

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch)
      return res.json({ success: false, message: 'Invalid Credentials!' });

    const token = jwt.sign({ id: admin._id }, process.env.secretKey);

    res.json({
      token,
      admin: { _id: admin._id, email: admin.email },
      message: 'Admin Logged In!',
      success: true,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: `An error occurred!`,
    });
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);

    if (!admin)
      return res.json({ success: false, message: 'Admin not found!' });

    res.json({
      success: true,
      admin,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: `An error occurred!`,
    });
  }
});

router.put('/:id', auth, async (req, res, next) => {
  return res.json({
    success: false,
    message: "You are not authorized to acces this api!",
  });
  
  const { id } = req.params,
    updAdmin = req.body;

  try {
    const existingAdmin = await Admin.findOne({
      email: updAdmin.email,
    });

    if (existingAdmin)
      return res.json({
        success: false,
        message: 'Admin already exists!',
      });

    const admin = await Admin.findByIdAndUpdate(id, updAdmin, {
      new: true,
      runValidators: true,
    });

    if (!admin) {
      return res.json({
        success: false,
        message: `No admin with the id: ${id} found!`,
      });
    }

    res.json({ success: true, message: 'Admin Updated!', admin });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: `No admin with the id: ${id} found!`,
    });
  }
});

router.put('/updatepassword/:id', auth, async (req, res, next) => {
  const { id } = req.params,
    updAdmin = req.body;

  try {
    const oldAdmin = await Admin.findById(id).select('password');
    const isMatch = await bcrypt.compare(
      updAdmin.oldPassword,
      oldAdmin.password,
    );

    if (!isMatch)
      return res.json({
        success: false,
        message: 'Old password is incorrect!',
      });

    if (updAdmin.password != updAdmin.passwordCheck)
      return res.json({ success: false, message: 'Passwords do not match!' });

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(updAdmin.password, salt);

    const admin = await Admin.findByIdAndUpdate(
      id,
      { password: passwordHash },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!admin) {
      return res.json({
        success: false,
        message: `No admin with the id: ${id} found!`,
      });
    }

    res.json({ success: true, message: 'Password Updated!', admin });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: `No admin with the id: ${id} found!`,
    });
  }
});

router.get('/', auth, async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.user);

    if (!admin)
      return res.json({ success: false, message: 'Admin not found!' });

    res.json({
      success: true,
      admin,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
});

module.exports = router;
