const express = require("express");
const usersController = require("./controller/userController");
const MW = require("./middlewares/middleware");
const { sequelize } = require("./models");

const app = express();
// app.use("/images", express.static(__dirname + "/Images"));
app.use(express.json());

// console.log(typeof process.env.SALT);
app.post("/register", usersController.register);

app.post("/login", usersController.login);

app.listen({ port: 5000 },async () => {
  console.log("Server up on http://localhost:5000" );
  await sequelize.authenticate();
  console.log("Database Connected!");
});
