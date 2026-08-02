import { Request, Response } from 'express';
import { eq, isNotNull, and, ne } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users } from '../db/schema';
import { generateToken } from '../utils/token';

const safeParams = '&mouth=default,smile,twinkle&eyes=default,happy,wink';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }

    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Auto assign avatar if missing
    let userAvatarUrl = user.avatar;
    if (!userAvatarUrl) {
      userAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=b6e3f4${safeParams}`;
      await db.update(users).set({ avatar: userAvatarUrl }).where(eq(users.id, user.id));
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Return user data (excluding password)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: userAvatarUrl
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
      return;
    }

    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4${safeParams}`;

    // Create user (default role: UMUM)
    const [user] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: 'UMUM',
      avatar: defaultAvatar
    }).$returningId();

    // Get the created user
    const [createdUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);

    // Generate token
    const token = generateToken({
      userId: createdUser.id,
      email: createdUser.email,
      role: createdUser.role
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
          avatar: createdUser.avatar || defaultAvatar
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatar: users.avatar,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getAllUserAvatars = async (_req: Request, res: Response): Promise<void> => {
  try {
    const allUsers = await db.select({
      userId: users.id,
      name: users.name,
      avatar: users.avatar
    }).from(users).where(isNotNull(users.avatar));

    res.status(200).json({
      success: true,
      data: allUsers.filter(u => u.avatar && u.avatar.trim() !== '')
    });
  } catch (error) {
    console.error('Get all avatars error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch taken avatars'
    });
  }
};

export const updateUserAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { avatarUrl } = req.body;

    if (!userId || !avatarUrl) {
      res.status(400).json({ success: false, message: 'Avatar URL is required' });
      return;
    }

    // Check if another user is already using this avatar
    const [existing] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(and(eq(users.avatar, avatarUrl), ne(users.id, userId)))
      .limit(1);

    if (existing) {
      res.status(400).json({
        success: false,
        message: `Avatar ini sudah digunakan oleh ${existing.name}`
      });
      return;
    }

    // Update avatar in MySQL
    await db.update(users).set({ avatar: avatarUrl }).where(eq(users.id, userId));

    // Get updated user profile
    const [updatedUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatar: users.avatar
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update user avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user avatar'
    });
  }
};
