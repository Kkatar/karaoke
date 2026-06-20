import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import prisma from './prisma';
import { upload, getFileUrl } from './cloudinary';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_karaoke_key_change_me_in_production';

// Middlewares
app.use(cors());
app.use(express.json());

// Serve local uploads folder statically
const uploadsPath = path.join(process.cwd(), 'uploads');
if (fs.existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath));
}

// Serve client built static assets in production
const clientBuildPath = path.join(process.cwd(), 'client', 'dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
}

// Types for Request with JWT payload
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'USER' | 'ADMIN';
  };
}

// Auth Middleware
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedRequest['user'];
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// Admin Middleware
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access forbidden. Admin role required.' });
  }
  next();
};

// ==========================================
// AUTHENTICATION API ROUTES
// ==========================================

// Register Route
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email, and password.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Check if this is the first user in the system. If so, make them an ADMIN.
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login Route
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Forgot Password Route
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Please provide your email address.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // For security, don't reveal if email exists. Return success anyway.
      return res.json({ message: 'If that email exists, a password reset link has been logged/sent.' });
    }

    // Mock reset token creation
    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '15m' });
    console.log(`\n🔑 [MOCK PASSWORD RESET] Link for ${user.email}:\nhttp://localhost:5173/reset-password?token=${resetToken}\n`);

    return res.json({
      message: 'Password reset link generated. Check the server console log!',
      resetToken // Returned for testing purposes in client
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get User Profile Route
app.get('/api/auth/me', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ==========================================
// SONGS API ROUTES
// ==========================================

// Get All Songs (with filtering, search, pagination)
app.get('/api/songs', async (req: Request, res: Response) => {
  try {
    const search = req.query.search ? String(req.query.search) : undefined;
    const language = req.query.language ? String(req.query.language) : undefined;
    const artist = req.query.artist ? String(req.query.artist) : undefined;
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 8;
    const skip = (page - 1) * limit;

    // Build filter query object
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { artist: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (language && language !== 'All') {
      where.language = { equals: language, mode: 'insensitive' };
    }

    if (artist) {
      where.artist = { equals: artist, mode: 'insensitive' };
    }

    // Fetch filtered songs and count
    const [songs, total] = await prisma.$transaction([
      prisma.song.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.song.count({ where }),
    ]);

    // Fetch list of unique artists for the filters
    const allArtists = await prisma.song.findMany({
      select: { artist: true },
      distinct: ['artist'],
    });
    const uniqueArtists = allArtists.map((a) => a.artist);

    return res.json({
      songs,
      artists: uniqueArtists,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch songs error:', error);
    return res.status(500).json({ error: 'Failed to fetch songs.' });
  }
});

// Get Single Song
app.get('/api/songs/:id', async (req: Request, res: Response) => {
  try {
    const song = await prisma.song.findUnique({
      where: { id: req.params.id },
    });

    if (!song) {
      return res.status(404).json({ error: 'Song not found.' });
    }

    // Get up next/similar recommendations (exclude current song, same language or other randoms)
    const recommendations = await prisma.song.findMany({
      where: {
        id: { not: song.id },
        language: song.language,
      },
      take: 4,
    });

    // Fallback if no matching language songs
    let finalRecs = recommendations;
    if (finalRecs.length < 4) {
      const additional = await prisma.song.findMany({
        where: {
          id: { notIn: [song.id, ...recommendations.map(r => r.id)] }
        },
        take: 4 - finalRecs.length
      });
      finalRecs = [...finalRecs, ...additional];
    }

    return res.json({ song, recommendations: finalRecs });
  } catch (error) {
    console.error('Fetch single song error:', error);
    return res.status(500).json({ error: 'Failed to fetch song details.' });
  }
});

// Create Song (Admin only)
app.post(
  '/api/songs',
  authenticateJWT,
  requireAdmin,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'background', maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const { title, artist, language, lyrics, audioUrl, backgroundUrl } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      let finalAudioUrl = audioUrl || '';
      let finalBackgroundUrl = backgroundUrl || '';

      // Check for file uploads and extract URLs
      if (files) {
        if (files['audio'] && files['audio'][0]) {
          finalAudioUrl = getFileUrl(req, files['audio'][0]);
        }
        if (files['background'] && files['background'][0]) {
          finalBackgroundUrl = getFileUrl(req, files['background'][0]);
        }
      }

      if (!title || !artist || !language || !lyrics) {
        return res.status(400).json({ error: 'Title, artist, language, and lyrics are required.' });
      }

      if (!finalAudioUrl) {
        return res.status(400).json({ error: 'Audio file upload or direct URL is required.' });
      }

      if (!finalBackgroundUrl) {
        // Nature theme random background fallback
        const randId = Math.floor(Math.random() * 1000);
        finalBackgroundUrl = `https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop`;
      }

      const song = await prisma.song.create({
        data: {
          title,
          artist,
          language,
          lyrics,
          audioUrl: finalAudioUrl,
          backgroundUrl: finalBackgroundUrl,
        },
      });

      return res.status(201).json({ message: 'Song created successfully.', song });
    } catch (error: any) {
      console.error('Create song error:', error);
      return res.status(500).json({ error: error.message || 'Failed to create song.' });
    }
  }
);

// Update Song (Admin only)
app.put(
  '/api/songs/:id',
  authenticateJWT,
  requireAdmin,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'background', maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const { title, artist, language, lyrics, audioUrl, backgroundUrl } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      const existingSong = await prisma.song.findUnique({ where: { id: req.params.id } });
      if (!existingSong) {
        return res.status(404).json({ error: 'Song not found.' });
      }

      let finalAudioUrl = audioUrl || existingSong.audioUrl;
      let finalBackgroundUrl = backgroundUrl || existingSong.backgroundUrl;

      // Extract file paths from uploads if present
      if (files) {
        if (files['audio'] && files['audio'][0]) {
          finalAudioUrl = getFileUrl(req, files['audio'][0]);
        }
        if (files['background'] && files['background'][0]) {
          finalBackgroundUrl = getFileUrl(req, files['background'][0]);
        }
      }

      const updatedSong = await prisma.song.update({
        where: { id: req.params.id },
        data: {
          title: title || existingSong.title,
          artist: artist || existingSong.artist,
          language: language || existingSong.language,
          lyrics: lyrics || existingSong.lyrics,
          audioUrl: finalAudioUrl,
          backgroundUrl: finalBackgroundUrl,
        },
      });

      return res.json({ message: 'Song updated successfully.', song: updatedSong });
    } catch (error: any) {
      console.error('Update song error:', error);
      return res.status(500).json({ error: error.message || 'Failed to update song.' });
    }
  }
);

// Delete Song (Admin only)
app.delete('/api/songs/:id', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const existingSong = await prisma.song.findUnique({ where: { id: req.params.id } });
    if (!existingSong) {
      return res.status(404).json({ error: 'Song not found.' });
    }

    await prisma.song.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Song deleted successfully.' });
  } catch (error) {
    console.error('Delete song error:', error);
    return res.status(500).json({ error: 'Failed to delete song.' });
  }
});

// Serve frontend React index.html for all other routing configurations
if (fs.existsSync(clientBuildPath)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 KaraokeHub backend listening on http://localhost:${PORT}`);
});
