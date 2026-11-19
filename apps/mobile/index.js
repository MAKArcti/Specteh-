import { registerRootComponent } from 'expo';
import App from './App';

// Registers App directly from the project root instead of going through
// node_modules/expo/AppEntry.js, whose own `../../App` relative import
// resolves against pnpm's symlinked .pnpm store path, not this project —
// a known Metro + pnpm monorepo issue (see metro.config.js for the related
// symlink-resolution fix). This sidesteps it entirely.
registerRootComponent(App);
