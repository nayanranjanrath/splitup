import express from "express"
import mongoose  from "mongoose"
import dotenv from "dotenv"
dotenv.config()
 console.log(process.env.MONGODB_URI)

const connectdb = async () => {
    try {
        const conn = await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log("MongoDB Connected")
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}
export default connectdb