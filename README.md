NOTE: using monorepo npm workspace structure

Have 1 package-lock file in root workspace folder.

When you first pull this repo, run npm i in the root folder, not the individual site and api folders!!!

Run "npm run start" to build everything and run api.
- TODO: have build step copy over site into api folder so it can be served