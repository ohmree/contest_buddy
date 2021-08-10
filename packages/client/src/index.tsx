import 'windi.css';
/* Import 'virtual:windi-devtools'; */
import type {Component} from 'solid-js';
import {lazy} from 'solid-js';
import {render} from 'solid-js/web';
import {Router, Routes, Route} from 'solid-app-router';
import Navbar from './components/navbar';

const Index = lazy(async () => import('./pages/index'));
const Users = lazy(async () => import('./pages/users'));
const User = lazy(async () => import('./pages/users/[id]'));
const Contests = lazy(async () => import('./pages/contests'));
const Contest = lazy(async () => import('./pages/contests/[id]'));
const NewContest = lazy(async () => import('./pages/contests/new'));

const App: Component = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/users" element={<Users />} />
      <Route path="/users/:id" element={<User />} />
      <Route path="/contests" element={<Contests />} />
      <Route path="/contests/:id" element={<Contest />} />
      <Route path="/contests/new" element={<NewContest />} />
      <Route path="/" element={<Index />} />
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
