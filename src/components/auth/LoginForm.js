"use client"
import { useToast } from '@/hooks/use-toast';

import { zodResolver } from '@hookform/resolvers/zod';
import { Key, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import { useForm } from 'react-hook-form';
import {z} from 'zod';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { loginUserAction } from '@/actions/login';
const schema=z.object({
  email:z.string().email({message:"Please enter valid email address"}),
  password:z.string().min(6,{message:"Password must be at least 6 characters long"})
})

const LoginForm = () => {
  const [isLoading,setIsLoading]=useState(false);
  const {register,handleSubmit,formState:{error}}=useForm({resolver:zodResolver(schema)});
  const {toast}=useToast();
  const router=useRouter();
  const onSubmit=async (data)=>{
    setIsLoading(true);
    try {
      const formData=new FormData();
      Object.keys(data).forEach((key)=>formData.append(key,data[key]));
      console.log('FormData Email:', formData.get('email'));
      const result=await loginUserAction(formData);
      if(result.success){
        toast({
          title:"Login successfull",
          description:result.success
        })
        router.push("/");
      }else{
        throw new Error(result.error || "Something wrong occured")
      }
      
    } catch (error) {
      console.log(error);
      toast({
        title:"Login failed",
        description:error.message,
        variant:"destructive",
      })
    }finally{
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className='space-y-4'>
        <div className='relative'>
        <User className='absolute left-3 top-2 h-5 w-5 text-gray-400'/>
        <Input type="email"
          {...register("email")}
          placeholder="Email"
          disabled={isLoading}
          className="pl-10 bg-gray-50 border border-gray-300 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
        />

        </div>
      </div>
      <div className='relative'>
        <Key className='absolute left-3 top-2 h-5 w-5 text-gray-400' />
        <Input type="password"
          {...register("password")}
          placeholder="Password"
          disabled={isLoading}
          className="pl-10 bg-gray-50 border border-gray-300 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full mt-3 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-sm transition duration-300 ease-in-out transform hover:scale-105">Login</Button>
    </form>
  )
}

export default LoginForm
