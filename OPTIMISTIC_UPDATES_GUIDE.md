# Optimistic Updates Implementation Guide

## Philosophy

Optimistic updates provide instant user feedback by updating the UI immediately before the server responds. This creates a perception of speed and responsiveness, making the application feel more native-like. When implemented correctly, users experience zero delay between their action and visual feedback.

**Core Principles:**
1. **Instant Feedback**: UI updates immediately upon user action
2. **Background Sync**: Server request happens asynchronously after UI update
3. **Error Rollback**: Failed requests revert the UI to the previous state
4. **Silent Revalidation**: Successful requests silently sync with server data
5. **User Context**: Always close modals/forms immediately after optimistic update

## Architecture Overview

### Tech Stack Used
- **SWR**: Data fetching and caching library
- **Custom Hooks**: Abstraction layer for API mutations
- **Netlify Functions**: Serverless backend endpoints
- **Prisma ORM**: Database operations
- **PostgreSQL**: Primary database (Neon)

### Request Flow

```
User Action
    ↓
Optimistic UI Update (instant, using mutate())
    ↓
Close Modal/Form (instant feedback)
    ↓
API Request to Netlify Function
    ↓
Prisma Database Operation
    ↓
Silent Revalidation (mutate() to sync real data)
    ↓
Toast Notification (success or error)
```

## Implementation Pattern

### 1. Backend Setup (Netlify Functions)

Each CRUD operation requires a dedicated Netlify Function. Follow this standard pattern:

```javascript
// netlify/functions/resource/operation-resource.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Validate HTTP method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const { resourceId, userId, ...data } = JSON.parse(event.body);

    // Validate required fields
    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }

    // Perform database operation
    const result = await prisma.resource.operation({
      where: { id: resourceId },
      data,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { relatedItems: true }
        }
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ resource: result })
    };

  } catch (error) {
    console.error('Operation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Internal server error' 
      })
    };
  } finally {
    // CRITICAL: Always disconnect in serverless
    await prisma.$disconnect();
  }
};
```

#### Required Netlify Functions per Resource

For a complete CRUD implementation, create these functions:

1. **`create-resource.js`** - Create new records
2. **`list-resources.js`** - Fetch all records (with pagination)
3. **`get-resource.js`** - Fetch single record by ID
4. **`update-resource.js`** - Update existing record
5. **`delete-resource.js`** - Delete record by ID
6. **`duplicate-resource.js`** - Clone existing record (if applicable)

#### Key Backend Patterns

**Ownership Validation:**
```javascript
const existing = await prisma.resource.findUnique({
  where: { id: resourceId }
});

if (existing.createdBy !== userId) {
  return {
    statusCode: 403,
    headers,
    body: JSON.stringify({ error: 'Permission denied' })
  };
}
```

**Relationship Checks (before delete):**
```javascript
const resource = await prisma.resource.findUnique({
  where: { id: resourceId },
  include: { _count: { select: { dependencies: true } } }
});

if (resource._count.dependencies > 0) {
  return {
    statusCode: 400,
    headers,
    body: JSON.stringify({ 
      error: 'Cannot delete resource in use' 
    })
  };
}
```

---

### 2. Frontend API Hooks (SWR Layer)

Create a dedicated hook file for each resource following this pattern:

