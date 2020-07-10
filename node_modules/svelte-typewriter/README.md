# svelte-typewriter
> A simple and reusable typewriter effect for your Svelte applications

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![MadeWithSvelte.com shield](https://madewithsvelte.com/storage/repo-shields/2074-shield.svg)](https://madewithsvelte.com/p/svelte-typewriter/shield-link)

[DEMO](https://svelte.dev/repl/9dfb73bfa9b34aeea4740fa23f5cde8a)

## Installation

```bash
# yarn
yarn add -D svelte-typewriter

# npm
npm install -D svelte-typewriter
```

## Usage

You need to import the Svelte component, and wrap your elements with the `<Typewriter>` component

```svelte
<script>
	import Typewriter from 'svelte-typewriter'
</script>

<Typewriter>
	<h1>Testing the typewriter effect</h1>
	<h2>The typewriter effect cascades by default</h2>
	<p>Lorem ipsum dolor sit amet consectetur</p>
</Typewriter>
```

## Options

You can control the behavior of the typewriter effect by passing specific props to the `Typewriter` component

### `interval`

The interval in milliseconds between each letter

default: `30`

[DEMO](https://svelte.dev/repl/eb6caec159cf454b8f2bc98f3444fa8c)

#### Example:

```svelte
<Typewriter interval={50}>
	<p>Each letter of this paragraph will be displayed with a interval of 50 milliseconds</p>
</Typewriter>
```

You can also pass a custom array of distinct intervals to mimic human typing

```svelte
<Typewriter interval={[50, 60, 80]}>
	<p>Each letter of this paragraph will be randomly displayed with an interval of 50 or 60 or 80 milliseconds</p>
</Typewriter>
```

### `cascade`

Enables the cascading mode, where each element is animated sequentially instead of simultaneously

default: `false`

[DEMO](https://svelte.dev/repl/9ddb89942e954a2a90b553356952ff46)

#### Example:

```svelte
<Typewriter cascade>
	<h1>First</h1>
	<h2>Second</h2>
	<h3>Third</h3>
</Typewriter>
```

### `loop`

> **Warning:** won't work if `cascade` is enabled

Cycles the typewriter animation between the children elements of the `<Typewriter>` component, the tag name will be determined by the first child of the `<Typewriter>` component

default: `false`

[DEMO](https://svelte.dev/repl/e8b82d83f6c2444b97619238404bcd4d)

#### Example:

```svelte
<Typewriter loop>
	<p>This is a draft about the loop typewriter effect</p>
	<p>This is a draft about svelte-typewriter</p>
	<p>This text has nothing to do with the two previous phrases</p>
</Typewriter>
```

You can also pass a custom time interval between loops in milliseconds (the default interval is 1500 milliseconds)

```svelte
<Typewriter loop={500}>
	<p>This is a draft about the loop typewriter effect</p>
	<p>This is a draft about svelte-typewriter</p>
	<p>This text has nothing to do with the two previous phrases</p>
</Typewriter>
```

### `cursor`

Enables/disables the terminal cursor on the Typewriter animation, and also, allows you to pass any valid color name, hex code, rgb/rgba valid values to change the cursor color

[DEMO](https://svelte.dev/repl/6008b5aaff6f46e5909c63e795a19f5a)

#### Example:

```svelte
<Typewriter>
	<p>Terminal vibes, now on the web!</p>
</Typewriter>

<!-- Disables the cursor -->
<Typewriter cursor={false}>
	<p>No cursor here :/</p>
</Typewriter>

<!-- Changes the cursor color to green -->
<Typewriter cursor='green'>
	<p>All things green</p>
</Typewriter>
```

default: `true`

### `on:done`

Executes a specified function after the animation execution has finished

[DEMO](https://svelte.dev/repl/145cbf66c396497aa5338846077d53e0)

#### Example:

```svelte
<Typewriter on:done={() => alert('Done!')}>
	<h1>A "Done!" will be displayed after...</h1>
	<h2>Both of these texts animations are finished</h2>
</Typewriter>

<!-- You can omit both parenthesis and arrow function when you don't need to pass arguments -->

const alertOnDone = () => console.log('Typewriter Effect finished!')

<Typewriter on:done={alertOnDone}>
	<p>Lorem ipsum dolor...</p>
	<small>...sit amet consectetur</small>
</Typewriter>
```

default: `undefined`
