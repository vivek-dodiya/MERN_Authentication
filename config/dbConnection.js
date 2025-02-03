import mongoose from "mongoose";

export const connection = ()=>{
   mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log("Connected to MongoDB");
}).catch((err)=>{
    err.message
}); 
} 
