import express from 'express';
import generateRoute from "./routes/userRoutes.js"

const app = express();
app.use(express.json());

app.use("/api" , generateRoute);

app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
});
