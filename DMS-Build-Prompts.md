# Document Management System - Sequential Build Prompts for Agentic IDE

## Overview
These prompts are ordered to build the application incrementally, minimizing rework and maximizing code reuse. Each prompt builds upon the previous ones.

---

## PHASE 1: Project Foundation & Setup

### Prompt 1: Project Initialization & Basic Structure
```
Create a new React project using Vite with the following specifications:

PROJECT SETUP:
- Initialize with: npm create vite@latest document-management-system -- --template react
- Install dependencies: react-router-dom, json-server, axios (or fetch wrapper)
- Configure json-server with a db.json file

PROJECT STRUCTURE:
Create the following folder structure:
src/
├── components/
│   ├── common/         (reusable UI components)
│   ├── layout/         (headers, sidebars, layouts)
│   └── auth/           (login, protected routes)
├── contexts/           (React Context providers)
├── reducers/           (useReducer logic)
├── hooks/              (custom React hooks)
├── pages/              (route pages)
├── services/           (API calls)
├── utils/              (helper functions)
├── constants/          (constants, enums)
└── styles/             (global styles)

INITIAL DATA MODEL (db.json):
{
  "users": [
    {
      "id": "1",
      "email": "admin@dms.com",
      "password": "admin123",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin",
      "departments": ["1"],
      "status": "active",
      "avatar": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastActive": "2024-04-17T00:00:00.000Z"
    },
    {
      "id": "2",
      "email": "user@dms.com",
      "password": "user123",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "departments": ["1"],
      "status": "active",
      "avatar": null,
      "createdAt": "2024-01-15T00:00:00.000Z",
      "lastActive": "2024-04-17T00:00:00.000Z"
    }
  ],
  "documents": [],
  "comments": [],
  "departments": [
    {
      "id": "1",
      "name": "Engineering",
      "description": "Engineering Department",
      "managerId": "1",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "categories": [
    {
      "id": "1",
      "name": "Reports",
      "description": "Company reports and analytics",
      "parentId": null,
      "icon": "📊",
      "color": "#3B82F6"
    }
  ]
}

CONFIGURATION:
- Set up json-server to run on port 3001
- Create npm scripts in package.json:
  - "dev": runs Vite dev server
  - "server": runs json-server --watch db.json --port 3001
  - "dev:full": runs both concurrently (use npm-run-all or similar)
- Add proxy configuration in vite.config.js to proxy /api to http://localhost:3001

BASIC STYLING:
- Install Tailwind CSS or your preferred CSS framework
- Set up basic CSS variables for theming (colors, fonts, spacing)
- Create a simple global.css with reset styles

OUTPUT:
A working React + Vite project with json-server configured and ready for development.
```

---

## PHASE 2: Authentication & Routing Foundation

### Prompt 2: Authentication System with Context & Reducer
```
Build a complete authentication system using React Context and useReducer:

CONTEXT & REDUCER (src/contexts/AuthContext.jsx):
Create AuthContext with useReducer for state management:

State shape:
{
  user: null | { id, email, firstName, lastName, role, departments, status, avatar },
  isAuthenticated: false,
  isLoading: false,
  error: null
}

Actions:
- LOGIN_START
- LOGIN_SUCCESS
- LOGIN_FAILURE
- LOGOUT
- UPDATE_USER

Reducer should handle all these actions immutably.

AUTH SERVICE (src/services/authService.js):
Create functions:
- login(email, password): POST to json-server, verify credentials, return user data
- logout(): Clear session
- getCurrentUser(): Get user from localStorage
- updateUser(userData): Update user information

PERSISTED STATE:
- Save user to localStorage on login
- Load user from localStorage on app mount
- Clear localStorage on logout

AUTH PROVIDER COMPONENT:
Wrap the entire app with AuthProvider that:
- Initializes state from localStorage
- Provides authentication functions (login, logout)
- Exposes state via context

CUSTOM HOOK (src/hooks/useAuth.js):
Create useAuth() hook that returns:
- user
- isAuthenticated
- isLoading
- error
- login function
- logout function

ERROR HANDLING:
- Handle invalid credentials
- Handle network errors
- Display user-friendly error messages

OUTPUT:
A complete authentication system that can be used throughout the app.
```

### Prompt 3: Login Page & Protected Routes
```
Create the login page and protected routing system:

LOGIN PAGE (src/pages/LoginPage.jsx):
Build a login form with:
- Email input (with validation)
- Password input (with show/hide toggle)
- "Remember me" checkbox
- Submit button with loading state
- Error message display
- Form validation (required fields, email format)

Functionality:
- Use useAuth hook to access login function
- Handle form submission
- Show loading spinner during authentication
- Display errors below form
- Redirect on successful login based on role

PROTECTED ROUTE COMPONENT (src/components/auth/ProtectedRoute.jsx):
Create a component that:
- Checks if user is authenticated
- Redirects to /login if not authenticated
- Optionally checks for specific role (admin/user)
- Redirects to appropriate dashboard if wrong role
- Shows loading state while checking authentication

ROUTE CONFIGURATION (src/App.jsx):
Set up React Router with:

Public routes:
- /login → LoginPage

Protected user routes:
- / → redirect based on role
- /documents → DocumentListPage (placeholder for now)
- /documents/:id → DocumentDetailPage (placeholder for now)

Protected admin routes:
- /admin → AdminDashboard (placeholder for now)
- /admin/users → UserManagementPage (placeholder for now)
- /admin/departments → DepartmentManagementPage (placeholder for now)
- /admin/categories → CategoryManagementPage (placeholder for now)

LAYOUT COMPONENTS:
Create two layout components:
1. UserLayout (src/components/layout/UserLayout.jsx):
   - Header with logo, user menu, logout button
   - Navigation menu
   - Main content area
   - Footer

2. AdminLayout (src/components/layout/AdminLayout.jsx):
   - Header with logo, admin menu, logout button
   - Sidebar with admin navigation
   - Main content area

ROLE-BASED REDIRECTS:
- After login, redirect admin to /admin
- After login, redirect user to /documents
- Prevent admin from accessing /documents
- Prevent user from accessing /admin/*

OUTPUT:
Complete authentication flow with role-based routing and layouts.
```

---

## PHASE 3: Reusable UI Components

### Prompt 4: Common UI Components Library
```
Build a library of reusable UI components that will be used throughout the app:

BUTTON COMPONENT (src/components/common/Button.jsx):
Props: variant (primary, secondary, danger, ghost), size (sm, md, lg), disabled, loading, onClick, children
Features: Loading spinner, disabled state, different styles per variant

INPUT COMPONENT (src/components/common/Input.jsx):
Props: type, label, error, helperText, required, disabled, placeholder, value, onChange
Features: Error state styling, label with required indicator, helper text

SELECT COMPONENT (src/components/common/Select.jsx):
Props: options, label, error, required, disabled, value, onChange, placeholder
Features: Native select with custom styling

MODAL COMPONENT (src/components/common/Modal.jsx):
Props: isOpen, onClose, title, children, size (sm, md, lg, xl)
Features: Backdrop click to close, ESC key to close, focus trap, scroll lock

TABLE COMPONENT (src/components/common/Table.jsx):
Props: columns, data, onRowClick
Features: Responsive table, sortable columns, hoverable rows
Sub-components: Table.Header, Table.Body, Table.Row, Table.Cell

PAGINATION COMPONENT (src/components/common/Pagination.jsx):
Props: currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange
Features: First, prev, next, last buttons, page numbers, items per page selector

SEARCH INPUT COMPONENT (src/components/common/SearchInput.jsx):
Props: value, onChange, placeholder, onClear
Features: Search icon, clear button (X), debounced onChange

BADGE COMPONENT (src/components/common/Badge.jsx):
Props: variant (success, warning, danger, info), children
Features: Different colors per variant, small rounded badge

DROPDOWN MENU COMPONENT (src/components/common/DropdownMenu.jsx):
Props: trigger (button content), items (array of menu items), onItemClick
Features: Opens on click, closes on outside click, keyboard navigation

LOADING SPINNER COMPONENT (src/components/common/LoadingSpinner.jsx):
Props: size (sm, md, lg), color
Features: CSS spinner animation

EMPTY STATE COMPONENT (src/components/common/EmptyState.jsx):
Props: icon, title, description, action (button props)
Features: Centered layout, optional action button

TOAST/NOTIFICATION COMPONENT (src/components/common/Toast.jsx):
Create a toast notification system with:
- Context for managing toasts
- Toast container component
- Functions: showSuccess, showError, showInfo, showWarning
- Auto-dismiss after 3-5 seconds
- Multiple toasts stack

CARD COMPONENT (src/components/common/Card.jsx):
Props: title, actions, children, hoverable, onClick
Features: Header with title and actions, body, footer, hover effect

FORM GROUP COMPONENT (src/components/common/FormGroup.jsx):
Props: label, error, required, children, helperText
Features: Wraps form inputs with consistent label and error styling

MULTI-SELECT COMPONENT (src/components/common/MultiSelect.jsx):
Props: options, value (array), onChange, placeholder, label
Features: Select multiple items, show selected count, clear all

STYLING:
- Use Tailwind CSS or CSS modules
- Ensure components are accessible (ARIA labels, keyboard navigation)
- Make components themeable (use CSS variables)
- Responsive design

OUTPUT:
A complete library of reusable, accessible, well-styled UI components.
```

