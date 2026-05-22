const router=require("express").Router();

const db=require("../database");

const bcrypt=require("bcrypt");

const jwt=require("jsonwebtoken");

router.post("/register",async(req,res)=>{

const {username,password}=req.body;

const hash=
await bcrypt.hash(
password,
10
);

db.run(
`
INSERT INTO users
(username,password)
VALUES (?,?)
`,
[username,hash],

function(err){

if(err){

return res.status(400)
.json({
message:"Имя занято"
});

}

const token=
jwt.sign(
{
id:this.lastID
},
"SECRET_KEY"
);

res.json({
token,
username
});

}

);

});

router.post("/login",(req,res)=>{

const {
username,
password
}=req.body;

db.get(
`
SELECT *
FROM users
WHERE username=?
`,
[username],

async(err,user)=>{

if(!user){

return res.status(404)
.json({
message:"Нет пользователя"
});

}

const ok=
await bcrypt.compare(
password,
user.password
);

if(!ok){

return res.status(400)
.json({
message:"Пароль неверный"
});

}

const token=
jwt.sign(
{
id:user.id
},
"SECRET_KEY"
);

res.json({
token,
username
});

}

);

});

module.exports=router;