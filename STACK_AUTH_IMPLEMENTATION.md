# Stack Auth Implementation Guide

## Overview
This guide provides step-by-step instructions for replacing the mock implementation in `src/lib/neon.ts` with actual Stack Auth API calls.

## Current State
The application currently uses a mock implementation that simulates authentication responses. This prevents runtime errors and allows the app to function, but doesn't provide real authentication.

## Stack Auth API Implementation

### 1. Install Required Dependencies
```bash
npm install @stackframe/react
# Already installed in the project
```

### 2. Replace Mock Implementation

Update `src/lib/neon.ts` with the actual Stack Auth implementation:

```typescript
import {
  createUserProfile as createProfile,
  getUserProfile as getProfile,
  updateUserProfile as updateProfile,
  updateLastLogin as updateLogin,
  confirmUserEmail,
} from './prisma';
import { StackProvider, useStackApp, useUser } from '@stackframe/react';

// Neon Auth environment variables
const projectId = import.meta.env.VITE_STACK_PROJECT_ID;
const publishableClientKey = import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;

// Create Stack Auth configuration
export const stackConfig = {
  projectId: projectId || '905c7a50-646f-4050-9a10-6273e8df7d8c',
  publishableClientKey: publishableClientKey || 'pck_dtg05emfhyz40mbxenjd16b9w5kg2673bg56qdhnqpqwr',
};

// Export StackProvider for the app root
export { StackProvider, useStackApp, useUser };

// Auth helper functions using Stack Auth
export const signUp = async (email: string, password: string, options?: { 
  data?: { 
    name?: string; 
    company?: string; 
    title?: string; 
  } 
}) => {
  try {
    const stackApp = useStackApp();
    const result = await stackApp.signUp({
      email,
      password,
      displayName: options?.data?.name,
    });
    
    return result;
  } catch (error: any) {
    console.error('Stack Auth signUp error:', error);
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const stackApp = useStackApp();
    const result = await stackApp.signInWithPassword({
      email,
      password,
    });
    
    return result;
  } catch (error: any) {
    console.error('Stack Auth signIn error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    const stackApp = useStackApp();
    await stackApp.signOut();
  } catch (error: any) {
    console.error('Stack Auth signOut error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const user = useUser();
    return user;
  } catch (error: any) {
    console.error('Stack Auth getCurrentUser error:', error);
    return null;
  }
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  try {
    const stackApp = useStackApp();
    // Stack Auth handles state changes through React hooks
    // You might need to use useEffect in components to listen to auth changes
    return () => {}; // Return empty unsubscribe function
  } catch (error: any) {
    console.error('Stack Auth onAuthStateChange error:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

export const resetPassword = async (email: string) => {
  try {
    const stackApp = useStackApp();
    await stackApp.sendPasswordResetEmail(email);
  } catch (error: any) {
    console.error('Stack Auth resetPassword error:', error);
    throw error;
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    const stackApp = useStackApp();
    await stackApp.updateUser({
      password: newPassword,
    });
  } catch (error: any) {
    console.error('Stack Auth updatePassword error:', error);
    throw error;
  }
};

// Database helper functions using Prisma (keep these as they are)
export const createUserProfile = async (user: any) => {
  try {
    return await createProfile(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return await getUserProfile(user.id);
    }
    throw error;
  }
};

export const getUserProfile = async (neonId: string) => {
  return await getProfile(neonId);
};

export const updateUserProfile = async (neonId: string, updates: any) => {
  return await updateProfile(neonId, updates);
};

export const updateLastLogin = async (neonId: string) => {
  return await updateLogin(neonId);
};

export const updateUserEmailConfirmation = async (neonId: string) => {
  return await confirmUserEmail(neonId);
};

export const resendConfirmationEmail = async (email: string) => {
  try {
    const stackApp = useStackApp();
    await stackApp.resendVerificationEmail(email);
  } catch (error: any) {
    console.error('Stack Auth resendConfirmationEmail error:', error);
    throw error;
  }
};
```

### 3. Update NeonProvider

The `NeonProvider.tsx` needs to be updated to work with Stack Auth hooks:

