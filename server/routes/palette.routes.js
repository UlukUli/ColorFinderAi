const router=require("express").Router();

const db=require("../database");

const auth=
require("../middleware/auth");

router.post(
"/save",
auth,
(req,res)=>{

const {
name,
colors
}=req.body;

db.run(
`
INSERT INTO palettes
(userId,name,colors)
VALUES (?,?,?)
`,
[
req.user.id,
name,
JSON.stringify(colors)
],

function(){

res.json({
success:true
});

}

);

}

);

router.get(
"/my",
auth,
(req,res)=>{

db.all(
`
SELECT *
FROM palettes
WHERE userId=?
ORDER BY id DESC
`,
[req.user.id],

(err,rows)=>{

res.json(
rows.map(
p=>({

...p,

colors:
JSON.parse(
p.colors
)

})
)

);

}

);

}

);

module.exports=router;  