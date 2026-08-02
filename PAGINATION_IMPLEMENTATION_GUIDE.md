# Pagination Implementation Guide

## Overview
This guide explains how to use the standardized `PaginationWrapper` component across the application.

## Quick Start

### 1. Import the Component
```typescript
import { PaginationWrapper } from '../components/PaginationWrapper';
```

### 2. Set Up State
```typescript
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;
const data = [...]; // Your data array

// Calculate pagination values
const totalPages = Math.ceil(data.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);
```

### 3. Render the Component
```typescript
{data.length > 0 && totalPages > 1 && (
  <div className="flex justify-center pt-4">
    <PaginationWrapper
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
    />
  </div>
)}
```

## Component API

### Props

```typescript
interface PaginationWrapperProps {
  // Required
  currentPage: number;                    // Current page (1-indexed)
  totalPages: number;                     // Total number of pages
  onPageChange: (page: number) => void;   // Callback when page changes

  // Optional
  showWhenSinglePage?: boolean;           // Show pagination even with 1 page (default: false)
  className?: string;                     // Additional CSS classes
  itemsCount?: number;                    // Total items count
  itemsPerPage?: number;                  // Items per page
}
```

### Props Explanation

#### Required Props

- **currentPage**: The currently active page number (starts at 1, not 0)
- **totalPages**: Total number of pages calculated from your data
- **onPageChange**: Function called when user clicks a page number or navigation button

#### Optional Props

- **showWhenSinglePage**: By default, pagination hides when there's only 1 page. Set to `true` to always show it.
- **className**: Pass custom Tailwind classes for additional styling
- **itemsCount**: If provided (with `itemsPerPage`), displays item count in pagination header
- **itemsPerPage**: Used with `itemsCount` to display count information

### Behavior

- ✅ Automatically hides when `totalPages <= 1` (unless `showWhenSinglePage={true}`)
- ✅ Previous button disabled on page 1
- ✅ Next button disabled on last page
- ✅ Shows first page, last page, current ±1 pages
- ✅ Shows ellipsis (...) for gaps > 1 page
- ✅ Fully keyboard accessible

## Real-World Examples

### Example 1: Simple List (TraineesPage)
```typescript
export default function TraineesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [trainees, setTrainees] = useState([]);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(trainees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTrainees = trainees.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      <Table>
        <TableBody>
          {paginatedTrainees.map((trainee) => (
            <TableRow key={trainee.id}>
              <TableCell>{trainee.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {trainees.length > 0 && totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <PaginationWrapper
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
}
```

### Example 2: Multiple Paginations (LendingsPage)
```typescript
export default function LendingsPage() {
  const [currentPages, setCurrentPages] = useState({
    borrowed: 1,
    returned: 1,
    overdue: 1,
  });

  const borrowed = lendings.filter(l => l.status === 'active');
  const borrowed TotalPages = Math.ceil(borrowed.length / itemsPerPage);
  const borrowedStartIndex = (currentPages.borrowed - 1) * itemsPerPage;
  const paginatedBorrowed = borrowed.slice(borrowedStartIndex, borrowedStartIndex + itemsPerPage);

  const setCurrentPage = (tab, page) => {
    setCurrentPages(prev => ({ ...prev, [tab]: page }));
  };

  return (
    <Tabs>
      <TabsContent value="borrowed">
        <Table>
          {/* ...table content... */}
        </Table>
        {borrowed.length > 0 && borrowedTotalPages > 1 && (
          <div className="flex justify-center pt-4">
            <PaginationWrapper
              currentPage={currentPages.borrowed}
              totalPages={borrowedTotalPages}
              onPageChange={(page) => setCurrentPage('borrowed', page)}
            />
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
```

### Example 3: Server-Side Pagination (SuperAdminDashboardPage)
```typescript
export default function SuperAdminDashboardPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditCurrentPage, setAuditCurrentPage] = useState(1);
  const AUDIT_LIMIT = 20;

  const fetchAuditLogs = async (page = 1) => {
    const offset = (page - 1) * AUDIT_LIMIT;
    const res = await api.get('/admin/audit-logs', { limit: AUDIT_LIMIT, offset });
    setAuditLogs(res.data?.data ?? []);
    setAuditTotal(res.data?.pagination?.total ?? 0);
    setAuditCurrentPage(page);
  };

  const auditTotalPages = Math.ceil(auditTotal / AUDIT_LIMIT);

  return (
    <>
      <Table>
        {/* ...table content... */}
      </Table>

      {auditTotalPages > 1 && (
        <div className="flex justify-center pt-4">
          <PaginationWrapper
            currentPage={auditCurrentPage}
            totalPages={auditTotalPages}
            onPageChange={(page) => fetchAuditLogs(page)}
          />
        </div>
      )}
    </>
  );
}
```