---

## PHASE 4: User View - Document List Foundation

### Prompt 5: Document Service & Basic Document List
```
Build the document service layer and basic document list page:

DOCUMENT SERVICE (src/services/documentService.js):
Create API functions using fetch or axios:
- getDocuments(params): GET /documents with query params (search, category, department, page, limit, sortBy, sortOrder)
- getDocumentById(id): GET /documents/:id
- createDocument(documentData): POST /documents
- updateDocument(id, documentData): PATCH /documents/:id
- deleteDocument(id): DELETE /documents/:id
- getDocumentVersions(id): GET related versions
- addDocumentVersion(id, versionData): POST new version

DOCUMENT CONTEXT (src/contexts/DocumentContext.jsx):
Create DocumentContext with useReducer:

State shape:
{
  documents: [],
  currentDocument: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 25
  },
  filters: {
    search: '',
    categories: [],
    departments: [],
    dateRange: { start: null, end: null },
    fileTypes: [],
    status: []
  },
  sortBy: 'createdAt',
  sortOrder: 'desc'
}

Actions:
- FETCH_DOCUMENTS_START
- FETCH_DOCUMENTS_SUCCESS
- FETCH_DOCUMENTS_FAILURE
- SET_CURRENT_DOCUMENT
- UPDATE_FILTERS
- UPDATE_SORT
- UPDATE_PAGINATION
- CLEAR_FILTERS

CUSTOM HOOK (src/hooks/useDocuments.js):
Create hook that provides:
- documents list
- loading state
- error state
- fetchDocuments function
- updateFilters function
- updateSort function
- clearFilters function
- pagination controls

BASIC DOCUMENT LIST PAGE (src/pages/user/DocumentListPage.jsx):
Create a page with:
- Page title and description
- Search input (use SearchInput component)
- "Upload Document" button (functionality in next prompt)
- Empty state when no documents
- Loading state
- Error state
- Document grid/list display (use Card component)
- Each card shows: title, description, category badge, upload date, uploaded by

DOCUMENT CARD (src/components/user/DocumentCard.jsx):
Create a card component that displays:
- Document icon/thumbnail based on file type
- Title (clickable to detail page)
- Description (truncated)
- Category badge
- Department name
- Upload date (relative: "2 days ago")
- Uploaded by (user name)
- File size and type
- Quick action buttons: View, Download

INITIAL SAMPLE DATA:
Add 15-20 sample documents to db.json with varied:
- Titles, descriptions
- Categories (1-3)
- Departments (1-2)
- File types (PDF, DOCX, XLSX, PNG, JPG)
- Upload dates (spread across last 3 months)
- Different uploaders

OUTPUT:
Working document list page with basic display and API integration.
```

### Prompt 6: Advanced Filtering, Sorting & Pagination
```
Enhance the document list with filtering, sorting, and pagination:

FILTER PANEL COMPONENT (src/components/user/FilterPanel.jsx):
Create a collapsible filter sidebar/panel with:

1. Search (already implemented, ensure it's connected)

2. Category Filter:
   - Multi-select dropdown with checkboxes
   - Fetch categories from /categories
   - Show document count per category
   - Select/deselect all

3. Department Filter:
   - Multi-select dropdown
   - Fetch departments from /departments

4. Date Range Filter:
   - Two date inputs: From and To
   - Preset options: Today, Last 7 days, Last 30 days, Last 3 months
   - Clear dates button

5. File Type Filter:
   - Checkboxes for: PDF, DOCX, XLSX, JPG, PNG, TXT, Other
   - Visual icons for each type

6. Status Filter (if applicable):
   - Radio buttons or checkboxes: All, Draft, Published, Archived

7. Clear All Filters button
   - Resets all filters to default

8. Active Filters Display:
   - Show chips/badges for active filters
   - Each chip has an X to remove that specific filter

SORT CONTROLS:
Add sort dropdown in document list header:
- Sort by: Name (A-Z), Name (Z-A), Date (Newest), Date (Oldest), Size (Largest), Size (Smallest)
- Update sortBy and sortOrder in context

PAGINATION IMPLEMENTATION:
Use Pagination component from common library:
- Show current page, total pages
- Items per page selector: 10, 25, 50, 100
- First, Previous, Next, Last buttons
- Update URL params to reflect current page (for bookmarkable URLs)

URL SYNCHRONIZATION:
- Read filters, sort, and page from URL query params on mount
- Update URL when filters/sort/page change
- Use React Router's useSearchParams hook
- Example URL: /documents?search=report&category=1,2&page=2&sort=createdAt&order=desc

FILTER LOGIC:
Implement client-side filtering if json-server doesn't support complex queries:
- Filter documents based on all active filters
- Apply search across title, description, tags
- Apply sort
- Calculate pagination based on filtered results

PERFORMANCE:
- Debounce search input (300ms)
- Memoize filtered/sorted results
- Virtualize list if more than 100 items (optional)

RESPONSIVE DESIGN:
- On mobile: Filter panel opens as bottom sheet or modal
- Filter toggle button on mobile
- Horizontal scroll for active filter chips

OUTPUT:
Fully functional filtering, sorting, and pagination system with URL sync.
```

### Prompt 7: Document Upload Modal
```
Create a comprehensive document upload modal:

UPLOAD MODAL COMPONENT (src/components/user/DocumentUploadModal.jsx):
Build a modal that opens when "Upload Document" button is clicked:

STEP 1: File Upload
- Drag-and-drop zone (visual indication on drag over)
- Click to browse file input
- File type validation (allow: PDF, DOCX, XLSX, TXT, JPG, PNG, GIF)
- File size validation (max 10MB, configurable)
- Display selected file: name, size, type, icon
- Change/remove file button
- Multiple file upload option (bonus)

STEP 2: Metadata Form
Fields (use FormGroup and Input components):
1. Title (required, max 200 chars)
2. Description (textarea, max 1000 chars)
3. Category (required, dropdown from /categories)
4. Department (dropdown from /departments, pre-fill user's department)
5. Tags (multi-input, press Enter to add tag, chips display, max 10 tags)
6. Status (dropdown: Draft, Published) - default to Draft

Form Validation:
- Show inline errors for each field
- Disable submit if validation fails
- Required field indicators

STEP 3: Upload Progress
- Progress bar (0-100%)
- Cancel upload button
- Status message: "Uploading...", "Processing...", "Complete!"

UPLOAD LOGIC:
1. Validate file client-side
2. Create FormData with file and metadata
3. Upload file (simulate file storage, save file name/path to db.json)
4. Create document record in json-server:
   {
     "id": "uuid",
     "title": "...",
     "description": "...",
     "categoryId": "...",
     "departmentId": "...",
     "tags": [...],
     "fileUrl": "/uploads/filename.pdf",
     "fileName": "filename.pdf",
     "fileType": "pdf",
     "fileSize": 2048576,
     "status": "published",
     "uploadedBy": currentUser.id,
     "currentVersion": 1,
     "versions": [
       {
         "versionNumber": 1,
         "fileUrl": "/uploads/filename.pdf",
         "uploadedBy": currentUser.id,
         "uploadedAt": "2024-04-17T10:00:00.000Z",
         "notes": "Initial upload"
       }
     ],
     "createdAt": "2024-04-17T10:00:00.000Z",
     "updatedAt": "2024-04-17T10:00:00.000Z",
     "viewCount": 0,
     "downloadCount": 0
   }
5. Show success message
6. Refresh document list
7. Close modal

ERROR HANDLING:
- File too large error
- Invalid file type error
- Network error during upload
- Server error handling
- Display errors in modal (use Toast for success)

UI/UX ENHANCEMENTS:
- Smooth transitions between steps
- Auto-focus first input field
- ESC key to close (with confirmation if file selected)
- Click outside to close (with confirmation)
- Responsive design (full screen on mobile)

FILE STORAGE SIMULATION:
Since we don't have real backend:
- Store file metadata in db.json
- For demo, use file URL as "/uploads/[filename]"
- Optionally, convert to base64 and store (not recommended for large files)
- Or use browser FileReader API to store file temporarily

OUTPUT:
Complete document upload functionality with modal UI and file handling.
```

