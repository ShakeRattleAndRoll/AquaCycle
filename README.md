# AquaCycle

Expo Router laundry service app using Supabase Auth and Postgres.

## Setup Instructions

Run this command to read `package.json` and download all required packages:
```sh
npm install
Read .env.example and follow its instructions to configure your environment variables.

Secret Staff Testing Code: Staffaccountdemo

Project Structure
app/(auth)/ — Login and signup screens.
app/(customer)/ — Customer-only support and preference screens.
app/(customer-tabs)/ — Customer tab screens.
app/(staff-tabs)/ — Staff tab screens.
app/(shared)/ — Shared or role-aware screens (history, notifications, orders, password changes).
app/ — Root navigation layout and modal routes.
components/ui/, components/navigation/, components/customer/, and components/modals/ — Shared UI, navigation, customer widgets, and modal content.
constants/, hooks/, logic/, utils/, and supabase/ — App configuration, hooks, domain helpers, integrations, and backend files.

To-Do List
Type DONE next to a task once it is implemented.

[ ] Eye icon in password login field
[ ] Login UI redesign
[ ] Password reset / change functionality
[ ] Email verification on sign-up
[ ] Staff Portal: New Order UI redesign (allow staff to search for customers)
[ ] Admin Portal implementation (Manage Customers, Staff, and generate Staff Registration Codes)
[ ] Fix "See All" functionality on Staff Home
[ ] "All Services" section (clickable via "See All" on Customer Home)
[ ] Notification navigation (clicking a notification opens its order details for both Staff and Customer)
[ ] Profile picture support (Staff and Customer)

If any bugs or errors are found, please fix them.