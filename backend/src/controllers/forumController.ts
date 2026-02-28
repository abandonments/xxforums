import { Response, NextFunction, Request } from 'express';
import knex from 'knex';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const knexfile: any = require('../../../knexfile.cjs');
import { validationResult } from 'express-validator'; // Keep validationResult
import { categoryCache } from '../lib/cache.js'; // Import categoryCache
import { createNotification } from './notificationController.js'; // Import createNotification


const knexInstance = knex((knexfile as any).development);

// CATEGORY CONTROLLERS
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Ensure user is authenticated to create category
    if (!req.firebaseUser) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }

    // Optional: Add authorization check based on user role if only certain roles can create categories
    // const currentUser = await knexInstance('users').where({ firebase_uid: req.firebaseUser.uid }).first();
    // if (!currentUser || !['admin', 'root'].includes(currentUser.role)) {
    //   return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
    // }

    const { name, description } = req.body;
    const [newCategory] = await knexInstance('categories').insert({ name, description }).returning('*');
    categoryCache.del('categories'); // Invalidate cache on creation
    res.status(201).json(newCategory);
  } catch (error) {
    next(error);
  }
};

export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cachedCategories = categoryCache.get<any[]>('categories');
    if (cachedCategories) {
      return res.status(200).json(cachedCategories);
    }

    const categories = await knexInstance('categories').select('*');
    categoryCache.set('categories', categories);
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const category = await knexInstance('categories').where({ id }).first();
    if (!category) {
      return res.status(404).json({ message: `Category with ID ${id} not found.` });
    }
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description } = req.body;

    // Authorization check for updating category
    if (!req.firebaseUser) {
        return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }
    const currentUser = await knexInstance('users').where({ firebase_uid: req.firebaseUser.uid }).first();
    if (!currentUser || !['admin', 'root'].includes(currentUser.role)) {
        return res.status(403).json({ message: 'Forbidden: Only admin or root can update categories.' });
    }

    const [updatedCategory] = await knexInstance('categories')
      .where({ id })
      .update({ name, description, updated_at: knexInstance.fn.now() })
      .returning('*');
    if (!updatedCategory) {
      return res.status(404).json({ message: `Category with ID ${id} not found.` });
    }
    res.status(200).json(updatedCategory);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Authorization check for deleting category
    if (!req.firebaseUser) {
        return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }
    const currentUser = await knexInstance('users').where({ firebase_uid: req.firebaseUser.uid }).first();
    if (!currentUser || !['admin', 'root'].includes(currentUser.role)) {
        return res.status(403).json({ message: 'Forbidden: Only admin or root can delete categories.' });
    }

    const deletedCount = await knexInstance('categories').where({ id }).del();
    if (deletedCount === 0) {
      return res.status(404).json({ message: `Category with ID ${id} not found.` });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// THREAD CONTROLLERS
export const createThread = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category_id, title, content } = req.body;
    if (!req.firebaseUser) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }

    const user = await knexInstance('users').where({ firebase_uid: req.firebaseUser.uid }).first();
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.is_banned) {
      return res.status(403).json({ message: 'Forbidden: Banned users cannot create threads.' });
    }

    const [newThread] = await knexInstance('threads')
      .insert({ category_id, user_id: user.id, title, content })
      .returning('*');
    res.status(201).json(newThread);
  } catch (error) {
    next(error);
  }
};

export const getAllThreads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = req.query;
    let queryBuilder = knexInstance('threads') // Renamed to avoid conflict with query function
      .select('threads.*', 'users.username', 'categories.name as category_name', 'users.firebase_uid', 'users.avatarUrl', 'users.reputation', 'users.role as authorRole') // Added more user fields
      .join('users', 'threads.user_id', '=', 'users.id')
      .join('categories', 'threads.category_id', '=', 'categories.id');

    if (categoryId) {
      queryBuilder = queryBuilder.where('category_id', categoryId as string);
    }

    const threads = await queryBuilder;
    res.status(200).json(threads);
  } catch (error) {
    next(error);
  }
};

export const getThreadById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const thread = await knexInstance('threads')
      .select('threads.*', 'users.username', 'categories.name as category_name', 'users.firebase_uid', 'users.avatarUrl', 'users.reputation', 'users.role as authorRole') // Added more user fields
      .join('users', 'threads.user_id', '=', 'users.id')
      .join('categories', 'threads.category_id', '=', 'categories.id')
      .where('threads.id', id)
      .first();

    if (!thread) {
      return res.status(404).json({ message: `Thread with ID ${id} not found.` });
    }
    res.status(200).json(thread);
  } catch (error) {
    next(error);
  }
};

export const updateThread = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, content, category_id } = req.body;
    if (!req.firebaseUser) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }

    const thread = await knexInstance('threads').where({ id }).first();
    if (!thread) {
      return res.status(404).json({ message: `Thread with ID ${id} not found.` });
    }

    const user = await knexInstance('users').where({ firebase_uid: req.firebaseUser.uid }).first();
    if (!user || (user.id !== thread.user_id && user.role !== 'admin' && user.role !== 'root')) { // Changed 'moderator' to 'root' for broader admin control
      return res.status(403).json({ message: 'Forbidden: You do not have permission to update this thread.' });
    }

    const [updatedThread] = await knexInstance('threads')
      .where({ id })
      .update({ title, content, category_id, updated_at: knexInstance.fn.now() })
      .returning('*');

    res.status(200).json(updatedThread);
  } catch (error) {
    next(error);
  }
};

