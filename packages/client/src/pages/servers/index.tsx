import {Show, Component, createResource} from 'solid-js';
import {useParams} from 'solid-app-router';
import type {Server} from '$root/server';

async function fetchServer(): Promise<Server> {
  const parameters = useParams();
  const response = await fetch(
    `http://localhost:4000/api/servers/${parameters['serverId'] ?? ''}`,
  );
  return (await response.json()) as Promise<Server>;
}

const ServerIndex: Component = () => {
  const [server] = createResource(fetchServer);
  return (
    <Show when={!server.loading && !server.error} fallback="Loading...">
      Welcome to server {server()?.categoryName}
    </Show>
  );
};

export default ServerIndex;
