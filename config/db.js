const mongoose = require('mongoose');

const connection = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`.magenta);
  } catch (error) {
    console.log(`MongoDB failed to connect: ${error.message}`.red);
  }
};

module.exports = connection;