export const deleteThread = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!req.firebaseUser) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }

    const thread = await knexInstance('threads').where({ id }).first();
    if (!thread) {
      return res.status(404).json({ message: `Thread with ID ${id} not found.` });
    }

    const user = await knexInstance('users').where({ firebase_uid: req.firebaseUser.uid }).first();
    if (!user || (user.id !== thread.user_id && user.role !== 'admin' && user.role !== 'root')) { // Changed 'moderator' to 'root' for broader admin control
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this thread.' });
    }

    const deletedCount = await knexInstance('threads').where({ id }).del();
    if (deletedCount === 0) {
      // This case should theoretically not be hit if thread was found above
      return res.status(404).json({ message: `Thread with ID ${id} not found during deletion.` });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// POST CONTROLLERS
export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { threadId } = req.params;
    const { content } = req.body;

    if (!req.firebaseUser) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }

    const user = await knexInstance('users').where({ firebase_uid: req.firebaseUser.uid }).first();
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.is_banned) {
      return res.status(403).json({ message: 'Forbidden: Banned users cannot create posts.' });
    }

    const thread = await knexInstance('threads').where({ id: threadId }).first();
    if (!thread) {
      return res.status(404).json({ message: `Thread with ID ${threadId} not found.` });
    }

    const [newPost] = await knexInstance('posts')
      .insert({ thread_id: threadId, user_id: user.id, content })
      .returning('*');

    // Notify the thread author
    if (thread.user_id !== user.id) {
      createNotification(
        thread.user_id,
        'new_reply',
        `${user.username} replied to your thread "${thread.title}"`
      );
    }

    res.status(201).json(newPost);
  } catch (error) {
    next(error);
  }
};

export const getPostsByThreadId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req); // This validation check here for GET is unusual unless query params are validated
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { threadId } = req.params;

    const posts = await knexInstance('posts')
      .select(
        'posts.*',
        'users.username',
        'users.firebase_uid',
        'users.avatarUrl', // Changed to avatarUrl for consistency
        'users.signature',
        'users.reputation',
        'users.role as authorRole' // Added authorRole
      )
      .join('users', 'posts.user_id', '=', 'users.id')
      .where('posts.thread_id', threadId)
      .orderBy('posts.created_at', 'asc');

    if (posts.length === 0) {
      // It's acceptable for a thread to have no posts other than the OP, so 404 might be too strong
      // If thread exists but no replies, it's not a 404 for the thread itself.
      // return res.status(404).json({ message: 'No posts found for this thread.' });
    }

    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};

export const getPostById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req); // This validation check here for GET is unusual unless query params are validated
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const post = await knexInstance('posts')
      .select(
        'posts.*',
        'users.username',
        'users.firebase_uid',
        'users.avatarUrl', // Changed to avatarUrl for consistency
        'users.signature',
        'users.reputation',
        'users.role as authorRole' // Added authorRole
      )
      .join('users', 'posts.user_id', '=', 'users.id')
      .where('posts.id', id)
      .first();

    if (!post) {
      return res.status(404).json({ message: `Post with ID ${id} not found.` });
    }

    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content } = req.body;

    if (!req.firebaseUser) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }

    const post = await knexInstance('posts').where({ id }).first();
    if (!post) {
      return res.status(404).json({ message: `Post with ID ${id} not found.` });
    }

    const user = await knexInstance('users').where({ firebase_uid: req.firebaseUser.uid }).first();
    if (!user || (user.id !== post.user_id && user.role !== 'admin' && user.role !== 'root')) { // Changed 'moderator' to 'root' for broader admin control
      return res.status(403).json({ message: 'Forbidden: You do not have permission to update this post.' });
    }
    if (user.is_banned) {
      return res.status(403).json({ message: 'Forbidden: Banned users cannot update posts.' });
    }

    const [updatedPost] = await knexInstance('posts')
      .where({ id })
      .update({ content, updated_at: knexInstance.fn.now() })
      .returning('*');

    res.status(200).json(updatedPost);
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req); // This validation check here for DELETE is unusual unless query params are validated
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    if (!req.firebaseUser) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }

    const post = await knexInstance('posts').where({ id }).first();
    if (!post) {
      return res.status(404).json({ message: `Post with ID ${id} not found.` });
    }

    const user = await knexInstance('users').where({ firebase_uid: req.firebaseUser.uid }).first();
    if (!user || (user.id !== post.user_id && user.role !== 'admin' && user.role !== 'root')) { // Changed 'moderator' to 'root' for broader admin control
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this post.' });
    }
    if (user.is_banned) {
      return res.status(403).json({ message: 'Forbidden: Banned users cannot delete posts.' });
    }


    const deletedCount = await knexInstance('posts').where({ id }).del();
    if (deletedCount === 0) {
      // This case should theoretically not be hit if post was found earlier
      return res.status(404).json({ message: `Post with ID ${id} not found during deletion.` });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};