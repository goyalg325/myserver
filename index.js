import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Security middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'OPTIONS']
}));

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 200 // limit each IP to 120 requests per windowMs
});
app.use(limiter);

// Parse JSON bodies (as sent by API clients)
// app.use(express.json());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
// app.use(express.urlencoded({ extended: false }));

// Serve static files
app.use('/content', express.static(path.join(__dirname, 'public', 'content')));

app.get('/', (req, res) => {
  console.log("REQ", req);
  return res.send('working');
});

// Import routes
import ApiRoutes from './routes/api.js';
app.use('/api', ApiRoutes);

app.listen(port, () => console.log(`server started on port ${port}`));