import {Hono} from 'hono'
import { PrismaClient } from '@prisma/client/edge.js' 
import { withAccelerate } from '@prisma/extension-accelerate'
import { verify } from 'hono/jwt'
import { createPostInput, updatePostInput } from '@nimai3800/common'

export const blogRoute = new Hono<{
    Bindings: {
		DATABASE_URL: string,
        JWT_SECRET: string
	},
    Variables: {
        userId: string
    }
}>();

// middleware
blogRoute.use(async(c, next) => {
    try {
        const header = c.req.header("authorization") || ""; // Get the token from header
        if(header == "") {
            throw new Error("Token not found");
        }
        const token = header.split(" ")[1]; // Extract token 
        const response = await verify(token, c.env.JWT_SECRET)  // Verify the token
        if(!response.id) {
            throw new Error("User not found");
        }
        c.set('userId', String(response.id));
        await next();
    } catch (error : any) {
        c.status(403);
        return c.json({
            success: false,
            message: error.message
        })
    }
})

// Create Post route
blogRoute.post("/", async (c)=> {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate())
    const body = await c.req.json();
    try {
        const {success} = createPostInput.safeParse(body)
        if(!success) {
            throw new Error("Invalid Inputs, Try again")
        }
        const authorId = c.get("userId")
        const post = await prisma.post.create({
            data: {
                authorId,
                title: body.title,
                content: body.content,
            }
        })
        return c.json({
            postId: post.id
        })
    } catch (error: any) {
        return c.json({
            success: false,
            message: error.message
        })
    }
})

// Update Post route
blogRoute.put("/", async(c)=> {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate())
    const body = await c.req.json();
    const authorId = c.get("userId");
    try {
        const {success} = updatePostInput.safeParse(body)
        if(!success) {
            throw new Error("Invalid Inputs, try again")
        }
        await prisma.post.update({
            where: {
                id: body.id,
                authorId,
            },
            data: {
                title: body.title,
                content: body.content
            }
        })
        return c.json({
            success: true,
            message: "Post is updated successfully"
        })
    } catch (error: any) {
        return c.json({
            success: false,
            message: error.message
        })
    }
})

// Find many Post
blogRoute.get("/bulk", async(c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate())
    try {
        const posts = await prisma.user.findMany()
        return c.json({
            success: true,
            posts
        })
    } catch (error: any) {
        return c.json({
            success: false,
            message: error.message
        })
    }
})

// Find post by id
blogRoute.get("/:id", async(c)=> {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate())
    try {
        const id = c.req.param('id');
        const post = await prisma.post.findUnique({
            where: {
                id
            }
        })
        return c.json({
            success: true,
            post
        })
    } catch (error: any) {
        return c.json({
            success: false,
            message: error.message
        })
    }
})

