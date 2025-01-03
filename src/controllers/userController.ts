import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { findBestMatches } from "../services/match";
import { Sequelize } from "sequelize-typescript";

const saltRounds = 10;

function calculateAge(date_of_birth: string | Date): number {
  const birthDate = new Date(date_of_birth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  return age;
}

interface PaginationResult<T> {
  count: number;
  rows: T[];
}

const userController = {
  createUser: async (req: Request, res: Response) => {
    try {
      const {
        first_name,
        last_name,
        username,
        email,
        phone_number,
        password,
        country,
        state_or_province,
        state_of_origin,
        education_level,
        profession,
        hobbies_and_interests,
        qualities,
        gender,
        date_of_birth,
        subscribed,
      } = req.body;
      // console.log("BODYYY: ", req.body.qualities, req.body.interests);

      const userExists = await User.findOne({ where: { email } });

      if (userExists) {
        return res.status(409).json({
          status: 'error',
          message: `User ${first_name} already exists. You can log in with your email or username and password.`,
          data: null,
          error: null
        });
      }

      let hashedPassword = await bcrypt.hash(password, saltRounds);
      let age = calculateAge(date_of_birth);
      if (age < 20) {
        console.log("You are underage");
        return res
          .status(403)
          .json({ message: "You are under-age, this service is for adults" });
      }

      const userData = {
        first_name,
        last_name,
        username,
        email,
        phone_number,
        password: hashedPassword,
        country,
        state_or_province,
        state_of_origin,
        education_level,
        profession,
        hobbies_and_interests,
        qualities,
        gender,
        date_of_birth,
        age,
        subscribed,
      };

      const userRecord = await User.create(userData);

      if (userRecord) {
        const sanitizedUser = await User.findOne({
          where: { email },
          attributes: { exclude: ["password", "date_of_birth"] },
        });
        return res.status(201).json({
          status: 'success',
          message: `User ${first_name} created successfully`,
          data: sanitizedUser,
          error: null
          });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: 'fail',
        message: "An error occurred!",
        data: null,
        error: err
      });
    }
  },

  getAllUsers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pageSize: number = parseInt(req.query.pageSize as string) || 10;
      const pageNumber: number = parseInt(req.query.pageNumber as string) || 1;
      const minAge: number = parseInt(req.query.minAge as string);
      const maxAge: number = parseInt(req.query.maxAge as string);
      const subscribed: string = req.query.subscribed as string;
      let subscriberStatus;
      subscriberStatus = {subscribed: {[Op.eq]: subscribed}}
      // let ageRange = { age: {[Op.between]: minAge, maxAge}}
      const offset: number = (pageNumber - 1) * pageSize;
      const limit: number = pageSize;
      const search = req.query.search;
      let nameCitySearch = [];
      if ( search ) {
        nameCitySearch .push({
          [Op.or]: [
            { first_name: {[Op.like]: `%${search}%` } },
            { last_name: {[Op.like]: `%${search}%` } },
            { username: {[Op.like]: `%${search}%` } },
            { state_or_province: {[Op.like]: `%${search}%` } },
          ]
        })
      }
      // if ( ageRange) {
        // Sequelize.literal(`date BETWEEN '${minAge}' AND '${maxAge}'`),
      // }
      const whereConditions = {
        [Op.and]: [
          ...nameCitySearch,
          subscriberStatus,
          Sequelize.literal(`age BETWEEN '${minAge}' AND '${maxAge}'`)

        ],
        // [Op.between]: { age: { minAge, maxAge } }
      };
      const result: PaginationResult<typeof User.prototype> =
        await User.findAndCountAll({
          attributes: { exclude: ["password", "date_of_birth", "state_of_origin", "createdAt", "updatedAt", "deletedAt"] },
          where: whereConditions,
          offset,
          limit,
        });
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "No records found" });
      }
      return res.status(200).send({
        status: "success",
        message: "Record found!",
        data: {
          count: result.count,
          currentPage: pageNumber,
          limit: pageSize,
          users: result.rows,
        },
        error: null,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
          message: "An error occurred while fetching users.",
          error: error,
        });
    }
  },

  getOneUser: async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const user = await User.findByPk(user_id, {
        attributes: { exclude: ["password", "date_of_birth", "createdAt", "updatedAt", "deletedAt"] },
      });
      if (!user) {
        return res
          .status(404)
          .json({ message: `Record not found for ${user_id}` });
      }
      return res.status(200).send({ message: "User found!", data: user });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({
          message: "An error occurred while updating the user.",
          error: error,
        });
    }
  },

  updateUser: async (req: Request, res: Response) => {
    try {
      const user_id = req.params.user_id;
      const {
        first_name,
        last_name,
        username,
        country,
        state_or_province,
        state_of_origin,
        education_level,
        profession,
        hobbies_and_interests,
        qualities,
        date_of_birth,
        subscribed,
        role
      } = req.body;
      let age = calculateAge(req.body.date_of_birth);
      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(404).json({ message: `User not found.` });
      }
      let updatedFields = {
        first_name,
        last_name,
        username,
        country,
        state_or_province,
        state_of_origin,
        education_level,
        profession,
        hobbies_and_interests,
        qualities,
        date_of_birth,
        age,
        subscribed,
        role
      };
      await user.update(updatedFields);

      const updatedUser = await User.findByPk(user_id, {
        attributes: { exclude: ["password"] },
      });
      return res
        .status(200)
        .json({ message: "User updated successfully", data: updatedUser });
    } catch (error) {
      return res.status(500).send({ message: "Error occured", error: error });
    }
  },

  deleteUser: async (req: Request, res: Response) => {
    try {
      const user_id = req.params.user_id;
      const removeUser = await User.destroy({ where: { user_id } });
      if (removeUser < 1) {
        return res.status(404).send({
          status: "error",
          message: `User with id: ${user_id} was not found`,
          data: null,
          error: null,
        });
      }
      return res.status(200).send({
        status: "success",
        message: "User deleted successfully.",
        data: removeUser,
        error: null,
      });

      // return res.status(403).send("User not deleted due to an error");
    } catch (error) {
      return res.status(500).send({ message: "Error occured", error: error });
    }
  },

  getUserMatches: async (req: Request, res: Response) => {
    const userId = req.params.user_id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
  
    try {
      const result = await findBestMatches(userId, page, limit);
      
      res.status(200).json({
        status: 'success',
        message: `Top ${limit} matches for page ${page}`,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error finding matches',
        error: error,
      });
    }
  }

  // findBestMatches: async (req: Request, res: Response) => {
  //   const user_id = req.params.user_id;
  //   const page = parseInt(req.query.page as string) || 1;
  //   const limit = parseInt(req.query.limit as string) || 5;

  //   try {
  //     const result = await findBestMatches(user_id, page, limit);
  //     res.status(200).json({
  //       status: "success",
  //       message: `Top ${limit} matches for page ${page}`,
  //       data: result,
  //       error: null,
  //     })
  //   } catch (error) {
  //     res.status(500).json({
  //       status: "error",
  //       message: "Error finding best matches",
  //       error: error
  //     })
  //   }
  // }
};

export default userController;
