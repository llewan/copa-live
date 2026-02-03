/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import matchRoutes from './routes/matches.js'
import { cronRoutes } from './routes/cron.js'
import createTables from './init_db.js'

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/matches', matchRoutes)
app.use('/api/cron', cronRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * DB Init (Protected)
 */
app.post(
  '/api/init-db',
  async (req: Request, res: Response): Promise<void> => {
    const secret = req.query.secret as string || req.body.secret;
    const adminSecret = process.env.ADMIN_SECRET || 'admin123';
    
    if (secret !== adminSecret) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    
    try {
      await createTables();
      res.json({ success: true, message: 'Database initialized successfully' });
    } catch (error) {
      console.error('Init DB Error:', error);
      res.status(500).json({ success: false, error: 'Failed to initialize database' });
    }
  }
)

/**
 * error handler middleware
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
