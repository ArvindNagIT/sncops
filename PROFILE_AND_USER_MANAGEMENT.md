# Profile and User Management Implementation

## Summary of Changes

This document outlines the profile editing and user management features added to SNCOP-AI.

## Student Profile Features

### 1. Profile Page (`/profile`)
Students who register and log in to SNCOP-AI can now edit their profile with the following options:

- **Change Name**: Update their full name
- **Change Email**: Update their email address
- **Change Password**: Set a new password (minimum 6 characters)

**Location**: `/src/pages/Profile.tsx`

**Access**: Protected route - requires authentication. Navigate to `/profile` or click the "Profile" button in the header when logged in.

**Features**:
- Real-time form validation
- Password visibility toggle
- Separate forms for name, email, and password updates
- Success and error feedback messages
- Logout button

### 2. Updated Authentication Context
**File**: `/src/context/AuthContext.tsx`

Added new methods:
- `updateEmail(newEmail: string)`: Updates user email in both auth and profile
- `updatePassword(newPassword: string)`: Updates user password

### 3. Header Navigation
**File**: `/src/components/Header.tsx`

- Added "Profile" button that appears when user is logged in
- Available on both desktop and mobile views
- Green gradient styling to distinguish from other buttons

## Admin Panel - User Management

### 1. SNCOP-AI Users Tab
**Location**: Admin Panel → SNCOP-AI Users tab

**Features**:
- View all registered users in a table format
- Display user name, email, and creation date
- Edit user profiles (name and email)
- Delete user accounts

**Component**: `/src/components/UserManagement.tsx`

### 2. User Management Capabilities

#### View Users
- Lists all registered SNCOP-AI users
- Shows name, email, and account creation date
- Auto-refreshes to show latest data

#### Edit Users
- Admins can edit user names and emails
- Password field is shown but disabled with explanation
- Users must change their own passwords from their profile page

#### Delete Users
- Admins can delete user accounts
- Confirmation dialog before deletion
- Cascading delete removes all user data (profiles, conversations, messages)

### 3. Important Notes

**User Creation**:
- New users must register through the `/register` page
- Admin panel does not support direct user creation (requires service role access)

**Password Management**:
- Admins cannot change user passwords from the admin panel
- Users must update their own passwords from `/profile`
- This is by design for security reasons

## Database Changes

### Migration: `20251022000000_add_admin_role_and_policies.sql`

**Schema Updates**:
- Added `is_admin` column to profiles table
- Added index on `is_admin` for performance

**RLS Policies**:
- Users can view and edit their own profiles
- Admins can view all profiles
- Admins can update all profiles
- Admins can delete profiles
- Users cannot change their own admin status

**Functions**:
- `is_admin()`: Helper function to check if current user is admin

## Routes Added

- `/profile` - Protected route for user profile editing

## Security Considerations

1. **Row Level Security (RLS)**: All database operations respect RLS policies
2. **Authentication Required**: Profile page requires active authentication
3. **Password Security**: Password updates handled by Supabase auth system
4. **Admin Operations**: Admin user management respects database permissions

## How to Use

### For Students:
1. Register at `/register`
2. Login at `/login`
3. Access profile page at `/profile` or click "Profile" button in header
4. Update name, email, or password as needed

### For Admins:
1. Login to admin panel
2. Navigate to "SNCOP-AI Users" tab
3. View all registered users
4. Click "Edit" to modify user information
5. Click "Delete" to remove users

## Future Enhancements

To enable full admin user management (creating users and changing passwords from admin panel), you would need to:

1. Create a Supabase Edge Function with service role access
2. Implement secure endpoints for user creation and password updates
3. Add admin authentication to prevent unauthorized access
4. Update the UserManagement component to call these endpoints

This would require careful security considerations and is beyond the scope of the current implementation.
