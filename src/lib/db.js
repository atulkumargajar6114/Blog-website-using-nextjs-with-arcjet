import mongoose from "mongoose";

const connectToDatabase=async ()=>{
  mongoose.connect(process.env.MONGODB_URI)
  .then(()=>console.log("MongoDB is connect successfully"))
  .catch((e)=>console.log(e));
}
export default connectToDatabase;