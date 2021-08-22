import 'windi.css';
/* Import 'virtual:windi-devtools'; */
import type {Component} from 'solid-js';
import {lazy} from 'solid-js';
import {render} from 'solid-js/web';
import {Router, Routes, Route} from 'solid-app-router';
import Navbar from './components/navbar';

const ServerIndex = lazy(async () => import('./pages/servers/index'));
const Index = lazy(async () => import('./pages/index'));
const Users = lazy(async () => import('./pages/servers/users'));
const User = lazy(async () => import('./pages/servers/users/[id]'));
const Contests = lazy(async () => import('./pages/servers/contests'));
const Contest = lazy(async () => import('./pages/servers/contests/[id]'));
const NewContest = lazy(async () => import('./pages/servers/contests/new'));
const Login = lazy(async () => import('./pages/login'));

const App: Component = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/servers/:serverId">
        <Route path="/users" component={Users} />
        <Route path="/users/:id" component={User} />
        <Route path="/contests" component={Contests} />
        <Route path="/contests/:id" component={Contest} />
        <Route path="/contests/new" component={NewContest} />
        <Route path="/" component={ServerIndex} />
      </Route>
      <Route path="/login" component={Login} />
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
  document.querySelector('#app')!,
);
