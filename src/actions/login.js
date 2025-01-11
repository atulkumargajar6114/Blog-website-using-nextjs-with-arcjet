"use server"
import { loginRules } from '@/lib/arcjet';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { request } from '@arcjet/next';
import {z} from 'zod';
import bcrypt from "bcryptjs";
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
const schema=z.object({
  email:z.string().email({message:"Please enter the valid email address"}),
  password:z.string().min(6,{message:"Password must be at least 6 characters long"})
})

export async function loginUserAction(formData) {
  
  const validatedFields=schema.safeParse({
    email:formData.get("email"),
    password:formData.get("password")

  })
  if(!validatedFields.success){
    return {
      error:validatedFields.error.errors[0].message,
      status:400
    }
  }
  const {email,password}=validatedFields.data;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    console.error("Invalid or missing email:", email);
    return {
      error: "Invalid email address provided",
      status: 400,
    };
  }
  try {
    const req=await request();
    const decision=await loginRules.protect(req,{
      email:email
    })
    console.log("Decision Object:", decision);
    if(decision.isDenied()){
      if(decision.reason.isEmail()){
        const emailTypes=decision.reason.emailTypes;
        if(emailTypes.includes("DISPOSABLE")){
          return{
            error:"Disposable email addresses are not allowed",
            status:403,
          }
        }else if(emailTypes.includes("INVALID")){
            return{
              error:"Invalid Email Address",
              status:403
            }
        }else if(emailTypes.includes("NO_MX_RECORDS")){
          return{
            error:"Email domain does not have valid MX records",
            status:403

          }
        }else{
          return{
            error:"email address is not accepted! Please try again",
            status:403
          }
        }
      }else if(decision.reason.isBot()){
        return{
          error:"Bot activity detected",
          status:403
        }
      }else if(decision.reason.isShield()){
        return{
          error:"Suspecious activity detected",
          status:403
        }
      }else if(decision.reason.isRateLimit()){
        return{
          error:"To many requests! Please try after some time",
          status:403,
        }
      }
    }
    await connectToDatabase();
    const user=await User.findOne({email}).select("+password");
    if(!user){
      return{
        error:"Invalid credentials",
        status:401
      }
    }
    const isPasswordMatch=await bcrypt.compare(password,user.password);
    if(!isPasswordMatch){
      return{
        error:"Invalid credentials",
        status:401
      }
    }

    const userToken=await new SignJWT({
      userId:user._id.toString(),
      email:user.email,
      userName:user.name,
      isPremium:user.isPremium
    }).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("2h").sign(new TextEncoder().encode(process.env.JWT_SECRET));

    (await cookies()).set("token",userToken,{
      httpOnly:true,
      secure:false,
      sameSite:"strict",
      maxAge:7200,
      path:"/"
    })
    return{
      success:"Logged in successfully",
      status:200
    }
    
  } catch (error) {
    console.error(error,"Login error");
    return{
      error:"Internal server error",
      status:500
    }
  }
}