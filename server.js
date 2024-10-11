/* eslint-disable import/newline-after-import */
/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err.name, ': ', err.message);
  console.log('Uncaught Exception. Shutting down');
  console.log(err);
});

dotenv.config({ path: './config.env' }); // automatski unsese ENVIROMENT VARIABLES iz config.env file-a
const app = require('./app');

const uri = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD_ENCODED,
);
mongoose
  .connect(uri, {
    // useUnifiedTopology: true,
    // useNewUrlParser: true,
  })
  .then(() => {
    // console.log(con.connections);
    console.log('DB Connection successful');
  });

// console.log(app.get('env')); // development by default
// console.log(process.env);

const port = process.env.PORT || 3000;
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection. Shutting down');
  server.close(() => {
    process.exit(1);
  });
});
