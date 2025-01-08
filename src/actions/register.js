"use server"
import aj from '@/lib/arcjet';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { request } from '@arcjet/next';
import bcrypt from 'bcryptjs';
import {z} from 'zod';
const schema=z.object({
  name:z.string().min(2,{message:"Name must be at least 2 Characters"}),
  email:z.string().email({message:"Please enter a valid email address"}),
  password:z.string().min(6,{message:"Password must be at least 6 Characters long."})
})

export async function registerUserAction(formData) {
  const validationFields=schema.safeParse({
    name:formData.get('name'),
    email:formData.get('email'),
    password:formData.get('password')
  })

  if(!validationFields.success){
    return {
      error:validationFields.error.errors[0].message,
      status:400,
    }
  }
  const {name,email,password}=validationFields.data;
  try {
    const req=await request();
    const decision=await aj.protect(req,{
      email,
    })
    console.log(decision,"decision");
    if(decision.isDenied()){
      if(decision.reason.isEmail()){
        const emailTypes=decision.reason.emailTypes;
        if(emailTypes.includes("DISPOSABLE")){
          return {
            error:"Disposable email addresses are not allowed",
            status:403,
          }
        }else if(emailTypes.includes("INVALID")){
          return{
            error:"Invalid Email Address",
            status:403,
          }
        }else if(emailTypes.includes("NO_MX_RECORDS")){
          return{
            error:"Email domain does not have valid MX records",
            status:403
          }
        }
      }else{
        return{
          error:"Email address is not accepted! Please try again",
          status:403
        }
      }
    }else if(decision.reason.isBot()){
      return {
        error:"Bot activity detected",
        status:403
      }
    }else if(decision.reason.isRateLimit()){
      return{
        error:"Too many requests! Please try again later",
        status:403,
      }
    }

    await connectToDatabase();
    const existingUser=await User.findOne({email});
    if(existingUser){
      return{
        error:"User already exists",
        status:400
      }
    }
    const salt =await bcrypt.genSalt(10);
    const hashedPassowrd= await bcrypt.hash(password,salt);
    const result=new User({
      name,email,password:hashedPassowrd,
    })
    await result.save();
    if(result){
      return{
        success:"User registered successfully",
        status:201
      }
    }else{
      return{
        error:"Internal server error",
        status:500
      }
    }

  } catch (error) {
    console.error(error,"Registration error");
    return{
      error:"Internal Server error",
      status:500,
    }
    
  }
  
}