```typescript
// src/hooks/useResources.ts
import useSWR from 'swr';
import { Resource } from '../types';
import { staticConfig } from '../lib/swr-config';
import { useSWRMutation } from './useSWRMutation';
import { post } from '../services/apiService';

// Fetch all resources
export const useResources = (userId?: string) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    resources: Resource[];
    pagination?: any;
  }>(
    userId ? ['/resources-list-resources', { userId }] : null,
    async ([url, params]) => {
      const response = await post(url, params);
      return response;
    },
    staticConfig
  );

  return {
    resources: data?.resources || [],
    pagination: data?.pagination,
    isLoading,
    isValidating,
    error,
    mutate, // CRITICAL: Expose mutate for optimistic updates
  };
};

// Fetch single resource
export const useResource = (resourceId: string, userId?: string) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    resource: Resource;
  }>(
    resourceId ? ['/resources-get-resource', { resourceId, userId }] : null,
    async ([url, params]) => {
      const response = await post(url, params);
      return response;
    },
    staticConfig
  );

  return {
    resource: data?.resource,
    isLoading,
    isValidating,
    error,
    mutate,
  };
};

// Create resource
export const useCreateResource = () => {
  return useSWRMutation(
    '/resources-create-resource',
    'POST',
    {
      invalidateQueries: ['/resources-list-resources'],
    }
  );
};

// Update resource
export const useUpdateResource = () => {
  return useSWRMutation(
    '/resources-update-resource',
    'POST',
    {
      invalidateQueries: ['/resources-list-resources', '/resources-get-resource'],
    }
  );
};

// Delete resource
export const useDeleteResource = () => {
  return useSWRMutation(
    '/resources-delete-resource',
    'POST',
    {
      invalidateQueries: ['/resources-list-resources'],
    }
  );
};

// Duplicate resource
export const useDuplicateResource = () => {
  return useSWRMutation(
    '/resources-duplicate-resource',
    'POST',
    {
      invalidateQueries: ['/resources-list-resources'],
    }
  );
};
```

#### Hook Naming Convention
- **Data hooks**: `useResources()`, `useResource(id)`
- **Mutation hooks**: `useCreateResource()`, `useUpdateResource()`, etc.
- **Endpoints**: `/resources-operation-resource` format (matches Netlify function paths)

---

### 3. Frontend Component Implementation

The component is where optimistic updates happen. Here's the complete pattern:

