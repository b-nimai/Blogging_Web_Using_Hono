import { Hono } from 'hono'
import { userRoute } from './routes/user'
import { blogRoute } from './routes/blog'

const app = new Hono<{
	Bindings: {
		DATABASE_URL: string,
    JWT_SECRET: string
	}
}>();


app.route("/api/v1/user", userRoute);
app.route("/api/v1/blog", blogRoute);

// Default route
app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
