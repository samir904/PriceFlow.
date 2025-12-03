import jwt from "jsonwebtoken";
import Apperror from "../UTILS/error.util.js";

export const isLoggedIn=async(req,res,next)=>{
    const{token}=req.cookies;
    if(!token){
        return next(new Apperror('session expired please login again',400));
    }
    const userdetails=await jwt.verify(token,process.env.JWT_SECRET);
   req.user=userdetails;

   next();
}

export const authorizeRoles=(...roles)=>
    async(req,res,next)=>{
    const currentUserRoles=req.user.role;

    if(!roles.includes(currentUserRoles)){
        return next(new Apperror(`Access denied. This route is restricted to ${roles.join(', ')} only`,403))
    }
    next();
}