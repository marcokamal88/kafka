const { where } = require("sequelize");
const { product,user } = require("../models");
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "product-service",
  brokers: ["localhost:9092"],
});
const producer = kafka.producer();
// const runProducer = async () => {
//   await producer.connect();
// };

const getProducts = async (req, res) => {
  const query = req.query;
  limit = query.limit || 10;
  page = query.page || 1;
  offset = (page - 1) * limit;
  try {
    const myproduct = await product.findAll({ limit, offset });
    return res.json(myproduct);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

const buyProduct = async (req, res) => {
  const userId = req.query.userId;
  const productId = req.query.productId;
  const foundUser = await user.findOne({ where: { userId } });
  if (!foundUser) {
    return res.json({ error: "you should register first!" });
  } else {
    if (foundUser.isActive == false) {
      return res.json({ error: "you should login first!" });
    }
    await producer.connect();
    await producer.send({
      topic: "buyProduct",
      messages: [{ value: JSON.stringify({ userId, productId, paid: false }) }],
    });
    return res.status(200).json("product is added to your bag");
  }
};

module.exports = { getProducts,buyProduct };
