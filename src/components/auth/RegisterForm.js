"use client"
import { User } from 'lucide-react'
import React, { useState } from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import * as z from 'zod';
import { useForm } from 'react-hook-form'
import {zodResolver} from "@hookform/resolvers/zod"
import { useToast } from '@/hooks/use-toast'
import { registerUserAction } from '@/actions/register'
import { useRouter } from 'next/navigation'


const schema=z.object({
  name:z.string().min(2,{message:"Name must be at least 2 characters."}),
  email:z.string().email({message:"Please enter a valid email address"}),
  password:z.string().min(6,{message:"Password must be at least 6 characters long."})
})


const RegisterForm = () => {
  const [isLoading,setIsLoading]=useState(false);
  const {register,handleSubmit,formState:{errors},}=useForm({resolver:zodResolver(schema)});
  const {toast} =useToast();
  const router=useRouter();
  const onSubmit=async(data)=>{
    setIsLoading(true);
    try {
      const formData=new FormData();
      Object.keys(data).forEach(key=>formData.append(key,data[key]));
      const result=await registerUserAction(formData);
      console.log(result,"result");
      if(result.success){
        toast({
          title:"Registration successful",
          description:result.success
        })
        router.push('/login');
      }else{
        throw new Error(result.error || "Something went wrong");
      }

    } catch (error) {
      console.log(error);
      toast({
        title:"Registration failed",
        description:error.message,
        variant:"destructive",
      })
    }finally{
      setIsLoading(false);
    }

  }
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <div className="relative">
          <User className='absolute left-3 top-2 h-5 w-5 text-gray-400'/>
          <Input {...register('name')} disabled={isLoading} placeholder="Name" className="pl-10 bg-gray-50 border border-gray-300 text-gray-900 focus:ring-indigo-500 
          focus:border-indigo-500"/>
        </div>
        <div className="relative">
        <User className='absolute left-3 top-2 h-5 w-5 text-gray-400'/>
          <Input {...register('email')} disabled={isLoading} type="email" placeholder="Email" className="pl-10 bg-gray-50 border border-gray-300 text-gray-900 focus:ring-indigo-500 
          focus:border-indigo-500"/>
        </div>
        <div className="relative">
        <User className='absolute left-3 top-2 h-5 w-5 text-gray-400'/>
          <Input {...register('password')} disabled={isLoading} type="password" placeholder="Password" className="pl-10 bg-gray-50 border border-gray-300 text-gray-900 focus:ring-indigo-500 
          focus:border-indigo-500"/>
        </div>
        
      </div>
      <Button type="submit" disabled={isLoading} className="w-full mt-3 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105">Register</Button>
    </form>
  )
}

export default RegisterForm
