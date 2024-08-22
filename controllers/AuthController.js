import prisma from "../DB/db.config.js";
import vine, { errors } from "@vinejs/vine";
import { loginSchema, registerSchema } from "../validations/authValidation.js";
import bcrypt from 'bcryptjs' 
import { messages } from "@vinejs/vine/defaults";
import jwt from 'jsonwebtoken'
// import { Role } from "@prisma/client";
import { SignJWT } from 'jose';
import { TextEncoder } from 'util';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

class AuthController {
  static async register(req, res) {
    try {
      // Clone and trim the username field
      const body = { ...req.body, username: req.body.username?.trim() };

      const validator = vine.compile(registerSchema);
      const payload = await validator.validate(body);

      // check if username exists 
      const finduser = await prisma.users.findUnique({
        where : {
            username : payload.username
        }
      })
      if(finduser){
        return res.status(400).json({errors : {
            username : "Invalid Credentials"
        }})
      }
      const salt = bcrypt.genSaltSync(10)
      payload.password = bcrypt.hashSync(payload.password,salt) ;

      const user = await prisma.users.create(
        {
            data : payload
        }
      )

      // Optionally, exclude the password from the response payload
      const { password, ...safeuser } = user;

      return res.json({ status : 200, message : "user created successfully", user: safeuser });
    } 
    catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        return res.status(400).json({ errors: error.messages });
      }

      console.log(error);
    
     // Optionally handle other types of errors
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
  static async login(req,res){
    try {
     const body = { ...req.body, username: req.body.username?.trim() };
    const validator = vine.compile(loginSchema)
    const payload = await validator.validate(body)

    // find user with username 
    const finduser = await prisma.users.findUnique({
        where : {
            username : payload.username
        }
    })
    if(finduser){
        if(!bcrypt.compareSync(payload.password,finduser.password)){
            return res.status(400).json({errors : {
                username : "Invalid Credentials"
            }})
        }
        // issue token 
        const payloadData = {
          username : finduser.username,
          role : finduser.role
        }
        const token = await new SignJWT(payloadData)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1d')
        .sign(JWT_SECRET);

        return res.json({
            message : "Logged in successfully",
            access_token : `Bearer ${token}`
        })
    }
    return res.status(400).json({errors : {
        username : "No user found"
    }})
    } catch (error) {
        if (error instanceof errors.E_VALIDATION_ERROR) {
          return res.status(400).json({ errors: error.messages });
        }
      
       // Optionally handle other types of errors
        return res.status(500).json({ error: "Internal Server Error" });
      }
  }

 static async getAllUsers(req, res){
    try {
      // Check if the user is an admin
      if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
  
      const users = await prisma.users.findMany({
        select: {
         username: true,
          role: true,
        },
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching users' });
    }
  };

static async deleteUser(req, res){
    const { username } = req.params;
  
    try {
      // Check if the user is an admin
      if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
  
      await prisma.users.delete({
        where: {
          username,
        },
      });
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting user' });
    }
  };

  static async updateUserRole(req, res) {
    try {
      // Check if the user is an admin
      if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { username, role } = req.body;

      if (!username || !role) {
        return res.status(400).json({ error: 'Username and role are required' });
      }

      // Check if the role is valid (Admin or Editor)
      if (role !== 'Admin' && role !== 'Editor') {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Check if the user exists
      const userExists = await prisma.users.findUnique({
        where: { username },
      });

      if (!userExists) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update user role in the database
      const updatedUser = await prisma.users.update({
        where: { username },
        data: { role },
        select: { username: true, role: true }, // Exclude password from the response
      });

      return res.json({
        status: 200,
        message: 'User role updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

}

export default AuthController;