## Common Patterns

### Pattern 1: Reset to Page 1 on Filter
```typescript
const handleFilterChange = (newFilter) => {
  setFilter(newFilter);
  setCurrentPage(1); // Reset to first page
};
```

### Pattern 2: Disable Pagination During Loading
```typescript
<PaginationWrapper
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={loading ? () => {} : setCurrentPage}
/>
```

### Pattern 3: Display Item Count
```typescript
<PaginationWrapper
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  itemsCount={totalItems}
  itemsPerPage={itemsPerPage}
/>
// Output: "Page 1 of 5 · 45 items"
```

## Migration Checklist

When converting a page to use PaginationWrapper:

- [ ] Import `PaginationWrapper` component
- [ ] Remove old Pagination imports from `../components/ui/pagination`
- [ ] Replace custom pagination component with `PaginationWrapper`
- [ ] Ensure `currentPage` state is properly managed (1-indexed)
- [ ] Calculate `totalPages` correctly
- [ ] Update `onPageChange` handler
- [ ] Test pagination on multiple scenarios (1 page, 2 pages, many pages)
- [ ] Test on mobile devices
- [ ] Verify keyboard navigation works

## Styling

### Default Styling
PaginationWrapper uses the application's default button and pagination styles from `ui/pagination`.

### Custom Styling
```typescript
<PaginationWrapper
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  className="my-custom-class"
/>
```

The component wrapper has class `flex flex-col items-center gap-4` by default.

## Performance Considerations

### Client-Side Pagination
- Best for small datasets (< 10,000 items)
- All data in memory
- Instantaneous page changes

### Server-Side Pagination
- Required for large datasets
- Fetch only current page data
- Calculate offset: `(page - 1) * limit`

```typescript
// Example: Convert page number to offset
const itemsPerPage = 20;
const page = 3;
const offset = (page - 1) * itemsPerPage; // = 40
```

## Troubleshooting

### Pagination Not Showing
```
❌ If pagination doesn't appear:
- Check totalPages > 1
- Verify showWhenSinglePage prop if you expect pagination with 1 page
- Ensure data has been loaded
```

### Page Resets on Render
```
❌ If page resets unexpectedly:
- Check useState for currentPage
- Ensure currentPage isn't being reset elsewhere
- Verify setCurrentPage is passed correctly
```

### Keyboard Navigation Not Working
```
❌ If keyboard navigation fails:
- Check PaginationItem components in ui/pagination
- Verify onClick handlers are present
- Test with screen reader
```

## Testing

### Unit Test Example
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PaginationWrapper } from './PaginationWrapper';

test('PaginationWrapper renders correct pages', () => {
  const mockOnPageChange = jest.fn();
  
  render(
    <PaginationWrapper
      currentPage={1}
      totalPages={5}
      onPageChange={mockOnPageChange}
    />
  );
  
  expect(screen.getByText('1')).toBeInTheDocument();
  expect(screen.getByText('5')).toBeInTheDocument();
  
  fireEvent.click(screen.getByText('2'));
  expect(mockOnPageChange).toHaveBeenCalledWith(2);
});
```

## File Structure

```
Frontend/
├── src/
│   ├── components/
│   │   ├── PaginationWrapper.tsx       ← Main component
│   │   └── ui/
│   │       └── pagination.ts            ← Base components
│   └── pages/
│       ├── TraineesPage.tsx             ✅ Using PaginationWrapper
│       ├── ItemsPage.tsx                ✅ Using PaginationWrapper
│       ├── ProgramsPage.tsx             ✅ Using PaginationWrapper
│       ├── LendingsPage.tsx             ✅ Using PaginationWrapper
│       └── SuperAdminDashboardPage.tsx  ✅ Using PaginationWrapper
```

## References

- Component: `Frontend/src/components/PaginationWrapper.tsx`
- Base UI: `Frontend/src/components/ui/pagination.ts`
- Shadcn/ui Pagination: https://ui.shadcn.com/docs/components/pagination

---

**Last Updated:** August 2, 2026  
**Status:** Current  
**Quality:** Production Ready
