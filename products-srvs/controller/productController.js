const { product } = require("../models");

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

module.exports = { getProducts };