---

## PHASE 5: User View - Document Detail Page

### Prompt 8: Document Detail Page with Metadata & Versions
```
Build the document detail page with metadata display and version history:

DOCUMENT DETAIL PAGE (src/pages/user/DocumentDetailPage.jsx):
Create a page layout with three sections:

SECTION 1: Document Header
- Back button to document list
- Document title (large, prominent)
- Status badge (Draft, Published, Archived)
- Quick actions toolbar:
  - Download button
  - Share button (placeholder for now)
  - Edit metadata button (admin only or owner)
  - Delete button (admin only or owner)
  - Create new version button

SECTION 2: Main Content Area (2-column layout)
Left column (70%):
1. Document Preview Section:
   - If PDF: Use react-pdf or embed <iframe>
   - If image: Display image with zoom controls
   - If text/code: Display content with syntax highlighting
   - If Office doc: Show "Download to view" message with download button
   - Fallback: Document icon with "Preview not available"

2. Metadata Section:
   Display in a clean card layout:
   - Description (full text, formatted)
   - Category (with icon and color)
   - Department
   - File type and size
   - Upload date (full date + relative)
   - Uploaded by (user name with avatar)
   - Last modified date
   - Tags (as clickable chips, click = filter by tag)
   - View count (if tracking)
   - Download count (if tracking)

Right column (30%):
1. Version History Section:
   Display as timeline/accordion:
   - Version number (v1, v2, v3...)
   - Upload date and time
   - Uploaded by (user name)
   - Version notes/change log
   - File size
   - Actions for each version:
     - Download this version
     - View this version
     - Restore this version (latest becomes this version)
     - Compare with current (if text document)
   
   Current version highlighted/pinned at top

2. Quick Stats (if implementing analytics):
   - Total views
   - Total downloads
   - Last accessed
   - Comments count

CREATE NEW VERSION MODAL (src/components/user/CreateVersionModal.jsx):
Modal that opens when "Create New Version" button is clicked:

Fields:
1. Upload new file (same type as original required)
2. Version notes (required, what changed?)
3. Auto-increment version number display

Logic:
- Validate file type matches original
- Create new version object in document.versions array
- Update document.currentVersion
- Update document.updatedAt
- Keep all previous versions in history
- Close modal and refresh page

VERSION RESTORATION:
When "Restore this version" is clicked:
- Confirm with user (modal: "Restore version X? This will create a new version.")
- Copy the old version data
- Create new version with incremented number
- Update currentVersion
- Add note: "Restored from version X"

DOCUMENT SERVICE UPDATES:
Add functions:
- getDocumentById(id): Already exists, ensure it fetches full document with versions
- createDocumentVersion(documentId, versionData)
- restoreDocumentVersion(documentId, versionNumber)
- incrementViewCount(documentId)
- incrementDownloadCount(documentId)

LAYOUT:
- Use CSS Grid or Flexbox for responsive 2-column layout
- On mobile: Stack columns vertically
- Sticky right sidebar on desktop

LOADING & ERROR STATES:
- Show skeleton loader while fetching document
- Show error page if document not found (404)
- Handle version creation errors

OUTPUT:
Complete document detail page with metadata, preview, and version management.
```

### Prompt 9: Comments Section with Nested Replies
```
Build a full-featured commenting system for documents:

COMMENTS CONTEXT (src/contexts/CommentsContext.jsx):
Create CommentsContext with useReducer:

State shape:
{
  comments: [],
  isLoading: false,
  error: null,
  replyingTo: null,
  editingComment: null
}

Actions:
- FETCH_COMMENTS_START
- FETCH_COMMENTS_SUCCESS
- FETCH_COMMENTS_FAILURE
- ADD_COMMENT
- UPDATE_COMMENT
- DELETE_COMMENT
- SET_REPLYING_TO
- SET_EDITING_COMMENT

COMMENT SERVICE (src/services/commentService.js):
Create functions:
- getCommentsByDocumentId(documentId): GET /comments?documentId=X&_expand=user
- createComment(commentData): POST /comments
- updateComment(id, commentData): PATCH /comments/:id
- deleteComment(id): DELETE /comments/:id

Comment data structure in db.json:
{
  "id": "1",
  "documentId": "1",
  "userId": "1",
  "content": "This is a great report!",
  "parentId": null,
  "createdAt": "2024-04-17T10:30:00.000Z",
  "updatedAt": null,
  "isEdited": false
}

COMMENTS SECTION COMPONENT (src/components/user/CommentsSection.jsx):
Add to DocumentDetailPage, below metadata section:

Layout:
- Section header: "Comments (X)" with count
- Sort options: Newest first, Oldest first, Most replies
- Add comment form (if user is authenticated)
- Comments list (threaded/nested display)

COMMENT FORM COMPONENT (src/components/user/CommentForm.jsx):
Reusable form for adding/editing comments:
- Rich text editor or simple textarea
- Character limit (max 2000 chars)
- Submit button ("Add Comment" or "Update Comment")
- Cancel button (for editing mode)
- @mention support (bonus):
  - Type @ to trigger user search dropdown
  - Select user to insert @username
  - Highlight mentions in blue

COMMENT ITEM COMPONENT (src/components/user/CommentItem.jsx):
Display individual comment:
- User avatar (or initials if no avatar)
- User name (clickable to user profile - placeholder)
- Comment timestamp (relative: "2 hours ago")
- "edited" indicator if isEdited
- Comment content (render mentions as links)
- Action buttons:
  - Reply button (for authenticated users)
  - Edit button (only for comment owner)
  - Delete button (only for comment owner or admin)
  - Like button (bonus feature)

Nested Replies:
- If comment has replies, render them indented
- Use recursion or flatten with indentation levels
- Limit nesting depth to 3-5 levels
- "Show more replies" for collapsed threads

COMMENT THREAD COMPONENT (src/components/user/CommentThread.jsx):
Handles nested comment display:
- Receives parent comment and its replies
- Recursively renders child comments
- Manages indentation/threading UI
- Collapse/expand nested threads

REPLY FUNCTIONALITY:
When "Reply" is clicked:
- Show comment form below that comment
- Pre-fill @username of parent comment author
- Set parentId to parent comment's id
- Submit creates new comment with parentId
- Nested under parent in UI

EDIT FUNCTIONALITY:
When "Edit" is clicked:
- Replace comment content with form
- Load existing content into textarea
- Save updates comment.content, sets comment.isEdited = true, updates comment.updatedAt
- Cancel restores original view

DELETE FUNCTIONALITY:
When "Delete" is clicked:
- Show confirmation modal
- On confirm, DELETE /comments/:id
- Remove from UI
- If comment has replies, either:
  - Delete all child comments (cascade)
  - Or replace with "[deleted]" placeholder

REAL-TIME UPDATES (Simulated):
- Poll for new comments every 30 seconds (use setInterval)
- Or implement optimistic updates (add comment to UI immediately, then sync with server)

EMPTY STATE:
- If no comments: "No comments yet. Be the first to comment!"

ACCESSIBILITY:
- Keyboard navigation for comments
- Screen reader support for actions
- Focus management for reply/edit forms

OUTPUT:
Complete threaded commenting system with add, edit, delete, and nested replies.
```

---

## PHASE 6: Admin View - User Management

