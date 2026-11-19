// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
// pnpm hoists/symlinks shared packages (e.g. @spectech/shared-types) into the
// workspace root's node_modules via its .pnpm store — Metro's default
// resolver doesn't follow symlinks or look outside the project root, so
// without this it can't even resolve expo's own AppEntry.
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
