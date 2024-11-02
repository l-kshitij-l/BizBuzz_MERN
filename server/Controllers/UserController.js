import UserModel from "../Models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    let users = await UserModel.find();
    users = users.map((user) => {
      const { password, ...otherDetails } = user._doc;
      return otherDetails;
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json(error);
  }
};

// get a User from db
export const getUser = async (req, res) => {
  const id = req.params.id; //first we fetch id of user

  try {
    const user = await UserModel.findById(id); //does user exist?

    if (user) {
      const { password, ...otherDetails } = user._doc;
      //do not send password as it is confidential

      res.status(200).json(otherDetails); //no password included
    } else {
      res.status(404).json("No such user exists");
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

// update a user
export const updateUser = async (req, res) => {
  const id = req.params.id; //id whcih gets updated
  const { _id, currentUserAdminStatus, password } = req.body;
  //currentUserId: is the ID of user who is performing action of updating

  //If I have an account and I want to update(same person) || if admin wants to update
  if (id === _id) {
    try {
      if (password) {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(password, salt);
      }
      /*(id: the user in database who should be updated, req.body: info that should be updated in response, new=true: in response I want updated user not the previous user)*/
      const user = await UserModel.findByIdAndUpdate(id, req.body, {
        new: true,
      });

      const token = jwt.sign(
        { username: user.username, id: user._id },
        process.env.JWT_KEY,
        { expiresIn: "1h" }
      );
      res.status(200).json({ user, token });
    } catch (error) {
      res.status(500).json(error);
    }
  } else {
    res.status(403).json("Access Denied! you can only update your own profile");
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  const id = req.params.id;

  const { currentUserId, currentUserAdminStatus } = req.body;

  if (currentUserId === id || currentUserAdminStatus) {
    try {
      await UserModel.findByIdAndDelete(id);
      res.status(200).json("User deleted successfully");
    } catch (error) {
      res.status(500).json(error);
    }
  } else {
    res.status(403).json("Access Denied! you can only delete your own profile");
  }
};

// Follow a User
export const followUser = async (req, res) => {
  const id = req.params.id; //id:user who should be followed

  const { currentUserId } = req.body;
  //currentUserId: user who wants to follow
  if (currentUserId === id) {
    res.status(403).json("Action forbidden"); //you cannot follow yourself
  } else {
    try {
      const followUser = await UserModel.findById(id);
      const followingUser = await UserModel.findById(currentUserId);
      /* >followUser.followers.includes(currentUserId: means if user is already followed, below is the condition of ! which means if user is not followedd, then do it.

*/
      if (!followUser.followers.includes(currentUserId)) {
        //we update the followers list
        await followUser.updateOne({ $push: { followers: currentUserId } });
        //we update the following list
        await followingUser.updateOne({ $push: { following: id } });
        res.status(200).json("User followed!");
      } else {
        res.status(403).json("User is Already followed by you");
      }
    } catch (error) {
      res.status(500).json(error);
    }
  }
};

// UnFollow a User
export const UnFollowUser = async (req, res) => {
  const id = req.params.id;

  const { currentUserId } = req.body;

  if (currentUserId === id) {
    res.status(403).json("Action forbidden");
  } else {
    try {
      const followUser = await UserModel.findById(id);
      const followingUser = await UserModel.findById(currentUserId);
      //NOTE: NO NEGATION ! SIGN BELOW
      if (followUser.followers.includes(currentUserId)) {
        //INSTEAD OF PUSH WE WRITE PULL
        await followUser.updateOne({ $pull: { followers: currentUserId } });
        await followingUser.updateOne({ $pull: { following: id } });
        res.status(200).json("User Unfollowed!");
      } else {
        res.status(403).json("User is not followed by you");
      }
    } catch (error) {
      res.status(500).json(error);
    }
  }
};
