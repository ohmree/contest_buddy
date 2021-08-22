import {Component, Show, For, createResource} from 'solid-js';
import {Link} from 'solid-app-router';
import type {Contest} from '$root/server';

async function fetchContests(): Promise<[Contest]> {
  const response = await fetch('http://localhost:4000/api/contests');
  return (await response.json()) as Promise<[Contest]>;
}

const Contests: Component = () => {
  const [contests] = createResource(fetchContests);
  return (
    <Show when={!contests.loading && !contests.error} fallback="Loading...">
      <table
        max-w="10xl"
        table="fixed"
        w="full"
        p="x-4 y-2"
        m="x-auto t-2"
        bg="white dark:gray-800"
        border="~ gray-300 dark:gray-600"
      >
        <thead>
          <tr
            border="b-1 gray-300 dark:gray-600"
            divide="x gray-300 dark:gray-600"
          >
            <th w="2/7" text="gray-700 dark:gray-200 md:lg">
              Name
            </th>
            <th w="4/7" text="gray-700 dark:gray-200 md:lg">
              Description
            </th>
            <th w="1/7" text="gray-700 dark:gray-200 md:lg">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          <For each={contests()}>
            {(contest, _i) => (
              <tr
                border="b-1 gray-300 dark:gray-600"
                divide="x gray-300 dark:gray-600"
              >
                <td text="center gray-700 hover:gray-800 dark:gray-200 dark:hover:gray-400 md:lg">
                  <Link href={`/contests/${contest.id}`}>{contest.name}</Link>
                </td>
                <td text="center gray-700 dark:gray-200 md:lg">
                  {contest.description}
                </td>
                <td text="center gray-700 dark:gray-200 md:lg">
                  {contest.isOpen ? 'Open' : 'Closed'}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </Show>
  );
};

export default Contests;
