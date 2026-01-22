import express, { Express, Request, Response, NextFunction} from "express";
import orderRoutes from "./routes/orderRoutes";
import paymentRoutes from "./routes/paymentRoutes";

const app: Express = express();

// Aumentar límite de body para JSON
app.use(express.json({ limit: '50mb' }));

// Middleware global para loggear todas las peticiones
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[REQUEST] ${req.method} ${req.path} - Headers: ${JSON.stringify(req.headers)}`);
  console.log(`[REQUEST] Body length: ${req.headers['content-length']}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes); 


export default app;