```typescript
// src/pages/ResourcesPage.tsx
import React, { useState } from 'react';
import { useToast } from '../hooks/useToast';
import { useModalWithAutoId } from '../providers/ModalProvider';
import { useNeon } from '../providers/NeonProvider';
import {
  useResources,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
  useDuplicateResource
} from '../hooks/useResources';
import { Resource } from '../types';

const ResourcesPage: React.FC = () => {
  const { showToast } = useToast();
  const { openModal } = useModalWithAutoId();
  const { authState } = useNeon();
  
  // Fetch resources using SWR
  const { 
    resources, 
    isLoading, 
    error, 
    mutate: mutateResources 
  } = useResources(authState.user?.id);
  
  // Mutation hooks
  const { trigger: createResource } = useCreateResource();
  const { trigger: updateResource } = useUpdateResource();
  const { trigger: deleteResource } = useDeleteResource();
  const { trigger: duplicateResource } = useDuplicateResource();

  // CREATE with Optimistic Update
  const handleCreate = async (formData: any) => {
    if (!authState.user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    try {
      // 1. Create optimistic data with temporary ID
      const optimisticResource = {
        id: `temp-${Date.now()}`,
        ...formData,
        createdBy: authState.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creator: {
          id: authState.user.id,
          name: authState.user.name,
          email: authState.user.email
        }
      };
      
      // 2. Optimistically add to UI (false = don't revalidate)
      mutateResources(
        (current: any) => ({
          ...current,
          resources: [optimisticResource, ...(current?.resources || [])]
        }),
        false // CRITICAL: false prevents immediate revalidation
      );
      
      // 3. Close modal immediately (instant feedback)
      closeModal();
      
      // 4. Make API call in background
      await createResource({
        ...formData,
        userId: authState.user.id
      });
      
      // 5. Silently revalidate to replace temp ID with real ID
      await mutateResources();
      
      // 6. Show success notification
      showToast('Resource created successfully!', 'success');
      
    } catch (error) {
      // 7. Show error and revalidate to remove optimistic update
      showToast(
        error instanceof Error ? error.message : 'Failed to create resource',
        'error'
      );
      mutateResources(); // Rollback
    }
  };

  // UPDATE with Optimistic Update
  const handleUpdate = async (resource: Resource, formData: any) => {
    if (!authState.user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    try {
      // 1. Create updated version
      const updatedResource = {
        ...resource,
        ...formData,
        updatedAt: new Date().toISOString()
      };
      
      // 2. Optimistically update UI
      mutateResources(
        (current: any) => ({
          ...current,
          resources: current.resources.map((r: any) => 
            r.id === resource.id ? updatedResource : r
          )
        }),
        false
      );
      
      // 3. Close modal immediately
      closeModal();
      
      // 4. Make API call
      await updateResource({
        resourceId: resource.id,
        ...formData,
        userId: authState.user.id
      });
      
      // 5. Silently revalidate
      await mutateResources();
      
      showToast('Resource updated successfully!', 'success');
      
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to update resource',
        'error'
      );
      mutateResources(); // Rollback
    }
  };

  // DELETE with Optimistic Update
  const handleDelete = async (id: string) => {
    if (!authState.user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      // 1. Optimistically remove from UI
      mutateResources(
        (current: any) => ({
          ...current,
          resources: current.resources.filter((r: any) => r.id !== id)
        }),
        false
      );
      
      // 2. Make API call
      await deleteResource({
        resourceId: id,
        userId: authState.user.id
      });
      
      // 3. No need to revalidate (item already removed)
      showToast('Resource deleted successfully!', 'success');
      
    } catch (error: any) {
      showToast(
        error?.message || 'Failed to delete resource',
        'error'
      );
      mutateResources(); // Rollback
    }
  };

  // DUPLICATE with Optimistic Update
  const handleDuplicate = async (resource: Resource) => {
    if (!authState.user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    try {
      // 1. Create optimistic duplicate
      const duplicatedResource = {
        ...resource,
        id: `temp-dup-${Date.now()}`,
        name: `${resource.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 2. Optimistically add to UI
      mutateResources(
        (current: any) => ({
          ...current,
          resources: [duplicatedResource, ...(current?.resources || [])]
        }),
        false
      );
      
      // 3. Make API call
      await duplicateResource({
        resourceId: resource.id,
        userId: authState.user.id
      });
      
      // 4. Silently revalidate
      await mutateResources();
      
      showToast('Resource duplicated successfully!', 'success');
      
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to duplicate resource',
        'error'
      );
      mutateResources(); // Rollback
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-text-secondary">
            <i className="fas fa-spinner fa-spin mr-2" />
            Loading resources...
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-error/10 border border-error text-error rounded-lg p-4 mb-6">
          <i className="fas fa-exclamation-triangle mr-2" />
          Failed to load resources. Please try again.
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4">
            {resources.map((resource) => (
              <div key={resource.id} className="bg-surface rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {resource.name}
                    {/* Show saving indicator for optimistic items */}
                    {resource.id.startsWith('temp-') && (
                      <span className="ml-2 text-xs text-primary">
                        (Saving...)
                      </span>
                    )}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(resource, {})}
                      disabled={resource.id.startsWith('temp-')}
                      className="btn-icon"
                    >
                      <i className="fas fa-edit" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(resource)}
                      disabled={resource.id.startsWith('temp-')}
                      className="btn-icon"
                    >
                      <i className="fas fa-copy" />
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      disabled={resource.id.startsWith('temp-')}
                      className="btn-icon"
                    >
                      <i className="fas fa-trash text-error" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ResourcesPage;
```

---

## Critical Implementation Details

### 1. Temporary ID Pattern

**Why**: Optimistically created items need unique IDs before the server generates real ones.

```typescript
const optimisticId = `temp-${Date.now()}`;
const optimisticDuplicateId = `temp-dup-${Date.now()}`;
```

**Detection**: Check if ID starts with `temp-` to:
- Show "Saving..." indicator
- Disable actions (edit, delete, duplicate)
- Apply visual styling (opacity, cursor)

### 2. Mutate Function Signature

```typescript
mutate(
  data,        // New data or updater function
  shouldRevalidate  // false = no immediate server call
)
```

**Updater Function Pattern:**
```typescript
mutate(
  (current: any) => ({
    ...current,
    resources: [newItem, ...current.resources]
  }),
  false  // CRITICAL: prevents immediate revalidation
)
```

### 3. Close Modal Timing

**CORRECT:**
```typescript
// 1. Optimistic update
mutateResources(optimisticData, false);

// 2. Close modal immediately
onClose();

// 3. API call in background
await createResource(data);
```

**INCORRECT:**
```typescript
// API call first = user waits
await createResource(data);

// Then close modal
onClose();
```

### 4. Error Handling & Rollback

```typescript
try {
  // Optimistic update
  mutateResources(optimisticData, false);
  
  // API call
  await updateResource(data);
  
  // Silent revalidation
  await mutateResources();
  
} catch (error) {
  // Show error
  showToast(error.message, 'error');
  
  // CRITICAL: Revalidate to rollback optimistic update
  mutateResources();
}
```

### 5. Silent Revalidation

After successful API calls, silently revalidate to sync with server:

```typescript
// Create/Duplicate: Replace temp ID with real ID
await mutateResources();

// Update: Get latest data from server
await mutateResources();

// Delete: No revalidation needed (item already removed)
```

---

## Templates Feature: Real Implementation

### File Structure
```
netlify/functions/templates/
├── create-template.js       (86 lines)
├── list-templates.js        (81 lines)
├── get-template.js          (66 lines)
├── update-template.js       (115 lines)
├── delete-template.js       (88 lines)
└── duplicate-template.js    (86 lines)

src/hooks/
└── useTemplates.ts          (114 lines)

src/pages/
└── TemplatesPage.tsx        (558 lines)
```

### Key Implementation Highlights

**Optimistic Create (lines 92-133):**
```typescript
const newTemplate = {
  id: `temp-${Date.now()}`,
  name: localForm.name,
  subject: localForm.subject,
  body: localForm.body,
  variables,
  createdBy: authState.user.id,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  creator: { id: authState.user.id, name: authState.user.name, email: authState.user.email },
  _count: { stepEmailActions: 0 }
};

mutateTemplates(
  (current: any) => ({
    ...current,
    templates: [newTemplate, ...(current?.templates || [])]
  }),
  false
);

onClose(); // Close immediately

await createTemplate({ ...data, userId: authState.user.id });
await mutateTemplates(); // Silent revalidation
showToast('Template created successfully!', 'success');
```

**Optimistic Update (lines 54-90):**
```typescript
const updatedTemplate = {
  ...template,
  name: localForm.name,
  subject: localForm.subject,
  body: localForm.body,
  variables,
  updatedAt: new Date().toISOString()
};

mutateTemplates(
  (current: any) => ({
    ...current,
    templates: current.templates.map((t: any) => 
      t.id === template.id ? updatedTemplate : t
    )
  }),
  false
);

onClose(); // Close immediately

await updateTemplate({ templateId: template.id, ...data, userId: authState.user.id });
await mutateTemplates(); // Silent revalidation
showToast('Template updated successfully!', 'success');
```

**Optimistic Delete (lines 308-339):**
```typescript
mutateTemplates(
  (current: any) => ({
    ...current,
    templates: current.templates.filter((t: any) => t.id !== id)
  }),
  false
);

await deleteTemplate({ templateId: id, userId: authState.user.id });
showToast('Template deleted successfully!', 'success');
// No revalidation needed for delete
```

**Optimistic Duplicate (lines 341-380):**
```typescript
const duplicatedTemplate = {
  ...template,
  id: `temp-dup-${Date.now()}`,
  name: `${template.name} (Copy)`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

mutateTemplates(
  (current: any) => ({
    ...current,
    templates: [duplicatedTemplate, ...(current?.templates || [])]
  }),
  false
);

await duplicateTemplate({ templateId: template.id, userId: authState.user.id });
await mutateTemplates(); // Replace temp ID
showToast('Template duplicated successfully!', 'success');
```

**UI Feedback for Saving State (lines 486-489):**
```typescript
{template.id.startsWith('temp-') && (
  <span className="ml-2 text-xs text-primary font-normal">
    (Saving...)
  </span>
)}
```

**Disable Actions During Save (lines 496-498):**
```typescript
disabled={template.id.startsWith('temp-')}
title={template.id.startsWith('temp-') ? 'Saving...' : 'Edit'}
style={{ 
  opacity: template.id.startsWith('temp-') ? 0.5 : 1, 
  cursor: template.id.startsWith('temp-') ? 'not-allowed' : 'pointer' 
}}
```

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Calling mutate() with revalidation = true
```typescript
// WRONG: This triggers immediate server call
mutate(optimisticData, true);
```

**✅ Solution:**
```typescript
// CORRECT: false prevents revalidation
mutate(optimisticData, false);
```

---

### ❌ Pitfall 2: Not closing modals immediately
```typescript
// WRONG: User waits for API response
await createResource(data);
onClose();
```

**✅ Solution:**
```typescript
// CORRECT: Close first, API call in background
mutate(optimisticData, false);
onClose();
await createResource(data);
```

---

### ❌ Pitfall 3: Forgetting error rollback
```typescript
// WRONG: Optimistic update persists on error
try {
  mutate(optimisticData, false);
  await updateResource(data);
} catch (error) {
  showToast('Error', 'error');
  // Missing rollback!
}
```

**✅ Solution:**
```typescript
// CORRECT: Revalidate on error
try {
  mutate(optimisticData, false);
  await updateResource(data);
  await mutate(); // Success revalidation
} catch (error) {
  showToast('Error', 'error');
  mutate(); // Rollback optimistic update
}
```

---

### ❌ Pitfall 4: Modifying state during optimistic update
```typescript
// WRONG: Directly modifying current array
mutate(
  (current: any) => {
    current.resources.push(newItem); // Mutation!
    return current;
  },
  false
);
```

**✅ Solution:**
```typescript
// CORRECT: Create new array
mutate(
  (current: any) => ({
    ...current,
    resources: [newItem, ...current.resources]
  }),
  false
);
```

---

### ❌ Pitfall 5: Not handling temp IDs in UI
```typescript
// WRONG: No indication of saving state
<button onClick={() => handleEdit(resource)}>
  Edit
</button>
```

**✅ Solution:**
```typescript
// CORRECT: Disable and show status
<button
  onClick={() => handleEdit(resource)}
  disabled={resource.id.startsWith('temp-')}
  title={resource.id.startsWith('temp-') ? 'Saving...' : 'Edit'}
>
  Edit
</button>
{resource.id.startsWith('temp-') && (
  <span className="text-primary">(Saving...)</span>
)}
```

---

### ❌ Pitfall 6: Not disconnecting Prisma in serverless
```javascript
// WRONG: Connection pool leak
try {
  const result = await prisma.resource.create(data);
  return { statusCode: 200, body: JSON.stringify(result) };
} catch (error) {
  return { statusCode: 500, body: JSON.stringify({ error }) };
}
```

**✅ Solution:**
```javascript
// CORRECT: Always disconnect
try {
  const result = await prisma.resource.create(data);
  return { statusCode: 200, body: JSON.stringify(result) };
} catch (error) {
  return { statusCode: 500, body: JSON.stringify({ error }) };
} finally {
  await prisma.$disconnect(); // CRITICAL
}
```

---

## Checklist for New Feature Implementation

### Backend (Netlify Functions)
- [ ] Create `create-resource.js` with proper validation
- [ ] Create `list-resources.js` with user filtering and pagination
- [ ] Create `get-resource.js` with ownership check
- [ ] Create `update-resource.js` with ownership validation
- [ ] Create `delete-resource.js` with relationship checks
- [ ] Create `duplicate-resource.js` if applicable
- [ ] Add CORS headers to all functions
- [ ] Handle OPTIONS requests for CORS preflight
- [ ] Always call `await prisma.$disconnect()` in finally block
- [ ] Include related data (creator, counts) in responses
- [ ] Return consistent error format: `{ error: string }`

### Frontend Hooks
- [ ] Create `src/hooks/useResources.ts`
- [ ] Implement `useResources(userId)` for listing
- [ ] Implement `useResource(id, userId)` for single fetch
- [ ] Implement `useCreateResource()` mutation hook
- [ ] Implement `useUpdateResource()` mutation hook
- [ ] Implement `useDeleteResource()` mutation hook
- [ ] Implement `useDuplicateResource()` mutation hook (if applicable)
- [ ] Expose `mutate` function from data hooks
- [ ] Use correct endpoint paths matching Netlify functions
- [ ] Configure `invalidateQueries` in mutation hooks

### Frontend Component
- [ ] Import all CRUD hooks
- [ ] Get `mutate` function from data hook
- [ ] Get `authState.user.id` for userId
- [ ] Implement optimistic create with temp ID
- [ ] Implement optimistic update
- [ ] Implement optimistic delete
- [ ] Implement optimistic duplicate (if applicable)
- [ ] Close modals immediately after optimistic update
- [ ] Call API in background after optimistic update
- [ ] Silent revalidation after success (except delete)
- [ ] Revalidate on error (rollback)
- [ ] Show toast notifications for success/error
- [ ] Display loading state while initial data loads
- [ ] Display error state if initial load fails
- [ ] Show "Saving..." indicator for temp IDs
- [ ] Disable actions for temp IDs
- [ ] Apply visual styling for temp IDs (opacity, cursor)

### Testing
- [ ] Create new item and verify instant feedback
- [ ] Verify modal closes immediately
- [ ] Check item appears with "Saving..." indicator
- [ ] Wait for API call and verify temp ID replaced with real ID
- [ ] Test update operation with instant feedback
- [ ] Test delete operation with instant removal
- [ ] Test duplicate operation with instant appearance
- [ ] Simulate API error and verify rollback
- [ ] Verify error toast appears on failure
- [ ] Test with slow network to see optimistic behavior
- [ ] Refresh page and verify data persists
- [ ] Test with multiple users (ownership checks)
- [ ] Test deleting item with dependencies (should fail)

---

## Performance Considerations

1. **Pagination**: For large datasets, implement pagination in `list-resources.js`:
   ```javascript
   const { page = 1, limit = 10 } = JSON.parse(event.body);
   const skip = (page - 1) * limit;
   
   const [resources, total] = await Promise.all([
     prisma.resource.findMany({ skip, take: limit }),
     prisma.resource.count()
   ]);
   ```

2. **Debouncing**: For search/filter operations, debounce the API calls:
   ```typescript
   const debouncedSearch = useCallback(
     debounce((query) => mutate(), 300),
     []
   );
   ```

3. **Stale-While-Revalidate**: Configure SWR for optimal caching:
   ```typescript
   export const staticConfig = {
     revalidateOnFocus: false,
     revalidateOnReconnect: true,
     dedupingInterval: 2000,
   };
   ```

4. **Selective Revalidation**: Only revalidate related queries:
   ```typescript
   // Instead of revalidating all
   mutate('/resources-list-resources');
   
   // Revalidate specific query
   mutate(['/resources-get-resource', { resourceId }]);
   ```

---

## Summary

**The optimistic update pattern provides:**
- ✅ Instant UI feedback (zero perceived latency)
- ✅ Better user experience (feels native)
- ✅ Graceful error handling (automatic rollback)
- ✅ Consistent patterns across features
- ✅ Reduced cognitive load (users don't wait)

**Key to success:**
1. **Always** update UI first (optimistic)
2. **Always** close modals/forms immediately
3. **Always** make API call in background
4. **Always** revalidate on error (rollback)
5. **Always** disconnect Prisma in serverless
6. **Always** show saving state for temp IDs
7. **Always** validate ownership in backend

Use this guide as a template for implementing CRUD operations with optimistic updates across your entire application. The patterns are proven, battle-tested, and provide exceptional user experience.
