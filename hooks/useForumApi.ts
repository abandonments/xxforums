import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

// Add a new hook for generic API calls
export const useForumApi = () => {
    const { getIdToken } = useAuth();

    const get = useCallback(async (url: string) => {
        const idToken = await getIdToken();
        const response = await api.get(url, {
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
        });
        return response.data;
    }, [getIdToken]);

    const post = useCallback(async (url: string, data: any) => {
        const idToken = await getIdToken();
        const response = await api.post(url, data, {
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
        });
        return response.data;
    }, [getIdToken]);

    const put = useCallback(async (url: string, data: any) => {
        const idToken = await getIdToken();
        const response = await api.put(url, data, {
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
        });
        return response.data;
    }, [getIdToken]);

    const del = useCallback(async (url: string) => {
        const idToken = await getIdToken();
        const response = await api.delete(url, {
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
        });
        return response.data;
    }, [getIdToken]);

    return { get, post, put, delete: del };
};

// Define interfaces for your data types (adjust as per your backend models)
interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface Thread {
  id: number;
  category_id: number;
  user_id: number; // This will likely be the primary key of the user in your PostgreSQL db
  username: string; // Joined from users table
  category_name: string; // Joined from categories table
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface Post {
  id: number;
  thread_id: number;
  user_id: number; // This will likely be the primary key of the user in your PostgreSQL db
  username: string; // Joined from users table
  firebase_uid: string; // Joined from users table
  avatar?: string; // Joined from users table
  signature?: string; // Joined from users table
  reputation?: number; // Joined from users table
  content: string;
  created_at: string;
  updated_at: string;
}

// Generic hook for fetching data
function useFetch<T>(
  url: string, 
  dependencies: any[] = [], 
  initialData: T[] = [],
  skipFetch: boolean = false
) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { get } = useForumApi();

  useEffect(() => {
    if (skipFetch) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await get(url);
        setData(response);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, ...dependencies, skipFetch, get]);

  return { data, loading, error, setData };
}

// Hook for Categories
export function useCategories() {
  const { data: categories, loading, error, setData: setCategories } = useFetch<Category>('/api/forum/categories');
  const { post, put, delete: del } = useForumApi();

  const createCategory = useCallback(async (name: string, description?: string) => {
    const response = await post('/api/forum/categories', { name, description });
    setCategories(prev => [...prev, response]);
    return response;
  }, [setCategories, post]);

  const updateCategory = useCallback(async (id: number, name: string, description?: string) => {
    const response = await put(`/api/forum/categories/${id}`, { name, description });
    setCategories(prev => prev.map(cat => cat.id === id ? response : cat));
    return response;
  }, [setCategories, put]);

  const deleteCategory = useCallback(async (id: number) => {
    await del(`/api/forum/categories/${id}`);
    setCategories(prev => prev.filter(cat => cat.id !== id));
  }, [setCategories, del]);

  return { categories, loading, error, createCategory, updateCategory, deleteCategory };
}

export function useCategory(categoryId?: string) {
    const skipFetch = !categoryId;
    const { data: category, loading, error } = useFetch<Category>(
        categoryId ? `/api/forum/categories/${categoryId}` : '', 
        [categoryId], 
        [], 
        skipFetch
    );
    return { category: category.length > 0 ? category[0] : null, loading, error };
}


// Hook for Threads
export function useThreads(categoryId?: string) {
  const url = categoryId ? `/api/forum/threads?categoryId=${categoryId}` : '/api/forum/threads';
  const { data: threads, loading, error, setData: setThreads } = useFetch<Thread>(url, [categoryId]);
  const { post, put, delete: del } = useForumApi();

  const createThread = useCallback(async (category_id: number, title: string, content: string) => {
    const response = await post('/api/forum/threads', { category_id, title, content });
    setThreads(prev => [...prev, response]);
    return response;
  }, [setThreads, post]);

  const updateThread = useCallback(async (id: number, title: string, content: string, category_id?: number) => {
    const response = await put(`/api/forum/threads/${id}`, { title, content, category_id });
    setThreads(prev => prev.map(thread => thread.id === id ? response : thread));
    return response;
  }, [setThreads, put]);

  const deleteThread = useCallback(async (id: number) => {
    await del(`/api/forum/threads/${id}`);
    setThreads(prev => prev.filter(thread => thread.id !== id));
  }, [setThreads, del]);

  return { threads, loading, error, createThread, updateThread, deleteThread };
}

export function useThread(threadId?: string) {
    const skipFetch = !threadId;
    const { data: thread, loading, error } = useFetch<Thread>(
        threadId ? `/api/forum/threads/${threadId}` : '', 
        [threadId], 
        [], 
        skipFetch
    );
    return { thread: thread.length > 0 ? thread[0] : null, loading, error };
}


// Hook for Posts
export function usePosts(threadId?: string) {
    const skipFetch = !threadId;
    const { data: posts, loading, error, setData: setPosts } = useFetch<Post>(
        threadId ? `/api/forum/posts/${threadId}` : '', 
        [threadId], 
        [],
        skipFetch
    );
    const { post, put, delete: del } = useForumApi();

    const createPost = useCallback(async (thread_id: number, content: string) => {
        const response = await post(`/api/forum/threads/${thread_id}/posts`, { content });
        setPosts(prev => [...prev, response]);
        return response;
    }, [setPosts, post]);

    const updatePost = useCallback(async (id: number, content: string) => {
        const response = await put(`/api/forum/posts/${id}`, { content });
        setPosts(prev => prev.map(post => post.id === id ? response : post));
        return response;
    }, [setPosts, put]);

    const deletePost = useCallback(async (id: number) => {
        await del(`/api/forum/posts/${id}`);
        setPosts(prev => prev.filter(post => post.id !== id));
    }, [setPosts, del]);

    return { posts, loading, error, createPost, updatePost, deletePost };
}

export function usePost(postId?: string) {
    const skipFetch = !postId;
    const { data: post, loading, error } = useFetch<Post>(
        postId ? `/api/forum/posts/${postId}` : '', 
        [postId], 
        [], 
        skipFetch
    );
    return { post: post.length > 0 ? post[0] : null, loading, error };
}

