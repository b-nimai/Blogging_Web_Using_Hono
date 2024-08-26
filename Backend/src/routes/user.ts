import {Hono} from 'hono'
import { PrismaClient } from '@prisma/client/edge.js' 
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign } from 'hono/jwt'
import { signupInput, signinInput } from '@nimai3800/common'

export const userRoute = new Hono<{
    Bindings: {
		DATABASE_URL: string,
        JWT_SECRET: string
	}
}>();

// Signup route
userRoute.post("/signup", async (c)=> {
    const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate())
    const body = await c.req.json();
    
    try {
      const {success} = signupInput.safeParse(body)
      if(!success){
        throw new Error("Invalid input, try again")
      }
        const existUser = await prisma.user.findFirst({
           where: {
            email: body.email
           }
        })
        if(existUser?.password){
            throw new Error("This email already exist.")
        }
        await prisma.user.create({
            data : {
              email: body.email,
              password: body.password,
              name: body.name,
            }
        })
  
        return c.json({
          success: true,
          message: "Signup successfull"
        })
    } catch (error : any) {
        return c.json({
          success: false,
          message: error.message,
        })
    }
    
})
  
  // Signin Route
userRoute.post("/signin", async (c)=> {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL	,
    }).$extends(withAccelerate());
    const body = await c.req.json();
    try {
      const { success } = signinInput.safeParse(body);
      if(!success) {
        throw new Error("Invalid input, try again")
      }
      const user = await prisma.user.findUnique({
        where: {
          email : body.email
        }
      })
      if(!user) {
        throw new Error("User not found, please check your email.");
      }
      if(body.password != user.password){
        throw new Error("Wrong Password, try again");
      }
      const token = await sign({id: user.id, name: user.name}, c.env.JWT_SECRET);
      return c.json({
        success: true,
        message: "Signin success",
        token
      })
    } catch (error : any) {
      c.status(403);
      return c.json({
        success: false,
        message: error.message
      })
    }
})