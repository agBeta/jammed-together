## eslint with typescript

According to [this reddit answer](https://www.reddit.com/r/typescript/comments/guiovl/comment/fsilixs/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button):
I'm guessing that you haven't set it up correctly.

What install guide did you use?
You need some things in you .eslintrc. I think this is the minimum:

```javascript
    "plugins": ["@typescript-eslint"],
    "parser": "@typescript-eslint/parser",
```

And then install the packages: `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`;

Alternatively, it seems you can do:

```bash
npm install --save-dev eslint
npx eslint --init
```

</br>

## Basics of TS configuration

See [learn typescript](https://learntypescript.dev/12/l3-eslint). It has a _very_ good and simple tutorial from scratch which explains the details. It also contains base config files. Below are some parts from the website.

Why would you use ESLint to check TypeScript code when the TypeScript compiler already performs some code quality checks? Well, the TypeScript compiler is capable of carrying out a few code quality checks. ESLint is capable of carrying out many more checks.

Based on [this](https://learntypescript.dev/12/l2-babel): Why would you use Babel to transpile TypeScript when the TypeScript compiler already does this? Well, Babel is capable of converting JSX to JavaScript - the TypeScript compiler can't do this. So, if your project is built using React, you will need Babel.

You may also checkout [typescript-eslint docs](https://typescript-eslint.io/getting-started/#details).

This [LogRocker Typescript Express blog](https://blog.logrocket.com/how-to-set-up-node-typescript-express/) also goes through a somewhat similar approach but a bit different at the beginning. To get more familiar it's recommended to also read that blog. Note: You may have to to run npm install ts-node `-g` to install ts-node globally so that nodemon find it. Also be careful about difference of `/dist` vs `./dist` in tsconfig file. The first one goes to machine root.

### with Express

For Express+Typescript, take a look at [this DEV blog](https://dev.to/wizdomtek/typescript-express-building-robust-apis-with-nodejs-1fln). It contains all instructions to set-up an express server running.

### Zod

It's recommended to use [Zod](https://zod.dev/?id=basic-usage). With Zod, you declare a validator **once** and Zod will automatically infer the static TypeScript type.
This [next biggest thing after typescript](https://dev.to/jareechang/zod-the-next-biggest-thing-after-typescript-4phh) article also explains why Zod is such great tool. Typescript type contracts aren't enforced when code is compiled to Javascript. The traditional approach to achieve a certain level of guarantee is installing some sort of validation library (ie Joi, Ajv etc). The trade off with these libraries is there is a lot of duplication - like A LOT in a large code base.

Also take a look at [express-zod-api](https://github.com/RobinTail/express-zod-api?tab=readme-ov-file#why-and-what-is-it-for).

</br>

### tcs vs ts-node

According to [T.J Cowder's answer](https://stackoverflow.com/questions/58954683/what-is-the-difference-between-ts-node-and-tsc):
`tsc` is the TypeScript compiler, which is completely separate from `ts-node`.
ts-node is a wrapper for Node.js's node executable that installs a TypeScript-enabled module loader that compiles TypeScript on the fly as needed. `ts-node` **uses** `tsc` by default, but can use other compilers if you specify the --compiler option.
ts-node is _not_ a compiler. It uses a compiler. ts-node is useful for when you want to have a tool (ts-node) handle compiling your Node.js-based TypeScript for you on-the-fly. tsc is useful any other time you want to compile TypeScript to JavaScript -- because you don't want to do that at runtime on Node.js, or because you're not using Node.js at all (compiling to JavaScript for another environment, such as a web browser).

### tsx?

Take a look at [this SO answer](https://stackoverflow.com/a/76343394) and [the comparison](https://github.com/privatenumber/ts-runtime-comparison?tab=readme-ov-file#interoperability).


</br>

## How to run Typescript?!

Many ways!
According to [DEV article and comment](https://dev.to/_staticvoid/how-to-run-typescript-natively-in-nodejs-with-tsx-3a0c), for Node.js v20.6.0 and above, we can use this (also including .env file without installing dotenv package):

```bash
node --env-file=.env --import=tsx --watch ./src/index.ts
```

According to [this SO thread](), you can run:

```bash
npx tsx src/index.ts

# OR
node --loader ts-node/esm ./my-script.ts

# OR (actually the following one failed for me)
ts-node --esm ./my-script.ts
```

</br>

## `tsconfig`

### `module`

See [theory behind module](https://www.typescriptlang.org/docs/handbook/modules/theory.html#the-module-output-format) and [SO thread about difference between module type](https://stackoverflow.com/questions/41326485/difference-between-module-type-in-tsconfig-json).
The `module` compiler option provides this information to the compiler. Its primary purpose is to control the module format of any JavaScript that gets emitted during compilation, but it also serves to inform the compiler about how the module kind of each file should be detected, how different module kinds are allowed to import each other, and whether features like `import.meta` and top-level `await` are available. So, even if a TypeScript project is using `noEmit`, choosing the right setting for module still matters. As we established earlier, the compiler needs an accurate understanding of the module system so it can type check (and provide IntelliSense for) imports

</br>

## Machine slows

First off, remember Primeagen also said the same thing in his youtube video about Stripe migrating from Flow to TS.
You may also take a look [Typescript Performance wiki](https://github.com/microsoft/TypeScript/wiki/Performance) and [Performance Tracing](https://github.com/microsoft/TypeScript/wiki/Performance-Tracing) page.

Also there is another library [TypeBox](https://github.com/sinclairzx81/typebox) that has a nice documentation and apparently is faster.

(Based on [this reddit thread](https://www.reddit.com/r/typescript/comments/13sldut/how_do_people_use_zod_on_a_large_project/)):
Any time I've tried to use Zod on a mid/large size project to define request and response body DTOs, VS Code absolutely slows to a crawl. Like, 5+ seconds for autocomplete to show up, laggy typing, and my fan is constantly on.
**But** according [this SO answer](https://stackoverflow.com/a/74901864) by Zod Creator, the issue is fixed now.

Anyway... some other insightful comments from the thread:

-   I honestly don't get the zod hype, it has poor performance both on the ts language server and at runtime validation, compared to alternatives, especially when sinclair/TypeBox does it better using the same(similar?) API.

-   TS in a monorepo is quickly turning into hell for me. I'm not sure if it's Zod, or tRPC, or the TS ORM I'm using, or some other package, or VS Code plugins...but I've started getting more and more "type instantiation is excessively deep" errors and Intellisense seems to take over 30s to update after each change. I love TS but it's slowing me down a lot at this point.

-   (To learn when issue will arise): How many ZOD types haved you defined? 50 or 500? Is your macbook pro M1 or Intel? Use I7 or M1 for dev. 50 is not too much.

-   I would avoid any large-scale usage of deeply inferred types. Harder to debug type errors and the performance is inherently bad.

-   (about Prisma) I also find Prisma quite slow, even in a 64GB + R9 5950x on native arch linux and intellij idea. I even tried mounting my node_modules on a literal ramdisk and couldn't notice a single improvement... That's weird because Prisma codegens everything, it shouldn't be as bad as having to infer stuff on compile time. Another comment also reports the same thing about Prisma.
