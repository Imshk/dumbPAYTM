const express = require("express");
const zod = require("zod");
const { User, Account } = require("../db"); // Database model import
const jwt = require("jsonwebtoken");
const { authMiddleware } = require("../middleware");
const router = express.Router();
const JWT_SECRET = "your_jwt_secret"; // Make sure to replace this with your secret key

// Signup schema for validation
const signupSchema = zod.object({
    username: zod.string().email(), // Username should be a valid email
    password: zod.string().min(6), // Password should be at least 6 characters long
    firstName: zod.string(),
});

// Signup route
router.post("/signup", async (req, res) => {
    const body = req.body;
    const { success } = signupSchema.safeParse(body);

    // Validate input
    if (!success) {
        return res.status(400).json({
            message: "Invalid input data",
        });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username: body.username });
    if (existingUser) {
        return res.status(400).json({
            message: "Email already taken",
        });
    }
    const user = await User.create({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    })
    const userId = user._id;

    await Account.create({
        userId,
        balance: 1+ Math.random()*10000
    })

    const token = jwt.sign({
        userId
    }, JWT_SECRET);
    
    

    res.json({
        message:"User created successfully",
        token: token
    })
})
//signIn route

// Zod Schema for validating sign-in data
const signinschema= zod.object({
    username: zod.string().email(),
    password: zod.string()
});

router.post("/signin", async (req, res)=>{
 const body = req.body;
 const { success} = signinschema.safeParse(body);

 if(!success){
    return res.status(400).json({
        message: "Invalid input data"
    });
 }
 // check if user exist in the database with matching credentials
 const user = await User.findOne({
    username: req.body.username,
    password: req.body.password
 });

 if(user){
    //generate Jwt token
    const token= jwt.sign({
        userID: user._id,
        username: user.username
    }, JWT_SECRET,{ expiresIn: '1h'});

    res.json({
        message: "Login successful",
        token: token
    });
 } else{
    res.status(400).json({
        message: " Invalid username or password"
    });
 }
}
);

// update user details route 

//zod schema for update validation 

const updateBody= zod.object({
    password: zod.string().optional(), // Password is optional
    firstName: zod.string().optional(), // First name is optional
    lastName: zod.string().optional(), // Last name is optional
})

router.put("/", authMiddleware, async(req, res)=>{
    const{success}= updateBody.safeParse(req.body)
    if(!success){
        res.status(411).json({
            message: "Error while updating information"
        })
    }
    await User.updateOne({_id:req.userID}, req.body);
    res.json({
        message: " Updated successfully"
    })
})
// code to filter name by searching 

router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || ""; // Get the filter from query parameters; default to an empty string if not provided

    const users = await User.find({
        $or: [
            {
                firstName: {
                    "$regex": filter // Use a regular expression to match firstName
                }
            },
            {
                lastName: {
                    "$regex": filter // Use a regular expression to match lastName
                }
            }
        ]
    });

    res.json({
        user: users.map(user => ({
            username: user.username, // Include username in the response
            firstName: user.firstName, // Include firstName in the response
            lastName: user.lastName, // Include lastName in the response
            _id: user._id // Include the user ID in the response
        }))
    });
});


module.exports = router;