### Prompt 10: Admin User Management - List View
```
Build the admin user management page with list view and multi-select actions:

USER MANAGEMENT PAGE (src/pages/admin/UserManagementPage.jsx):
Create admin page layout:

HEADER SECTION:
- Page title: "User Management"
- Primary action: "Add User" button (opens create modal)
- "Import Users" button (opens import wizard)
- Active filters display (chips with X to remove)

FILTERS & SEARCH SECTION:
- Search bar (search by name or email)
- Filter dropdowns:
  - Role: All, Admin, User
  - Department: All, [list of departments]
  - Status: All, Active, Suspended
- "Clear Filters" button

MULTI-SELECT ACTIONS TOOLBAR:
Appears when one or more users are selected:
- Selection count: "X users selected"
- Bulk actions:
  - Suspend selected users
  - Activate selected users
  - Export selected to CSV
  - Assign to department (opens modal)
  - Delete selected (with confirmation)
- "Deselect All" button

USER TABLE COMPONENT (src/components/admin/UserTable.jsx):
Use Table component from common library:

Columns:
1. Checkbox (select individual user)
2. Avatar (user initials or image)
3. Name (first + last, clickable to user detail)
4. Email
5. Role (badge: blue for admin, gray for user)
6. Department(s) (comma-separated or chips)
7. Status (badge: green for active, red for suspended)
8. Join Date (formatted date)
9. Last Active (relative date: "2 days ago")
10. Actions (dropdown menu):
    - View details
    - Edit
    - Suspend/Activate (toggle based on current status)
    - Delete

Table Features:
- Sortable columns (click header to sort)
- Checkbox in header to select/deselect all
- Hoverable rows
- Responsive (horizontal scroll on mobile)

PAGINATION:
- Use Pagination component
- Items per page: 25, 50, 100
- Show total user count

USER SERVICE (src/services/userService.js):
Create API functions:
- getUsers(params): GET /users with filters
- getUserById(id): GET /users/:id
- createUser(userData): POST /users
- updateUser(id, userData): PATCH /users/:id
- deleteUser(id): DELETE /users/:id
- suspendUser(id): PATCH /users/:id with status: 'suspended'
- activateUser(id): PATCH /users/:id with status: 'active'
- bulkSuspend(userIds): Batch update
- bulkActivate(userIds): Batch update
- bulkDelete(userIds): Batch delete
- exportUsersToCSV(users): Convert users to CSV format

BULK ACTIONS LOGIC:
When bulk action is triggered:
1. Get selected user IDs from state
2. Show confirmation modal (especially for suspend/delete)
3. Execute action for all selected users
4. Show progress indicator if action takes time
5. Display success/error messages
6. Refresh user list
7. Clear selections

EXPORT TO CSV:
When "Export" is clicked:
- Convert selected users (or all if none selected) to CSV format
- Columns: Name, Email, Role, Department, Status, Join Date, Last Active
- Trigger browser download of CSV file
- Use library like papaparse or write custom CSV generator

USER CONTEXT (src/contexts/UserContext.jsx):
Create context with useReducer for managing user list state:

State:
{
  users: [],
  selectedUserIds: [],
  filters: { search: '', role: '', department: '', status: '' },
  sortBy: 'createdAt',
  sortOrder: 'desc',
  pagination: { currentPage: 1, itemsPerPage: 25, totalItems: 0 },
  isLoading: false,
  error: null
}

Actions similar to DocumentContext

SAMPLE DATA:
Add 30-50 sample users to db.json with varied roles, departments, and statuses

OUTPUT:
Complete user management list view with filtering, sorting, pagination, and bulk actions.
```

### Prompt 11: Admin User Management - Create/Edit User Modal
```
Build the create and edit user modals:

CREATE/EDIT USER MODAL COMPONENT (src/components/admin/UserFormModal.jsx):
Reusable modal for both creating and editing users:

Props:
- isOpen: boolean
- onClose: function
- user: object (null for create mode, user data for edit mode)
- onSubmit: function

FORM FIELDS:
1. Profile Picture Upload:
   - Image upload with preview
   - Drag-and-drop or click to browse
   - Show current avatar in edit mode
   - "Remove photo" button
   - Accept image types only (JPG, PNG, GIF)
   - Max size 2MB

2. Personal Information:
   - First Name (required, text input)
   - Last Name (required, text input)
   - Email (required, email validation, unique check)
   - Phone (optional, phone format validation)

3. Account Settings:
   - Role (required, dropdown: User, Admin)
   - Status (required, dropdown: Active, Suspended)
   - Password (required for create, optional for edit)
   - Confirm Password (match validation)

4. Department Assignment:
   - Multi-select dropdown
   - Fetch departments from /departments
   - Show selected departments as chips
   - Can select multiple departments

5. Additional Fields (optional):
   - Job Title
   - Employee ID
   - Hire Date (date picker)

VALIDATION:
- Client-side validation for all required fields
- Email format validation
- Email uniqueness check (query existing users)
- Password strength indicator (weak, medium, strong)
- Password match validation
- Phone number format validation
- Show inline error messages

FORM SUBMISSION:
Create Mode:
1. Validate all fields
2. Check email uniqueness
3. Create user object with generated ID
4. Hash password (or store plain for demo - mention security concern)
5. POST to /users
6. Show success message
7. Close modal
8. Refresh user list

Edit Mode:
1. Validate changed fields
2. If email changed, check uniqueness
3. PATCH /users/:id with updated data
4. Show success message
5. Close modal
6. Refresh user list

MODAL UI/UX:
- Form sections with headers
- Progress indicator for multi-step (optional)
- "Cancel" and "Save" buttons
- Disable save button during submission
- Show loading state on save button
- Confirm before closing if form has unsaved changes
- Auto-focus first input on open
- Keyboard navigation support

ERROR HANDLING:
- Display server errors (e.g., email already exists)
- Network error handling
- Form validation errors
- Show errors near relevant fields

UNIQUE EMAIL CHECK:
Create helper function:
- checkEmailExists(email, excludeUserId): Query /users?email=X
- Return true if email exists (and doesn't belong to current user in edit mode)
- Show error: "This email is already registered"

PASSWORD STRENGTH INDICATOR:
Create component that shows:
- Red bar: weak (< 8 chars or no variety)
- Yellow bar: medium (8+ chars, some variety)
- Green bar: strong (8+ chars, numbers, special chars, mixed case)

OUTPUT:
Complete create/edit user functionality with comprehensive form validation.
```

### Prompt 12: Admin User Management - CSV Import Wizard
```
Build a multi-step CSV import wizard for bulk user creation:

IMPORT WIZARD MODAL COMPONENT (src/components/admin/ImportUsersWizard.jsx):
Multi-step modal with progress indicator:

STEP 1: Upload CSV File
- File upload area (drag-and-drop or click)
- Accept only .csv files
- File size limit (max 5MB)
- Sample CSV download link (provide sample template)
- Instructions: "CSV should include: firstName, lastName, email, role, department, status"
- "Next" button (disabled until file selected)

Sample CSV Template:
```
firstName,lastName,email,role,department,status
John,Doe,john.doe@example.com,user,Engineering,active
Jane,Smith,jane.smith@example.com,admin,HR,active
```

STEP 2: Column Mapping
- Display CSV headers and sample data (first 5 rows)
- For each CSV column, provide dropdown to map to user fields:
  - Required mappings: firstName, lastName, email
  - Optional mappings: role, department, status, jobTitle, phone, employeeId
- Auto-detect mappings based on column names
- Show preview of how data will be imported
- "Back" and "Next" buttons

STEP 3: Validation & Preview
- Parse all rows from CSV
- Validate each row:
  - Required fields present
  - Email format valid
  - Email not already in system
  - Role is valid (user/admin)
  - Department exists (if provided)
  - Status is valid (if provided)
- Display validation results:
  - Total rows: X
  - Valid rows: Y (green)
  - Invalid rows: Z (red)
- Show table with validation results:
  - Columns: Row #, Name, Email, Status (✓ Valid / ✗ Invalid), Errors
  - Red highlight for invalid rows
  - Error messages for each issue
- Options:
  - "Import only valid rows" checkbox
  - "Download error report" button (CSV with errors)
- "Back" and "Import" buttons

STEP 4: Import Progress
- Show progress bar (X of Y users imported)
- Real-time status updates:
  - "Importing user: john.doe@example.com..."
  - "✓ Imported John Doe"
  - "✗ Failed to import Jane Smith: Email already exists"
- "Cancel Import" button (stops process)

STEP 5: Import Summary
- Display results:
  - Total processed: X
  - Successfully imported: Y (green)
  - Failed: Z (red)
- Show list of failed imports with reasons
- "Download detailed report" button (CSV)
- "Close" button (closes modal and refreshes user list)

CSV PARSING:
- Use library like papaparse
- Handle different CSV formats (comma, semicolon delimiters)
- Trim whitespace from values
- Handle quoted values
- Skip empty rows

IMPORT SERVICE (src/services/importService.js):
Functions:
- parseCSV(file): Parse CSV file, return array of objects
- validateUserRow(row, existingEmails): Validate single user row
- validateAllRows(rows, existingUsers): Validate all rows
- importUsers(users): Batch create users (loop or batch POST)
- generateErrorReport(errors): Create CSV with error details

VALIDATION LOGIC:
For each row:
1. Check required fields (firstName, lastName, email)
2. Validate email format
3. Check email uniqueness against existing users AND within CSV (duplicates in file)
4. Validate role (must be 'user' or 'admin')
5. Validate department (must exist in /departments or be empty)
6. Validate status (must be 'active' or 'suspended')
7. Collect all errors for reporting

IMPORT EXECUTION:
- Import valid users one by one or in batches
- Handle partial failures (some succeed, some fail)
- Update progress in real-time
- Allow cancellation (stop processing remaining users)

ERROR HANDLING:
- CSV parsing errors (malformed file)
- Network errors during import
- Validation errors per row
- Duplicate handling

UI/UX:
- Wizard progress indicator (Step 1/5, 2/5, etc.)
- Can go back to previous steps (except after import starts)
- Smooth transitions between steps
- Responsive design

OUTPUT:
Complete CSV import wizard with validation, preview, and error handling.
```

