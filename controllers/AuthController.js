import prisma from "../DB/db.config.js";
import vine, { errors } from "@vinejs/vine";
import { loginSchema, registerSchema } from "../validations/authValidation.js";
import bcrypt from 'bcryptjs' 
import { messages } from "@vinejs/vine/defaults";
import jwt from 'jsonwebtoken'

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
          username : finduser.username
        }
        const token = jwt.sign(payloadData,process.env.JWT_SECRET,{
          expiresIn : "1d"
        })
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
}

export default AuthController;
