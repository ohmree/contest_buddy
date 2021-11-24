# ContestBuddy

This will be a website and a discord bot to help organize discord show-and-tells and contests.
It will handle discord channel creation and archiving, enforcing submission formats and displaying contest data in a web app with the option for admins to select contest winners. 

## Technology used
### Common
 - Typescript for type safety
 - PNPM as a faster alternative to NPM
 - XO and Prettier for linting and enforcing code style
### Frontend
 - SolidJS as the framework/library
 - WindiCSS for styling
 - Vite as the bundler/dev server
### Backend
 - Postgres as the database - with a custom extension for generating short IDs (not written by me)
 - Prisma as the ORM
 - TinyHTTP as the HTTP/REST framework (express-like)
 - Passport.js for authenticating users with discord
 - Discord.js for the discord bot
 - Docker and docker-compose to build and run the database with the custom extension, and to run PGAdmin locally for assistance in development. 

In the future vite might be used on the backend as well for server side rendering. 
