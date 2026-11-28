# Future browser applications

Keep the hand-authored website in ../site and each application in apps/<name>/.
Each app owns its package.json, lockfile, source, checks, and build output. The
website does not depend on Expo/mobile code or require every app to build.

For a self-contained app under /apps/<name>/, configure its asset base and router
for that prefix and add an explicit build/copy step that publishes only its built
files into dist/apps/<name>/. The current site builder intentionally copies only
site/; app publication must be added with the first real app, with tests for its
base path and routing. No source/dependencies/secrets are copied to dist/.

Apps needing root routing, backend bindings, different headers, or an independent
release cycle get a separate Worker and Wrangler configuration, following the
Luciddream site/app separation. Use npm run <app-specific-command> to build, preview,
and deploy that app explicitly. No framework or empty demo app is imposed now.
