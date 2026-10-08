# AquaCycle

A laundry service app built with **Expo Router**, using **Supabase** for authentication and Postgres.

## Getting Started

### 1. Install dependencies

```sh
npm install
```

### 2. Configure environment variables

Read `.env.example` and follow its instructions to set up your environment variables.

### 3. Staff testing code

To test staff accounts, use this registration code:

```
Staffaccountdemo
```

## Project Structure

| Path | Purpose |
| --- | --- |
| `app/(auth)/` | Login and signup screens |
| `app/(customer)/` | Customer-only support and preference screens |
| `app/(customer-tabs)/` | Customer tab screens |
| `app/(staff-tabs)/` | Staff tab screens |
| `app/(shared)/` | Shared or role-aware screens (history, notifications, orders, password changes) |
| `app/` | Root navigation layout and modal routes |
| `components/ui/`, `components/navigation/`, `components/customer/`, `components/modals/` | Shared UI, navigation, customer widgets, and modal content |
| `constants/`, `hooks/`, `logic/`, `utils/`, `supabase/` | App configuration, hooks, domain helpers, integrations, and backend files |

## To-Do List

Type `DONE` next to a task once it is implemented.

### Authentication
- [ ] Eye icon in password login field
- [ ] Login UI redesign
- [ ] Password reset / change functionality
- [ ] Email verification on sign-up

### Staff Portal
- [ ] New Order UI redesign (allow staff to search for customers)
- [ ] Fix "See All" functionality on Staff Home

### Admin Portal
- [ ] Admin Portal implementation (manage customers, manage staff, and generate Staff Registration Codes)

### Customer App
- [ ] "All Services" section (clickable via "See All" on Customer Home)

### General
- [ ] Fix notifications
- [ ] Profile picture support (Staff and Customer)

## Bugs

If you find any bugs or errors, please fix them.