---

## PHASE 7: Admin View - Department & Category Management

### Prompt 13: Department Management
```
Build department management page for admins:

DEPARTMENT MANAGEMENT PAGE (src/pages/admin/DepartmentManagementPage.jsx):

HEADER:
- Page title: "Department Management"
- "Add Department" button (opens create modal)
- Search bar (search by department name)

DEPARTMENT LIST:
Display as cards or table:

Each department card/row shows:
- Department name
- Description (truncated)
- Manager name (linked user)
- Employee count (number of users assigned)
- Created date
- Actions dropdown:
  - View users
  - Edit department
  - Archive/Delete department

DEPARTMENT CARD COMPONENT (src/components/admin/DepartmentCard.jsx):
Card layout:
- Header: Department name with color indicator
- Body: Description, manager info, employee count
- Footer: Created date, action buttons

DEPARTMENT SERVICE (src/services/departmentService.js):
Functions:
- getDepartments(): GET /departments
- getDepartmentById(id): GET /departments/:id
- createDepartment(data): POST /departments
- updateDepartment(id, data): PATCH /departments/:id
- deleteDepartment(id): DELETE /departments/:id (only if no users assigned)
- getDepartmentUsers(id): GET /users?departments_like=id

CREATE/EDIT DEPARTMENT MODAL (src/components/admin/DepartmentFormModal.jsx):
Form fields:
1. Department Name (required)
2. Description (textarea, optional)
3. Manager (searchable dropdown of users)
4. Department Color (color picker for visual distinction)
5. Department Icon (icon selector, optional)

Validation:
- Unique department name
- Required fields

DEPARTMENT USERS VIEW (src/components/admin/DepartmentUsersModal.jsx):
Modal that shows all users in a department:

Features:
- List of users with avatars and names
- Remove user from department button
- "Add Users" button (opens user selection modal)
- Search users within department
- Export department users to CSV

ADD USERS TO DEPARTMENT MODAL:
- Multi-select from all users
- Filter out users already in department
- Add selected users to department
- Update user records with departmentId

USER ASSIGNMENT LOGIC:
Users have departments as array: departments: ["1", "2"]
- Add user to department: append department ID to array
- Remove user from department: remove department ID from array
- Update via PATCH /users/:id

DELETE DEPARTMENT VALIDATION:
Before deleting:
1. Check if department has users (GET /users?departments_like=id)
2. If users exist, show error: "Cannot delete department with assigned users. Please reassign users first."
3. If no users, show confirmation modal
4. On confirm, DELETE /departments/:id

TRANSFER USERS FEATURE:
When deleting department with users:
- Offer option to transfer all users to another department
- Select target department
- Bulk update all users
- Then delete department

OUTPUT:
Complete department management with CRUD operations and user assignment.
```

