const bcrypt = require("bcrypt");
// require("dotenv").config();
const jwt = require("jsonwebtoken");
function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  // console.log("-----------------"+bearerHeader);
  if (bearerHeader) {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    console.log(bearer[1]);
    // console.log(typeof process.env.SECRET_KEY)
    jwt.verify(bearerToken, "b2f7e8a9c6d5", function(err, user){
      console.log(user+" "+err)
      if (err) return res.status(403).send("token cannot be verified :(");
      res.id = user.id;
      next();
    });
  } else {
    return res.status(403).send("cannot find token in header :(");
  }
}
module.exports = {
  verifyToken,
};
