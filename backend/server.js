import "./loadEnv.js";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import passport from "passport";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import errorHandler from "./middleware/errorHandler.js";
import itemRoutes from "./routes/item.js";
import buyerRoutes from "./routes/buyer.js";
import purchaseRoutes from "./routes/purchase.js";
import sellerRoutes from "./routes/seller.js";
import stockRoutes from "./routes/stock.js";
import saleRoutes from "./routes/sale.js";
import expenditureRoutes from "./routes/expenditure.js";

const app = express();
const requestedPort = Number(process.env.PORT || 5000);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(
  cors({
    origin: [
      frontendUrl,
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
});

app.use("/api/auth", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/buyers", buyerRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/expenditures", expenditureRoutes);

app.get("/", (req, res) => {
  res.send("MERN auth backend is running");
});

app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(requestedPort, () => {
      console.log(`Server listening on port ${requestedPort}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  });