```typescript
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { useStackApp, useUser } from '@stackframe/react';
import { 
  createUserProfile,
  getUserProfile,
  updateLastLogin,
  updateUserEmailConfirmation,
} from '../lib/neon';
import { LoginCredentials, SignupCredentials } from '../types';

interface NeonContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<User>;
  signup: (credentials: SignupCredentials) => Promise<{ user: any; needsConfirmation: boolean }>;
  logout: () => Promise<void>;
  resetPasswordRequest: (email: string) => Promise<void>;
  confirmPasswordReset: (newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
}

const NeonContext = createContext<NeonContextType | undefined>(undefined);

export const useNeon = () => {
  const context = useContext(NeonContext);
  if (context === undefined) {
    throw new Error('useNeon must be used within a NeonProvider');
  }
  return context;
};

interface NeonProviderProps {
  children: ReactNode;
}

export const NeonProvider: React.FC<NeonProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  const stackApp = useStackApp();
  const stackUser = useUser();

  const mapStackUserToAppUser = async (stackUserObj: any): Promise<User | null> => {
    if (!stackUserObj) return null;

    try {
      let userProfile = await getUserProfile(stackUserObj.id);
      
      if (!userProfile) {
        userProfile = await createUserProfile(stackUserObj);
      } else {
        await updateLastLogin(stackUserObj.id);
      }

      if (!userProfile) {
        throw new Error('Failed to create or retrieve user profile');
      }

      return {
        id: userProfile.id,
        neonId: stackUserObj.id,
        name: userProfile.name || stackUserObj.displayName || '',
        email: userProfile.email || stackUserObj.primaryEmail || '',
        company: userProfile.company || undefined,
        title: userProfile.title || undefined,
        isActive: userProfile.isActive,
        lastLoginAt: userProfile.lastLoginAt?.toISOString() || undefined,
        createdAt: userProfile.createdAt.toISOString(),
        emailConfirmed: stackUserObj.emailVerified || false,
      };
    } catch (error) {
      console.error('Error mapping Stack user to app user:', error);
      return null;
    }
  };

  // Update auth state when Stack user changes
  useEffect(() => {
    const updateAuthState = async () => {
      if (stackUser) {
        const user = await mapStackUserToAppUser(stackUser);
        setAuthState({
          isAuthenticated: !!user,
          user,
          loading: false,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }
    };

    updateAuthState();
  }, [stackUser]);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      await stackApp.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      // The user state will be updated by the useEffect above
      return authState.user!;
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials): Promise<{ user: any; needsConfirmation: boolean }> => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await stackApp.signUp({
        email: credentials.email,
        password: credentials.password,
        displayName: credentials.name,
      });

      if (result.user) {
        await createUserProfile(result.user);
      }

      setAuthState(prev => ({ ...prev, loading: false }));

      return {
        user: result.user,
        needsConfirmation: !result.session,
      };
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await stackApp.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const resetPasswordRequest = async (email: string): Promise<void> => {
    await stackApp.sendPasswordResetEmail(email);
  };

  const confirmPasswordReset = async (newPassword: string): Promise<void> => {
    await stackApp.updateUser({
      password: newPassword,
    });
  };

  const refreshUser = async (): Promise<void> => {
    // Stack Auth handles user state automatically through hooks
    // This function can be used to trigger a refresh if needed
  };

  const resendConfirmationEmailHandler = async (email: string): Promise<void> => {
    await stackApp.resendVerificationEmail(email);
  };

  const value: NeonContextType = {
    authState,
    login,
    signup,
    logout,
    resetPasswordRequest,
    confirmPasswordReset,
    refreshUser,
    resendConfirmationEmail: resendConfirmationEmailHandler,
  };

  return (
    <NeonContext.Provider value={value}>
      {children}
    </NeonContext.Provider>
  );
};
```

### 4. Testing

After implementing the Stack Auth integration:

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Test authentication flows:**
   - User signup
   - Email confirmation
   - Login/logout
   - Password reset
   - Protected routes

3. **Check browser console** for any Stack Auth related errors

### 5. Database Migration

Run the database migration to update the schema:
```bash
npm run db:migrate
```

Or manually execute:
```sql
ALTER TABLE "User" RENAME COLUMN "supabaseUserId" TO "neonUserId";
```

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure `.env` file is in the project root
   - Restart the development server after changing environment variables
   - Check that variables start with `VITE_` prefix

2. **Stack Auth Hook Errors**
   - Ensure components using Stack Auth hooks are wrapped in StackProvider
   - Check that App.tsx has the correct provider hierarchy

3. **TypeScript Errors**
   - Run `npm run type-check` to identify type issues
   - Ensure all imports are correctly typed

4. **Authentication Not Working**
   - Check browser console for Stack Auth errors
   - Verify Stack Auth project configuration
   - Ensure email/password requirements match Stack Auth settings

## Next Steps

1. Implement the actual Stack Auth API as described above
2. Test all authentication flows
3. Update error handling for Stack Auth specific errors
4. Add email verification templates in Stack Auth dashboard
5. Configure password reset templates in Stack Auth dashboard
6. Update deployment configuration for production

## Resources

- [Stack Auth Documentation](https://docs.stack-auth.com/)
- [Stack Auth React Guide](https://docs.stack-auth.com/react)
- [Neon Auth Documentation](https://neon.com/docs/neon-auth)
