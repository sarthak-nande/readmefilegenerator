import express from 'express';
import generateRoute from "./routes/userRoutes.js"

const app = express();
app.use(express.json());

app.get("/" , (req,res) => {
  return res.status(200).send({"message" : "Server is working!"})
})

app.use("/api" , generateRoute);

app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
});
