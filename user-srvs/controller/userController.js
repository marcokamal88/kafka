const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Kafka } = require("kafkajs");
const { user } = require("../models");

const kafka = new Kafka({
  clientId: "user-service",
  brokers: ["localhost:9092"],
});
const producer = kafka.producer();
const runProducer = async () => {
  await producer.connect();
};
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let mypassword = password;
    let userFound = await user.findOne({
      where: {
        email,
      },
    });
    if (userFound) {
      return res.status(409).json({ error: "user already exists :)" });
    } else {
      try {
        // console.log(typeof salt);
        const password = await bcrypt.hash(mypassword, 17);
        const createdUser = await user.create({ name, email, password });
        const userId = createdUser.id;
        await producer.send({
          topic: "user-registrations2",
          messages: [{ value: JSON.stringify({ userId }) }],
        });
        return res.status(200).json("user registered successfully");
        // return res.status(200).json(createdUser.id);
      } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};
runProducer().catch(console.error);

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let userFound = await user.findOne({ where: { email } });
    // res.json(userFound);
    if (userFound) {
      // const passwordMatch = await bcrypt.compare(password+process.env.SALT, userFound.password);
      const passwordMatch = await bcrypt.compare(password, userFound.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "wrong password :(" });
      }
      const token = jwt.sign(
        {
          id: userFound.id,
          username: userFound.username,
          email: userFound.email,
        },
        "17",
        {
          expiresIn: "10h",
        }
      );
      const isActive = true;
      const userId = userFound.id;
      await producer.send({
        topic: "user-login",
        messages: [{ value: JSON.stringify({ userId, isActive }) }],
      });
      return res.status(200).json(token);
    } else {
      res.status(404).json({ error: "user is not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = {
  register,
  login,
};