### Prompt 14: Category Management with Hierarchy
```
Build category management with hierarchical structure:

CATEGORY MANAGEMENT PAGE (src/pages/admin/CategoryManagementPage.jsx):

HEADER:
- Page title: "Category Management"
- "Add Category" button
- View toggle: Tree view / List view

CATEGORY TREE VIEW (src/components/admin/CategoryTreeView.jsx):
Hierarchical display of categories:
- Parent categories expandable/collapsible
- Visual indentation for child categories
- Drag-and-drop to reorder (bonus)
- Drag-and-drop to change parent (move category)

Each category node shows:
- Icon (emoji or icon) with custom color
- Category name
- Document count (documents in this category)
- Actions:
  - Add subcategory
  - Edit category
  - Delete category (if no documents)

CATEGORY LIST VIEW (Alternative):
Flat list with parent category indicated:
- Category name
- Parent category (if applicable)
- Document count
- Actions

CATEGORY SERVICE (src/services/categoryService.js):
Functions:
- getCategories(): GET /categories
- getCategoryById(id): GET /categories/:id
- createCategory(data): POST /categories
- updateCategory(id, data): PATCH /categories/:id
- deleteCategory(id): DELETE /categories/:id
- reorderCategories(orderedIds): Update display order

Category data structure:
```json
{
  "id": "1",
  "name": "Reports",
  "description": "Company reports and analytics",
  "parentId": null,
  "icon": "📊",
  "color": "#3B82F6",
  "order": 1,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

CREATE/EDIT CATEGORY MODAL (src/components/admin/CategoryFormModal.jsx):
Form fields:
1. Category Name (required, unique within same parent)
2. Description (optional)
3. Parent Category (dropdown, nullable for top-level)
   - Show hierarchical dropdown with indentation
   - Prevent selecting self or descendants as parent (circular reference)
4. Icon (emoji picker or icon selector)
5. Color (color picker with preset palette)

RECURSIVE CATEGORY RENDERING:
For tree view:
```javascript
function CategoryNode({ category, level }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const children = categories.filter(c => c.parentId === category.id);
  
  return (
    <div style={{ paddingLeft: level * 20 }}>
      {/* Category display */}
      {children.length > 0 && (
        <div>
          {children.map(child => (
            <CategoryNode key={child.id} category={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
```

DELETE VALIDATION:
Before deleting category:
1. Check if category has documents: GET /documents?categoryId=X
2. Check if category has children: GET /categories?parentId=X
3. If documents exist: "Cannot delete category with documents. Please reassign documents first."
4. If children exist: "Cannot delete category with subcategories. Please delete subcategories first." OR offer cascade delete

REASSIGN DOCUMENTS:
When deleting category with documents:
- Show modal to select target category
- Bulk update all documents: PATCH /documents with new categoryId
- Then delete category

DRAG-AND-DROP REORDERING (Bonus):
- Use library like react-beautiful-dnd or @dnd-kit
- Allow reordering within same level
- Allow moving to different parent (change hierarchy)
- Update category.order and category.parentId
- Prevent circular references

DOCUMENT COUNT:
- For each category, count documents (including subcategories)
- Display as badge next to category name
- Update count when documents are added/removed

CATEGORY BREADCRUMB:
When viewing/editing category:
- Show breadcrumb: Home > Parent Category > Current Category
- Clickable to navigate hierarchy

OUTPUT:
Complete category management with hierarchical structure and document reassignment.
```

---

## PHASE 8: Testing & Polish

### Prompt 15: End-to-End Testing Setup
```
Set up E2E testing framework and write required tests:

TESTING FRAMEWORK SETUP:
Choose Playwright or Cypress:

For Playwright:
1. Install: npm install -D @playwright/test
2. Initialize: npx playwright install
3. Create playwright.config.js:
   - Base URL: http://localhost:5173
   - Test directory: ./e2e
   - Browsers: chromium, firefox, webkit
   - Screenshots on failure
   - Video on failure

For Cypress:
1. Install: npm install -D cypress
2. Initialize: npx cypress open
3. Configure cypress.config.js:
   - Base URL: http://localhost:5173
   - Test directory: ./cypress/e2e
   - Screenshots and videos

SETUP SCRIPTS:
Update package.json:
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

TEST DATA SETUP:
Create a separate db.json for testing (db.test.json):
- Pre-defined users (test-user@example.com, test-admin@example.com)
- Sample documents
- Sample categories and departments
- Sample comments

Create helper functions:
- resetDatabase(): Reset db.json to initial test state
- seedDatabase(): Add test data
- cleanupDatabase(): Remove test data

E2E TEST 1: User Login and Document Upload Flow (e2e/user-document-upload.spec.js):

Test steps:
1. Navigate to login page
2. Verify login page elements exist (email input, password input, submit button)
3. Enter user credentials (test-user@example.com / password123)
4. Click login button
5. Verify redirect to /documents
6. Verify URL is /documents
7. Verify user layout is displayed (header, nav, content)
8. Click "Upload Document" button
9. Verify upload modal is open
10. Fill in document metadata:
    - Title: "Test Document E2E"
    - Description: "This is a test document"
    - Select category from dropdown
    - Select department from dropdown
    - Add tags: "test", "e2e"
11. Upload file (use test fixture file: test-doc.pdf)
12. Click "Upload" button
13. Verify upload progress is shown
14. Verify success message appears
15. Verify modal closes
16. Verify document appears in document list
17. Search for "Test Document E2E"
18. Verify search results show the document
19. Click on document to open detail page
20. Verify document detail page shows correct metadata

Assertions:
- Login redirects to correct page
- Modal opens and closes properly
- Document is created successfully
- Document appears in list with correct data
- Search functionality works
- Detail page displays correct information

E2E TEST 2: Admin User Management Flow (e2e/admin-user-management.spec.js):

Test steps:
1. Navigate to login page
2. Enter admin credentials (test-admin@example.com / admin123)
3. Click login button
4. Verify redirect to /admin
5. Navigate to /admin/users (click nav link or direct navigation)
6. Verify user management page is displayed
7. Verify user table is visible with existing users
8. Click "Add User" button
9. Verify create user modal is open
10. Fill in user form:
    - First Name: "Test"
    - Last Name: "User E2E"
    - Email: "testuser-e2e@example.com"
    - Role: "User"
    - Department: Select from dropdown
    - Status: "Active"
    - Password: "password123"
    - Confirm Password: "password123"
11. Click "Save" button
12. Verify success message appears
13. Verify modal closes
14. Verify new user appears in user table
15. Search for "Test User E2E"
16. Verify search results show the new user
17. Click "Edit" button for the new user
18. Verify edit modal opens with pre-filled data
19. Change first name to "Updated Test"
20. Click "Save" button
21. Verify user name is updated in table
22. Select the user using checkbox
23. Click "Suspend" in bulk actions
24. Verify confirmation modal appears
25. Confirm suspension
26. Verify user status changes to "Suspended"
27. Verify status badge is updated (red color)

Assertions:
- Admin can access admin pages
- User creation works correctly
- Form validation works
- User appears in list after creation
- Search works
- Edit modal pre-fills data correctly
- User updates are saved
- Bulk actions work (suspend)
- Status changes are reflected in UI

TEST HELPERS (e2e/helpers.js):
Create reusable functions:
- login(page, email, password): Login helper
- logout(page): Logout helper
- uploadDocument(page, documentData): Document upload helper
- createUser(page, userData): User creation helper
- waitForToast(page, message): Wait for success/error message

PAGE OBJECTS (Optional):
Create page object models for better test organization:
- LoginPage.js
- DocumentListPage.js
- DocumentDetailPage.js
- UserManagementPage.js
- etc.

CONTINUOUS INTEGRATION:
Add GitHub Actions workflow (optional):
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
```

OUTPUT:
Complete E2E testing setup with 2 comprehensive test suites that validate critical user flows.
```

### Prompt 16: Error Handling, Loading States & Accessibility
```
Polish the application with comprehensive error handling, loading states, and accessibility:

GLOBAL ERROR BOUNDARY (src/components/common/ErrorBoundary.jsx):
Create React Error Boundary component:
- Catch JavaScript errors in component tree
- Display fallback UI with error message
- Log errors to console (or error tracking service)
- Provide "Reload Page" button
- Show different messages for dev vs production

Wrap entire app:
```javascript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

ERROR HANDLING PATTERNS:

1. API Error Handling (src/utils/errorHandler.js):
Create centralized error handler:
```javascript
export function handleApiError(error) {
  if (error.response) {
    // Server responded with error status
    switch (error.response.status) {
      case 400:
        return 'Bad request. Please check your input.';
      case 401:
        return 'Unauthorized. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return 'An unexpected error occurred.';
    }
  } else if (error.request) {
    // No response from server
    return 'Network error. Please check your connection.';
  } else {
    // Error setting up request
    return 'An error occurred. Please try again.';
  }
}
```

2. Form Validation Error Display:
- Show errors inline below each field
- Highlight invalid fields with red border
- Display summary of errors at top of form
- Prevent submission if errors exist

3. 404 Not Found Page (src/pages/NotFoundPage.jsx):
- Friendly message: "Page not found"
- Illustration or icon
- Link to go back or home
- Search bar to find what they're looking for

LOADING STATES:

1. Skeleton Loaders (src/components/common/Skeleton.jsx):
Create skeleton components for:
- Document card skeleton
- User table row skeleton
- Comment skeleton
- Form skeleton

Use while data is fetching instead of blank screen

2. Inline Loading Indicators:
- Button loading states: Disable button, show spinner, change text to "Loading..."
- Table loading: Show skeleton rows
- Modal loading: Show spinner in modal body
- Page loading: Show full-page spinner or skeleton

3. Progressive Loading:
- Load critical content first (above the fold)
- Lazy load images
- Infinite scroll for long lists (optional)
- Debounce search inputs (300ms)

4. Loading Context (src/contexts/LoadingContext.jsx):
Global loading state for heavy operations:
```javascript
const { setLoading } = useLoading();

async function heavyOperation() {
  setLoading(true);
  try {
    // operation
  } finally {
    setLoading(false);
  }
}
```

ACCESSIBILITY IMPROVEMENTS:

1. Semantic HTML:
- Use proper heading hierarchy (h1, h2, h3)
- Use <nav> for navigation
- Use <main> for main content
- Use <article> for document items
- Use <button> for clickable actions, not <div>

2. ARIA Labels:
Add to all interactive elements:
```javascript
<button aria-label="Delete document" onClick={handleDelete}>
  <TrashIcon />
</button>

<input 
  type="search" 
  aria-label="Search documents" 
  aria-describedby="search-help"
/>
<span id="search-help">Enter keywords to search</span>
```

3. Keyboard Navigation:
- All interactive elements focusable with Tab
- Skip to main content link at top
- Modal focus trap (can't tab outside modal)
- Escape key closes modals
- Arrow keys navigate dropdowns
- Enter/Space activate buttons

4. Focus Management:
- Visible focus indicators (outline on focused elements)
- Focus first input when modal opens
- Return focus to trigger element when modal closes
- Focus error message when form submission fails

5. Color Contrast:
- Ensure text has sufficient contrast ratio (4.5:1 for normal text, 3:1 for large text)
- Use tools like WebAIM Contrast Checker
- Don't rely solely on color to convey information (use icons/text too)

6. Alt Text for Images:
- All images have descriptive alt text
- Decorative images have empty alt: alt=""
- Document thumbnails describe document type

7. Form Accessibility:
- Labels associated with inputs (htmlFor / id)
- Required fields indicated visually and with aria-required
- Error messages associated with fields (aria-describedby)
- Fieldsets and legends for grouped inputs

8. Screen Reader Support:
- Announce dynamic content changes (use aria-live regions)
- Loading states announced: aria-live="polite" aria-busy="true"
- Toast notifications announced
- Page title updates on route change

9. Responsive Text:
- Allow text zoom up to 200% without breaking layout
- Use relative units (rem, em) instead of px
- Don't set fixed heights on text containers

OFFLINE SUPPORT (Basic):
- Detect when offline: window.addEventListener('offline', ...)
- Show banner: "You are offline. Some features may not work."
- Queue actions to retry when online (optional)
- Service worker for caching (if implementing PWA)

PERFORMANCE OPTIMIZATIONS:
- Code splitting with React.lazy and Suspense
- Memoize expensive computations with useMemo
- Memoize callbacks with useCallback
- Virtualize long lists (react-window or react-virtualized)
- Optimize images (compress, use appropriate formats)
- Lazy load off-screen images

USER FEEDBACK:
- Show toast notifications for all actions:
  - Success: "Document uploaded successfully"
  - Error: "Failed to upload document. Please try again."
  - Info: "Processing your request..."
- Loading indicators for async operations
- Confirmation modals for destructive actions
- Progress bars for long operations

OUTPUT:
Application with comprehensive error handling, smooth loading states, and full accessibility support.
```

---

## PHASE 9: Extra Features (Choose Your Focus)

### Prompt 17: Smart Document Recommendations (Tier 1 Innovation)
```
Implement intelligent document recommendation system:

RECOMMENDATION ENGINE (src/utils/recommendationEngine.js):
Create algorithm that suggests related documents based on:

1. Category Similarity:
   - Documents in same category
   - Documents in child categories
   - Documents in sibling categories

2. Tag Overlap:
   - Documents sharing similar tags
   - Weight by number of common tags

3. User Viewing History:
   - Track which documents user has viewed (store in localStorage or user record)
   - Find patterns in viewing behavior
   - Recommend documents similar to recently viewed

4. Co-Viewing Patterns (Collaborative Filtering):
   - Track document view pairs (when user views A, they often view B)
   - Store in documentViews collection:
     ```json
     {
       "documentId": "1",
       "viewedDocumentId": "2",
       "count": 15
     }
     ```
   - Recommend documents frequently viewed after current document

RECOMMENDATION SERVICE (src/services/recommendationService.js):
Functions:
- getRecommendations(documentId, userId, limit=5): Get top N recommendations
- trackDocumentView(userId, documentId): Record view for collaborative filtering
- calculateSimilarity(doc1, doc2): Calculate similarity score (0-1)
- getPopularDocuments(limit=10): Get most viewed documents
- getTrendingDocuments(days=7, limit=10): Get trending documents (high recent views)

SIMILARITY CALCULATION:
```javascript
function calculateSimilarity(doc1, doc2) {
  let score = 0;
  
  // Category match (40 points)
  if (doc1.categoryId === doc2.categoryId) score += 0.4;
  
  // Tag overlap (30 points)
  const commonTags = doc1.tags.filter(tag => doc2.tags.includes(tag));
  const tagScore = commonTags.length / Math.max(doc1.tags.length, doc2.tags.length);
  score += tagScore * 0.3;
  
  // Department match (15 points)
  if (doc1.departmentId === doc2.departmentId) score += 0.15;
  
  // File type match (10 points)
  if (doc1.fileType === doc2.fileType) score += 0.1;
  
  // Recency (5 points - prefer newer documents)
  const daysDiff = Math.abs(new Date(doc1.createdAt) - new Date(doc2.createdAt)) / (1000 * 60 * 60 * 24);
  score += (1 - Math.min(daysDiff / 365, 1)) * 0.05;
  
  return score;
}
```

RECOMMENDATIONS COMPONENT (src/components/user/DocumentRecommendations.jsx):
Add to DocumentDetailPage, below comments section:

Layout:
- Section header: "You might also be interested in"
- Horizontal scrollable card list (3-5 recommendations)
- Each card shows: thumbnail, title, category, tags
- Click to navigate to that document

Loading State:
- Show skeleton cards while calculating recommendations
- Fallback to popular documents if no good recommendations

TRACKING IMPLEMENTATION:
When user views a document:
1. Call trackDocumentView(userId, documentId)
2. Update document.viewCount: PATCH /documents/:id
3. Store view in localStorage for current session
4. Update co-viewing data:
   - If user viewed another doc in same session, record the pair
   - Increment count for that document pair

VIEW HISTORY (src/hooks/useViewHistory.js):
Custom hook to manage viewing history:
- Store last 20 viewed documents in localStorage
- Provide getViewHistory() function
- Clear history on logout

POPULAR & TRENDING:
Add sections to DocumentListPage:
- "Popular Documents" (most viewed all-time)
- "Trending This Week" (most viewed in last 7 days)
- Display as horizontal scrollable cards above main list

RECOMMENDATION QUALITY:
- Track when users click recommended documents (success metric)
- Adjust weights based on click-through rate
- A/B test different algorithms (optional)

OUTPUT:
Intelligent recommendation system that suggests relevant documents based on multiple factors.
```

### Prompt 18: Advanced Search with NLP (Tier 1 Innovation)
```
Build an intelligent search system that understands natural language queries:

SEARCH QUERY PARSER (src/utils/searchQueryParser.js):
Create parser that extracts intent from search queries:

Examples of query parsing:
- "documents from last week" → dateRange: { start: 7 days ago, end: now }
- "PDFs in engineering" → fileType: 'pdf', department: 'Engineering'
- "reports uploaded by John" → search: 'reports', uploadedBy: 'John'
- "project management in March" → search: 'project management', month: 'March'

Parser functions:
```javascript
export function parseSearchQuery(query) {
  const filters = {
    search: '',
    dateRange: null,
    fileType: null,
    department: null,
    category: null,
    uploadedBy: null
  };
  
  // Date parsing
  const datePatterns = {
    'last week': () => ({ start: subDays(new Date(), 7), end: new Date() }),
    'last month': () => ({ start: subMonths(new Date(), 1), end: new Date() }),
    'this year': () => ({ start: startOfYear(new Date()), end: new Date() }),
    'yesterday': () => ({ start: subDays(new Date(), 1), end: subDays(new Date(), 1) }),
    'today': () => ({ start: startOfDay(new Date()), end: new Date() })
  };
  
  // File type detection
  const fileTypeKeywords = ['pdf', 'word', 'doc', 'docx', 'excel', 'xlsx', 'image', 'jpg', 'png'];
  
  // Department/category name extraction
  const departments = getAllDepartments(); // fetch from API
  const categories = getAllCategories();
  
  // Parse query word by word
  const words = query.toLowerCase().split(' ');
  
  // Extract date range
  for (const [pattern, dateFunc] of Object.entries(datePatterns)) {
    if (query.toLowerCase().includes(pattern)) {
      filters.dateRange = dateFunc();
      query = query.replace(new RegExp(pattern, 'gi'), '').trim();
    }
  }
  
  // Extract file type
  fileTypeKeywords.forEach(type => {
    if (words.includes(type)) {
      filters.fileType = type;
      query = query.replace(new RegExp(type, 'gi'), '').trim();
    }
  });
  
  // Extract department/category
  departments.forEach(dept => {
    if (query.toLowerCase().includes(dept.name.toLowerCase())) {
      filters.department = dept.id;
      query = query.replace(new RegExp(dept.name, 'gi'), '').trim();
    }
  });
  
  // Remaining text is search query
  filters.search = query.trim();
  
  return filters;
}
```

SMART SEARCH COMPONENT (src/components/user/SmartSearchBar.jsx):
Enhanced search input with:

1. Auto-suggestions:
   - Show dropdown as user types
   - Suggest: Documents, Categories, Departments, Tags, Users
   - Keyboard navigation (arrow keys to select)
   - Enter to search, click to apply suggestion

2. Query interpretation display:
   - Show parsed filters as chips below search bar
   - Example: "documents from last week" → Shows chips: [Date: Last 7 days]
   - Each chip removable to refine search

3. Search suggestions:
   - "Did you mean..." for typos (Levenshtein distance)
   - "Showing results for [corrected]" with link to original query

4. Recent searches:
   - Store last 10 searches in localStorage
   - Show as suggestions when focused on empty input
   - Click to re-run search

FUZZY MATCHING (src/utils/fuzzyMatch.js):
Implement fuzzy search for typo tolerance:
```javascript
export function fuzzyMatch(query, text, threshold = 0.7) {
  const distance = levenshteinDistance(query.toLowerCase(), text.toLowerCase());
  const maxLength = Math.max(query.length, text.length);
  const similarity = 1 - (distance / maxLength);
  return similarity >= threshold;
}

function levenshteinDistance(a, b) {
  // Implement Levenshtein distance algorithm
  // or use library like 'fuzzyset.js' or 'fuse.js'
}
```

SEARCH FILTERS AUTO-APPLY:
When query is parsed:
1. Extract filters from query
2. Auto-apply filters to FilterPanel
3. Show visual feedback of applied filters
4. Allow user to modify or remove auto-applied filters

SEARCH HISTORY (src/hooks/useSearchHistory.js):
Custom hook to manage search history:
- Store searches with timestamp
- Track search→click conversions (which results were clicked)
- Provide getSearchHistory() function
- Clear history on logout

SAVED SEARCHES FEATURE:
Allow users to save complex searches:
- "Save this search" button
- Name the saved search
- Store in user preferences or separate collection
- Quick access to saved searches (dropdown in search bar)
- Edit/delete saved searches

SEARCH ANALYTICS (Admin):
Track search metrics:
- Most searched terms
- Searches with no results (opportunity to add content)
- Average results per search
- Click-through rate on search results

ADVANCED SEARCH MODAL:
"Advanced Search" button opens modal with:
- All filter options in form layout
- Boolean operators: AND, OR, NOT
- Exact phrase matching (quotes)
- Wildcard support (*)
- Field-specific search (title:report, tag:finance)

SEARCH RESULTS PAGE ENHANCEMENTS:
- Highlight search terms in results
- Show relevance score for each result
- Sort by relevance (default) or other criteria
- "Search within results" option

INTEGRATION WITH RECOMMENDATIONS:
- If search returns few results, show "Related documents you might like"
- If no results, show popular documents or trending

NATURAL LANGUAGE EXAMPLES:
Add help popover with examples:
- "reports from engineering in 2024"
- "PDFs about project management"
- "documents uploaded by me last month"
- "excel files in finance category"

OUTPUT:
Intelligent search system that understands natural language and provides smart suggestions.
```

---

## PHASE 10: Final Polish & Documentation

### Prompt 19: README, Documentation & Deployment
```
Create comprehensive documentation and prepare for deployment:

PROJECT README (README.md):
Write a detailed README with:

1. Project Title and Description
2. Features List (core + extra features implemented)
3. Tech Stack
4. Prerequisites (Node.js version, npm, etc.)
5. Installation Instructions:
   ```bash
   git clone <repo-url>
   cd document-management-system
   npm install
   ```
6. Running the Application:
   ```bash
   # Start json-server
   npm run server
   
   # Start Vite dev server (in another terminal)
   npm run dev
   
   # Or run both concurrently
   npm run dev:full
   ```
7. Running Tests:
   ```bash
   npm run test:e2e
   ```
8. Project Structure (folder organization)
9. User Guide:
   - How to login (credentials for demo)
   - How to upload documents
   - How to manage users (admin)
   - How to use filters and search
10. API Documentation (json-server endpoints)
11. Environment Variables (if any)
12. Known Issues / Limitations
13. Future Enhancements
14. Contributing Guidelines (if applicable)
15. License

COMPONENT DOCUMENTATION:
Add JSDoc comments to all components:
```javascript
/**
 * DocumentCard component displays a document in card format
 * @param {Object} props - Component props
 * @param {Object} props.document - Document object
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.isSelected - Whether card is selected
 * @returns {JSX.Element}
 */
export function DocumentCard({ document, onClick, isSelected }) {
  // ...
}
```

USER GUIDE (docs/USER_GUIDE.md):
Create detailed user guide:
- Login process
- Navigating the interface
- Uploading documents
- Searching and filtering
- Commenting on documents
- Version management
- Admin features walkthrough

DEVELOPER GUIDE (docs/DEVELOPER_GUIDE.md):
Create guide for developers:
- Architecture overview
- State management explanation
- Adding new features
- Coding conventions
- Testing strategy
- Deployment process

CODE COMMENTS:
Add comments to complex logic:
- Search query parsing
- Recommendation algorithm
- Validation logic
- API calls with side effects

DEPLOYMENT PREPARATION:

1. Environment Configuration:
   Create .env.example:
   ```
   VITE_API_URL=http://localhost:3001
   VITE_APP_TITLE=Document Management System
   ```

2. Build Optimization:
   - Run production build: npm run build
   - Check bundle size: npm run build -- --analyze
   - Optimize if needed (code splitting, lazy loading)

3. Deployment Options:

   **Option A: Vercel (Frontend only)**
   - Create vercel.json for SPA routing
   - Deploy frontend: vercel deploy
   - Note: json-server won't work, need real backend or mock

   **Option B: Netlify**
   - Create netlify.toml
   - Deploy: netlify deploy
   - Same limitation as Vercel for json-server

   **Option C: Full Stack (Frontend + json-server)**
   - Use platforms like Railway, Render, or Heroku
   - Deploy both frontend and json-server
   - Set up environment variables for API URL

   **Option D: Static Demo**
   - Build frontend: npm run build
   - Deploy to GitHub Pages
   - Include sample data in frontend (no live backend)
   - Note: Create/Update/Delete won't persist

4. For json-server deployment:
   - Create separate repository for API
   - Deploy to Render, Railway, or Glitch
   - Update VITE_API_URL to deployed URL

DEMO CREDENTIALS:
Add to README and login page:
```
User Account:
Email: user@dms.com
Password: user123

Admin Account:
Email: admin@dms.com
Password: admin123
```

SAMPLE DATA SCRIPT:
Create script to populate db.json with rich demo data:
```bash
npm run seed
```

Script should create:
- 5-10 users (mix of admin/user)
- 50+ documents (varied types, categories, dates)
- 20+ comments (on various documents)
- 5+ departments
- 10+ categories (with hierarchy)

PERFORMANCE CHECKLIST:
- [ ] Lighthouse score > 90
- [ ] All images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Memoization for expensive operations
- [ ] No console.log in production
- [ ] Error boundaries in place
- [ ] Loading states for all async operations

SECURITY CHECKLIST (Frontend):
- [ ] XSS prevention (sanitize user input)
- [ ] CSRF tokens (if applicable)
- [ ] Secure password handling (don't log passwords)
- [ ] Input validation on all forms
- [ ] SQL injection prevention (sanitize search queries)
- [ ] File upload validation (type, size)

BROWSER COMPATIBILITY:
Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)

ACCESSIBILITY AUDIT:
- Run Lighthouse accessibility audit
- Test with screen reader (NVDA, JAWS, or VoiceOver)
- Test keyboard navigation
- Check color contrast ratios
- Validate ARIA labels

FINAL TOUCHES:
- Add favicon
- Update page titles for all routes
- Add meta tags for SEO
- Create og:image for social sharing
- Add loading spinner on initial app load
- Add "About" page with project info
- Add "Help" or "FAQ" page

OUTPUT:
Fully documented, production-ready application with deployment instructions.
```

---

## Summary of Prompts

**Phase 1: Foundation (1 prompt)**
- Prompt 1: Project setup & structure

**Phase 2: Auth & Routing (2 prompts)**
- Prompt 2: Auth system with Context
- Prompt 3: Login page & protected routes

**Phase 3: UI Components (1 prompt)**
- Prompt 4: Reusable component library

**Phase 4: User View - Documents (3 prompts)**
- Prompt 5: Document service & basic list
- Prompt 6: Filtering, sorting, pagination
- Prompt 7: Document upload modal

**Phase 5: User View - Detail (2 prompts)**
- Prompt 8: Document detail page & versions
- Prompt 9: Comments section

**Phase 6: Admin - Users (3 prompts)**
- Prompt 10: User management list
- Prompt 11: Create/edit user modal
- Prompt 12: CSV import wizard

**Phase 7: Admin - Dept & Category (2 prompts)**
- Prompt 13: Department management
- Prompt 14: Category management

**Phase 8: Testing & Polish (2 prompts)**
- Prompt 15: E2E testing setup
- Prompt 16: Error handling & accessibility

**Phase 9: Extra Features (2 prompts)**
- Prompt 17: Document recommendations
- Prompt 18: Advanced search with NLP

**Phase 10: Documentation (1 prompt)**
- Prompt 19: README & deployment

**Total: 19 prompts** organized for optimal incremental development.

Each prompt builds upon previous work, minimizing rework and ensuring a smooth development flow.
