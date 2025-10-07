require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this';

app.use(cors());
app.use(express.json());

// ===== User Schema =====
const UserSchema = new mongoose.Schema({
  name: {type:String, required:true},
  email: {type:String, required:true, unique:true},
  passwordHash: {type:String, required:true},
  role: {type:String, enum:['donor','ngo'], default:'donor'}
}, {timestamps:true});
const User = mongoose.model('User', UserSchema);

// ===== Donation Schema =====
const DonationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  quantity: String,
  contact: { type: String, required: true },
  donorName: { type: String, required: true },
  location: { type: String, required: true },   // address string
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  expiryDate: Date,
  status: { type: String, enum: ['available','accepted','picked'], default: 'available' },
  donor: { type: mongoose.Schema.Types.ObjectId, ref:'User' },
  ngo: { type: mongoose.Schema.Types.ObjectId, ref:'User' },
  createdAt: { type: Date, default: Date.now }
});
const Donation = mongoose.model('Donation', DonationSchema);

// ===== MongoDB Connect =====
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zerobin')
  .then(()=>console.log('MongoDB connected'))
  .catch(e=>console.error('MongoDB error', e));

// ===== Auth Routes =====
app.post('/api/auth/register', async (req,res)=>{
  try{
    const {name,email,password,role} = req.body;
    if(!name||!email||!password) return res.status(400).json({error:'Missing fields'});
    const existing = await User.findOne({email});
    if(existing) return res.status(400).json({error:'Email exists'});
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({name,email,passwordHash:hash,role});
    const token = jwt.sign({id:user._id,role:user.role}, JWT_SECRET, {expiresIn:'7d'});
    res.json({user:{id:user._id,name:user.name,email:user.email,role:user.role}, token});
  }catch(e){console.error(e); res.status(500).json({error:'Server error'});}
});

app.post('/api/auth/login', async (req,res)=>{
  try{
    const {email,password} = req.body;
    const user = await User.findOne({email});
    if(!user) return res.status(400).json({error:'Invalid credentials'});
    const match = await bcrypt.compare(password, user.passwordHash);
    if(!match) return res.status(400).json({error:'Invalid credentials'});
    const token = jwt.sign({id:user._id,role:user.role}, JWT_SECRET, {expiresIn:'7d'});
    res.json({user:{id:user._id,name:user.name,email:user.email,role:user.role}, token});
  }catch(e){console.error(e); res.status(500).json({error:'Server error'});}
});

// ===== Auth Middleware =====
const auth = (req,res,next)=>{
  const authHeader = req.headers.authorization;
  if(!authHeader) return res.status(401).json({error:'No token'});
  const token = authHeader.split(' ')[1];
  try{
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  }catch(e){ return res.status(401).json({error:'Invalid token'}); }
};

// ===== Donation Routes =====
app.post('/api/donations', auth, async (req,res)=>{
  try{
    const {title,description,quantity,contact,donorName,location,lat,lng,expiryDate} = req.body;
    const donation = await Donation.create({
      title,description,quantity,contact,donorName,location,lat,lng,expiryDate,
      donor:req.user.id
    });
    res.json(donation);
  }catch(e){console.error(e); res.status(500).json({error:'Server error'});}
});

app.get('/api/donations', auth, async (req,res)=>{
  try{
    const donations = await Donation.find()
      .populate('donor','name email')
      .populate('ngo','name email');
    res.json(donations);
  }catch(e){console.error(e); res.status(500).json({error:'Server error'});}
});

app.post('/api/donations/:id/accept', auth, async (req,res)=>{
  try{
    const donation = await Donation.findById(req.params.id).populate('donor','name email');
    if(!donation) return res.status(404).json({error:'Not found'});
    if(req.user.role !== 'ngo') return res.status(403).json({error:'Only NGO can accept'});
    donation.status = 'accepted';
    donation.ngo = req.user.id;
    await donation.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    if(donation.donor?.email){
      const mail = {
        from: process.env.EMAIL_USER,
        to: donation.donor.email,
        subject: 'Your donation has been accepted — Zerobin',
        text: `Hello ${donation.donor.name},\n\nYour donation "${donation.title}" was accepted by an NGO. Please coordinate pickup.\n\nThanks,\nZerobin`
      };
      transporter.sendMail(mail, (err)=>{ if(err) console.error('Mail error', err); });
    }

    res.json({message:'Accepted', donation});
  }catch(e){console.error(e); res.status(500).json({error:'Server error'});}
});

// ===== Root =====
app.get('/', (req,res)=> res.send('Zerobin backend running'));

// ===== Start Server =====
app.listen(PORT, ()=> console.log('Server listening on', PORT));
