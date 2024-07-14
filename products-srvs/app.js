const express = require("express");
const product = require("./controller/productController");
const { user } = require("./models");
// const MW = require("./middlewares/middleware");
const { sequelize } = require("./models");
const { Kafka } = require("kafkajs");
const app = express();
app.use(express.json());

const kafka = new Kafka({
  clientId: "product-service",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "product-group" });

const runConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: "user-registrations2",
    fromBeginning: true,
  });
  await consumer.subscribe({
    topic: "user-login",
    fromBeginning: true,
  });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (topic === "user-registrations2") {
        const { userId } = JSON.parse(message.value.toString());
        await user.create({ userID: userId });
      }
      if (topic === "user-login") {
        const { userId, isActive } = JSON.parse(message.value.toString());
        console.log(userId + "-------------" + isActive);
        try {
          const res = await user.update(
            { isActive },
            { where: { userID: userId } }
          );
          console.log(
            `Updated user with userId ${userId} to isActive: ${isActive}`
          );
        } catch (error) {
          console.error("Error updating user:", error);
        }
      }
    },
  });
};
runConsumer().catch(console.error);
app.get("/getAllProducts", product.getProducts);
app.post("/buyProduct", product.buyProduct);

app.listen({ port: 5001 }, async () => {
  console.log("Server up on http://localhost:5001");
  await sequelize.authenticate();
  console.log("Database Connected!");
});
