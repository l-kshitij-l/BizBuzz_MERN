import UserModel from "../Models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Registering a new User
export const registerUser = async (req, res) => {
  /*making salt from 'bcrypt' library with value '10' . 10 is basically the amount of how much we want to alter the password by hashing it. */
  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(req.body.password, salt); //we add the salt(hashing) to our password
  req.body.password = hashedPass;

  const newUser = new UserModel(req.body);
  const { username } = req.body;

  try {
    const oldUser = await UserModel.findOne({ username });

    if (oldUser) {
      return res
        .status(400)
        .json({ message: "The username is already registered!" });
    }
    const user = await newUser.save(); //once mapped, save it in database

    const token = jwt.sign(
      {
        username: user.username,
        id: user._id,
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
    res.status(200).json({ user, token }); //status 200 means whenever something goes righ, we use it
  } catch (error) {
    res.status(500).json({ message: error.message }); //500 means error on server side
  }
};

// login User

export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await UserModel.findOne({ username: username });

    if (user) {
      const validity = await bcrypt.compare(password, user.password); //validity is a boolean, with true/false

      if (!validity) {
        res.status(400).json("wrong password");
      } else {
        const token = jwt.sign(
          {
            username: user.username,
            id: user._id,
          },
          process.env.JWT_KEY,
          { expiresIn: "1h" }
        );
        res.status(200).json({ user, token });
      }
    } else {
      res.status(404).json("User does not exists"); //user does not exist
    }
  } catch (error) {
    res.status(500).json({ message: error.message }); //if any other error
  }
};
