const express = require("express");
// const product = require("./controller/productController");
const { bag } = require("./models");
// const MW = require("./middlewares/middleware");
const { sequelize } = require("./models");
const { Kafka } = require("kafkajs");
const app = express();
app.use(express.json());

const getBags = async (req, res) => {
  try {
    const mybag = await bag.findAll();
    return res.json(mybag);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
};
app.get("/getBags", getBags);

const kafka = new Kafka({
  clientId: "bag-service",
  brokers: ["localhost:9092"],
});
const consumer = kafka.consumer({ groupId: "bag-group" });
const runConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: "buyProduct",
    fromBeginning: true,
  });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const { userId, productId, paid } = JSON.parse(message.value.toString());
      try {
        console.log(topic);
        await bag.create({ userId, productId, paid });
        console.log(
          `created bag with userId ${userId} and productId ${productId}`
        );
      } catch (error) {
        console.error("Error adding to bag:", error);
      }
    },
  });
  //   consumer.disconnect();
};
runConsumer().catch(console.error);
app.listen({ port: 5002 }, async () => {
  await sequelize.authenticate();
  console.log("Database Connected!");
  // await runConsumer().catch(console.error);
  // console.log("Kafka Consumer Running!");
  console.log("Server up on http://localhost:5002");
});
