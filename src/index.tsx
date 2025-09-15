import { render } from 'preact';
import { App } from './app';
import './style.css';

document.querySelector('body > noscript')?.remove();
render(<App />, document.getElementById('app'));
