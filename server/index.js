import express from 'express';
import cors from "cors";
import generateRoute from "./routes/userRoutes.js"

const app = express();
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true               
}));

app.get("/" , (req,res) => {
  return res.status(200).send({"message" : "Server is working!"})
})

app.use("/api" , generateRoute);

app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
});
