const cookieParser = require('cookie-parser');
const express = require('express');
const app = express() ; 
const path = require('path'); 
const userModel = require('./models/user');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken') ; 
const postUser = require('./models/post'); 
const { Model } = require('mongoose');
const session = require('express-session'); 
const flash = require('connect-flash'); 



app.set("view engine",'ejs'); 
app.use(express.json());
app.use(express.urlencoded({extended:true})) ; 
app.use(cookieParser());

 app.use(session({
  secret:"secret" , 
  resave : false , 
  saveUninitialized:false
 }))

 app.use(flash()); 


/// creating middleware 
 
app.use((req,res,next)=>{
  res.locals.success = req.flash("success") ; 
  res.locals.error = req.flash("error");
  next();
});


app.get('/',(req,res)=>{

 res.render('index'); 
 
}); 


app.post('/register',async function(req,res){
let {email,password,name ,username, age} = req.body  ; 


let user = await userModel.findOne({email}) ; 
  if(user) return res.status(400).redirect('/login')
   bcrypt.genSalt(10,async function (err,salt) { 

     bcrypt.hash(password,salt, async (err,hash)=>{
       let user = await  userModel.create({
        username,
        name,
        email,
        password: hash   



      })
      
        req.flash("success","User Registered Sucessfully") ;
         let token  = jwt.sign({email:email , userid:user._id},"shhh") 
         res.cookie("token",token); 
         res.redirect("/login");  
     
     })
     

    
   })
    



 
  
 

}); 

app.get('/login', function(req,res){
  res.render('login')
}) 

app.get('/logout',function(req,res){
  
   res.cookie('token', ""); 
   res.redirect('/login'); 
   

})

app.post('/login',async function(req,res){
 let {email , password} = req.body;
 
 let user = await userModel.findOne({email})
 if(! user) return res.status(500).send(`Something Went Wrong`) ;  


  bcrypt.compare(password,user.password , function(err,result){
  
    if(result) {
      
      
      let token = jwt.sign({email:email , userid:user._id},"shhh");
      res.cookie("token" ,token); 
      res.status(200).redirect('profile') ; 

    }else{
      res.redirect('/login')
    }
  })



})

app.get('/profile',isLoggedIn, async (req,res)=>{
   
  let user =   await userModel.findOne({email:req.user.email}).populate("posts");  
  console.log(user);
  
  res.render("profile" ,{user});  
} )
 


function isLoggedIn(req,res,next){
  if(req.cookies.token === ""){
     return res.redirect('login'); 
     
  } 
   try{
      let data = jwt.verify(req.cookies.token,"shhh"); 
      req.user = data ;   
      next(); 

   }catch(err){
    return res.send('Invalid Token'); 

   }
  
   
}

app.get('/like/:id',isLoggedIn,async function(req,res){
 let post = await postUser.findOne({_id:req.params.id}).populate("user");
 post.likes.push(req.user.id);
 await post.save() ;  
 res.redirect('/profile');        
   

})


app.post('/post', isLoggedIn , async(req,res)=>{
    let user =  await userModel.findOne({email: req.user.email})
    let {content} = req.body 
    
 let post = await postUser.create({
      user:user._id , 
      content , 

 
 });         

 user.posts.push(post._id);
 await user.save();
 res.redirect('profile')
})







const PORT = 3000 ; 
app.listen(PORT , function(){
  console.log(`Server has Started at PORT : ${PORT}`) ;
  
})






