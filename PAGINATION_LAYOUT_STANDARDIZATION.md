# Pagination Layout Standardization

**Date:** August 2, 2026  
**Status:** In Progress  
**Commit:** `4b5f115`

## Overview

All pagination layouts across the application have been standardized to use a consistent, reusable `PaginationWrapper` component. This ensures:
- ✅ Consistent user experience
- ✅ Easier maintenance
- ✅ Better code reusability
- ✅ Cleaner JSX in page components

---

## New Component: `PaginationWrapper`

**Location:** `Frontend/src/components/PaginationWrapper.tsx`

### Usage Example

```typescript
import PaginationWrapper from '../components/PaginationWrapper';

// In your component:
<PaginationWrapper
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  itemsCount={filteredItems.length}
  itemsPerPage={itemsPerPage}
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `currentPage` | `number` | ✅ | - | Current active page |
| `totalPages` | `number` | ✅ | - | Total number of pages |
| `onPageChange` | `(page: number) => void` | ✅ | - | Callback when page changes |
| `showWhenSinglePage` | `boolean` | ❌ | `false` | Show pagination even if only 1 page |
| `className` | `string` | ❌ | `''` | Additional CSS classes |
| `itemsCount` | `number` | ❌ | `undefined` | Total items (shows count info) |
| `itemsPerPage` | `number` | ❌ | `undefined` | Items per page (shows page info) |

### Features

- ✅ Automatically hides when 1 page or less
- ✅ Shows first, last, current ±1 pages with ellipsis for gaps
- ✅ Disabled state for prev/next when at boundaries
- ✅ Optional item count display
- ✅ Responsive and accessible

---

## Pages Updated

### ✅ Completed

1. **TraineesPage** (`Frontend/src/pages/TraineesPage.tsx`)
   - Shows: Current page info & item count
   - Migrated from: 44 lines of pagination code → 8 lines

2. **ItemsPage** (`Frontend/src/pages/ItemsPage.tsx`)
   - Shows: Current page info & item count
   - Migrated from: 44 lines of pagination code → 8 lines

### 🔄 In Progress / Remaining

3. **ProgramsPage** (`Frontend/src/pages/ProgramsPage.tsx`)
   - Status: Imports updated, needs JSX replacement
   - Note: Has separate pagination for table view

4. **LendingsPage** (`Frontend/src/pages/LendingsPage.tsx`)
   - Status: Not started
   - Note: Has multiple pagination controls (borrowed, returned, overdue)

5. **SuperAdminDashboardPage** (`Frontend/src/pages/SuperAdminDashboardPage.tsx`)
   - Status: Not started
   - Note: Has audit log pagination in table

---

## Before & After

### Before (Old Pattern)
```typescript
{filteredItems.length > 0 && totalPages > 1 && (
  <div className="flex justify-center">
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            size={undefined}
          />
        </PaginationItem>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
            return (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                  size={undefined}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            );
          } else if (page === currentPage - 2 || page === currentPage + 2) {
            return (
              <PaginationItem key={page}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
        })}

        <PaginationItem>
          <PaginationNext 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            size={undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  </div>
)}
```

### After (New Pattern)
```typescript
{filteredItems.length > 0 && totalPages > 1 && (
  <div className="mt-6 flex justify-center">
    <PaginationWrapper
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      itemsCount={filteredItems.length}
      itemsPerPage={itemsPerPage}
    />
  </div>
)}
```

**Reduction:** ~44 lines → 8 lines per page! 🎉

---

## Layout Improvements

### Spacing
- Added `mt-6` margin above pagination for better separation from content
- Centered alignment maintained
- Responsive flexbox layout

### Information Display
- Shows current page and total pages
- Shows item count (optional)
- Helps users understand their position in results

### Accessibility
- Previous/Next buttons disabled when at boundaries
- Keyboard navigation support
- ARIA labels from shadcn/ui components

---

## Migration Checklist

- [x] Create `PaginationWrapper` component
- [x] Update `TraineesPage`
- [x] Update `ItemsPage`
- [ ] Update `ProgramsPage` (remove old imports)
- [ ] Update `LendingsPage` (handle multiple paginations)
- [ ] Update `SuperAdminDashboardPage`
- [ ] Remove pagination UI imports from updated pages
- [ ] Test all pagination on each page
- [ ] Verify responsive behavior on mobile

---

## How to Complete the Migration

### For each remaining page:

1. **Import the component:**
   ```typescript
   import PaginationWrapper from '../components/PaginationWrapper';
   ```

2. **Remove old pagination imports:**
   ```typescript
   // Remove these imports
   import {
     Pagination,
     PaginationContent,
     PaginationEllipsis,
     PaginationItem,
     PaginationLink,
     PaginationNext,
     PaginationPrevious,
   } from '../components/ui/pagination';
   ```

3. **Replace pagination JSX:**
   ```typescript
   // Old: ~44 lines of pagination code
   // New: Just use PaginationWrapper
   {totalPages > 1 && (
     <div className="mt-6 flex justify-center">
       <PaginationWrapper
         currentPage={currentPage}
         totalPages={totalPages}
         onPageChange={setCurrentPage}
         itemsCount={filteredItems.length}
         itemsPerPage={itemsPerPage}
       />
     </div>
   )}
   ```

4. **Test thoroughly:**
   - Verify pagination appears/disappears correctly
   - Click through all pages
   - Test prev/next buttons
   - Check mobile responsiveness

---

## Benefits

✅ **Consistency**: Same look, feel, and behavior across all pages  
✅ **Maintainability**: Single source of truth for pagination  
✅ **DRY**: No code duplication  
✅ **Cleaner Code**: Pages are easier to read  
✅ **Easier Updates**: Change pagination behavior in one place  
✅ **Better UX**: Users know exactly where they are in results  

---

## Files Changed

| File | Status | Changes |
|------|--------|---------|
| `Frontend/src/components/PaginationWrapper.tsx` | Created | New reusable component |
| `Frontend/src/pages/TraineesPage.tsx` | Updated | Using PaginationWrapper |
| `Frontend/src/pages/ItemsPage.tsx` | Updated | Using PaginationWrapper |
| `Frontend/src/pages/ProgramsPage.tsx` | Partial | Imports updated only |
| `Frontend/src/pages/LendingsPage.tsx` | Pending | - |
| `Frontend/src/pages/SuperAdminDashboardPage.tsx` | Pending | - |

---

## Commit History

- `4b5f115` - Add standardized PaginationWrapper component and update TraineesPage and ItemsPage to use it

