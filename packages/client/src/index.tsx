import 'virtual:windi.css';
import type {Component} from 'solid-js';
import {render} from 'solid-js/web';

const App: Component = () => <h1>Hi</h1>;

render(() => <App />, document.querySelector('#app')!);
