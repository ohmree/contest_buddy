import {Component, Show, For, createResource} from 'solid-js';
import type {User} from '$root/server';

async function fetchUsers(): Promise<[User]> {
  const response = await fetch('http://localhost:4000/api/users');
  console.debug(response);
  return (await response.json()) as Promise<[User]>;
}

const Users: Component = () => {
  const [users] = createResource(fetchUsers);
  return (
    <Show when={!users.loading && !users.error} fallback="Loading...">
      <ul>
        <For each={users()!}>
          {(user, _i) => (
            <>
              <img src={user.profileUrl} />
              <li text="gray-700 capitalize dark:gray-200 md:lg">
                {user.twitchDisplayName}
              </li>
            </>
          )}
        </For>
      </ul>
    </Show>
  );
};

export default Users;
