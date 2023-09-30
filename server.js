require('dotenv').config();
require('colors');

const express = require('express'),
  morgan = require('morgan'),
  helmet = require('helmet'),
  { xss } = require('express-xss-sanitizer'),
  expressMongoSanitize = require('express-mongo-sanitize'),
  hpp = require('hpp'),
  // fileUpload = require('express-fileupload'),
  connection = require('./config/db'),
  { notFoundHandler } = require('./middlewares/auth'),
  uploadHandler = require('./api/uploadHandler'),
  boardHandler = require('./api/boardHandler'),
  listHandler = require('./api/listHandler'),
  cardHandler = require('./api/cardHandler'),
  favouriteHandler = require('./api/favouriteHandler'),
  taskHandler = require('./api/taskHandler'),
  notificationHandler = require('./api/notificationHandler'),
  userHandler = require('./api/userHandler'),
  adminHandler = require('./api/adminHandler'),
  emailHandler = require('./api/emailHandler'),
  messageHandler = require('./api/chatHandler'),
  commentHandler = require('./api/commentHandler'),
  activityHandler = require('./api/activityHandler'),
  todoListHandler = require('./api/todoListHandler'),
  pieChartHandler = require('./api/pieChartHandler'),
  companyHandler = require('./api/companyHandler'),
  archiveHandler = require('./api/archiveHandler'),
  // { createProxyMiddleware } = require('http-proxy-middleware'),
  meetingHandler = require('./api/meetingHandler'),
  PORT = process.env.PORT || 5000,
  app = express(),
  cors = require('cors');

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`.blue);
});

connection();

const corsOption = {
  origin: ['http://localhost:3000', 'https://www.bizstruc.com/'],
};
const io = require('socket.io')(server, {
  cors: corsOption.origin,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOption));
app.use(morgan('tiny'));
app.use(helmet());
app.use(expressMongoSanitize());
app.use(hpp());
app.use(xss());
app.use((req, res, next) => {
  req.io = io;

  next();
});
// app.use(
//   '/socket.io',
//   createProxyMiddleware({
//     target: 'ws://127.0.0.1:7001',
//     changeOrigin: true,
//   }),
// );

app.use('/api/activities/', activityHandler);
app.use('/api/admin/', adminHandler);
app.use('/api/archives/', archiveHandler);
app.use('/api/boards/', boardHandler);
app.use('/api/cards/', cardHandler);
app.use('/api/messages/', messageHandler);
app.use('/api/comments/', commentHandler);
app.use('/api/company/', companyHandler);
app.use('/api/email/', emailHandler);
app.use('/api/favourites/', favouriteHandler);
app.use('/api/lists/', listHandler);
app.use('/api/meetings/', meetingHandler);
app.use('/api/notifications/', notificationHandler);
app.use('/api/pieChart/', pieChartHandler);
app.use('/api/tasks/', taskHandler);
app.use('/api/todos/', todoListHandler);
app.use('/api/file/', uploadHandler);
app.use('/api/user/', userHandler);
app.use(notFoundHandler);

// io.on('connection', (socket) => {
//   socket.on('checking', (data) => console.log(data, 'data'));
// });

// app.post('/upload', (req, res) => {
//   if (req.files === null) {
//     return res.status(400).json({ msg: 'No file uploaded' });
//   }

//   const file = req.files.file,
//     extension = path.extname(file.name);

//   file.mv(
//     `D:/projects/V1/frontend/public/files/${uniqid() + extension}`,
//     (err) => {
//       // file.mv(`${__dirname}/frontend/public/files/${file.name}`, (err) => {
//       if (err) {
//         console.error(err);

//         return res.status(500).send(err);
//       }

//       res.json({
//         fileName: uniqid() + extension,
//         filePath: `/files/${uniqid() + extension}`,
//       });
//     },
//   );
// });

// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static('client/build'));
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'client/build/index.html'));
//   });
// }
