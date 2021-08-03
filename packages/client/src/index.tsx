import 'windi.css';
/* Import 'virtual:windi-devtools'; */
import type {Component} from 'solid-js';
import {lazy} from 'solid-js';
import {render} from 'solid-js/web';
import {Router, Link, Routes, Route} from 'solid-app-router';
import Button from './components/button';

const Index = lazy(async () => import('./pages/index'));
const Users = lazy(async () => import('./pages/users'));
const User = lazy(async () => import('./pages/users/[id]'));

const App: Component = () => (
  <>
    <h1 text="xl font-medium gray-800 md:3xl dark:white"></h1>
    <Link class="nav" href="/">
      <Button>Home</Button>
    </Link>
    <Link class="nav" href="/users">
      <Button>Users</Button>
    </Link>
    <Routes>
      <Route path="/users" element={<Users />} />
      <Route path="/users/:id" element={<User />} />
      <Route path="/" component={Index} />
      {/* <Route path="/*all" element={<NotFound />} /> */}
    </Routes>
  </>
);

render(
  () => (
    <Router>
      <App bg="red-500" />
    </Router>
  ),
  document.querySelector('#app')!
);
