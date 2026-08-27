import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
const secret=process.env.JWT_SECRET||'webora-development-secret-change-me';
export function signToken(user){return jwt.sign({id:user.id,role:user.role,client_id:user.client_id||null,name:user.name,email:user.email},secret,{expiresIn:'8h'});}
export function auth(req,res,next){const h=req.headers.authorization||''; if(!h.startsWith('Bearer ')) return res.status(401).json({message:'Authentication required'}); try{req.user=jwt.verify(h.slice(7),secret);next();}catch{return res.status(401).json({message:'Session expired. Please sign in again.'});}}
export function allow(...roles){return (req,res,next)=>roles.includes(req.user.role)?next():res.status(403).json({message:'You do not have permission for this action.'});}
export function findUser(email,role){return db.prepare('SELECT * FROM users WHERE lower(email)=lower(?) AND role=?').get(email,role);}
export function verifyPassword(password,hash){return bcrypt.compareSync(password,hash);}
