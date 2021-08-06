import {Component, Show, For, createResource} from 'solid-js';
import type {Contest} from '$root/server';

async function fetchContests(): Promise<[Contest]> {
  const response = await fetch('http://localhost:4000/api/contests');
  return (await response.json()) as Promise<[Contest]>;
}

const Contests: Component = () => {
  const [contests] = createResource(fetchContests);
  return (
    <Show when={!contests.loading && !contests.error} fallback="Loading...">
      <ul>
        <For each={contests()!}>
          {(contest, _i) => (
            <li>
              <h2 text="gray-800 capitalize dark:gray-300 md:lg">{contest.name}</h2>
              <Show when={contest.description}>
                <p text="gray-700 capitalize dark:gray-200 md:lg">{contest.description}</p>
              </Show>
            </li>
          )}
        </For>
      </ul>
    </Show>
  );
};

export default Contests;
