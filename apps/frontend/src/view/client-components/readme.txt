This layer is focused purely on rendering — we call these components “dumb” because they contain no logic, just markup. All behavior is passed into them via custom hooks (from the previous layer).

UserForm renders a form and uses the logic from useUserForm to handle submit, validation, and state.
UserList is responsible for rendering a list of users — the data fetching is handled via useUserList.
Keeping these components clean and focused only on presentation makes them easier to test, reuse, and maintain.
// libs/users/view/components/UserForm.tsx
'use client';
import { useUserForm } from '../hooks/useUserForm';

export function UserForm() {
  const { register, onSubmit } = useUserForm();

  return (
    <form onSubmit={onSubmit}>
      <input {...register('name')} placeholder="Name" />
      <input type="number" {...register('age', { valueAsNumber: true })} placeholder="Age (optional)" />
      <button type="submit">Create User</button>
    </form>
  );
}
// libs/users/view/components/UserList.tsx
'use client';
import { useUserList } from '../hooks/useUserList';

export function UserList() {
  const { data: users, isLoading } = useUserList();

  if (isLoading) return <p>Loading...</p>;

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.name} — {user.email}</li>
      ))}
    </ul>
  );
}
