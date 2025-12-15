This is where everything comes together. In this Next.js page, we import and use our UI components (UserForm and UserList) that rely on hooks for logic and domain layers underneath. This top-level page acts as the entry point for the user interface but stays minimal and declarative, with no business logic inside.

Use api routes for server-side data fetching and mutations. But keep the API layer as thin as possible. Put all business logic in the domain layer. And keep the validation in the UI layer - another layer of validation takes place in the backend APIs as well.
All API calls to BACKEND_AI_CALLBACK_URL must be done server side only

It simply:

Displays a page title
Renders the form for creating users
Renders the list of existing users
// app/page.tsx
import { UserForm } from '../lib/user/view/components/UserForm';
import { UserList } from '../lib/user/view/components/UserList';

export default function Home() {
  return (
    <main>
      <h1>User Management</h1>
      <UserForm />
      <UserList />
    </main>
  );
}
