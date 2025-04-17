import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import express, { Request, Response } from 'express';
import session from 'express-session';

// Extend the Express Session interface to include userId
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Setup authentication middleware
export function setupAuth(app: express.Express) {
  // Configure session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'flosenseio-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Authentication endpoints
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      // Log the request body for debugging
      console.log('Login request:', req.body);
      
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      // Find user in database
      const result = await db.select().from(users).where(eq(users.username, username));
      
      if (!result || result.length === 0) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      const user = result[0];

      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      // Set user in session
      req.session.userId = user.id;
      
      // Ensure session is saved before responding
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Error saving session' });
        }
        
        // Return user info (excluding password)
        res.status(200).json({
          id: user.id,
          username: user.username,
          success: true
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error', error: String(error) });
    }
  });

  // Get current user
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      // Find user in database
      const result = await db.select().from(users).where(eq(users.id, userId));
      
      if (!result || result.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const user = result[0];

      // Return user info (excluding password)
      res.status(200).json({
        id: user.id,
        username: user.username
      });
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json({ message: 'Internal server error', error: String(error) });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(200).json({ message: 'Already logged out' });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed', error: String(err) });
      }
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
}
