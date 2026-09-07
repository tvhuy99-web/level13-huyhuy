# Level 13

Level 13 is an text-based incremental science fiction browser adventure where the player must survive in a dark, decayed City, (re-)discover old and new technologies, and rebuild a civilization that has collapsed.

The game is in active development. It is a personal side project but has also received some fixes from the community along the way. Bug reports and feedback are very welcome, but please check the [contributing guidelines](docs/CONTRIBUTING.md) first.

## Quick Links
* Play the game [here](https://nroutasuo.github.io/level13/)
* Read about how to report bugs, suggest features, or submit fixes to the project in the [contributing guidelines](docs/CONTRIBUTING.md)
* Chat about the game or get help on the [discussions page](https://github.com/nroutasuo/level13/discussions), the [subreddit](https://www.reddit.com/r/level13/), or the [Discord server](https://discord.gg/BzMbATyKph)

## Game Overview

### Features

* Survival and exploration
* Base-building and resource-management
* Randomly generated maps
* Items, equipment and environmental hazards
* Technologies that slowly unlock new aspects of the game

## Code Overview

The project uses [jQuery](https://jquery.com/), [Require.js](http://requirejs.org/), and [Ash.js](https://github.com/brejep/ash-js) and is structured according to an entity system framework into entities, components and systems.

### Branches
* **master** is a development branch and can contain unfinished and buggy features
* **gh-pages** is more stable and contains whatever is currently live

### Entities and Components

All game data is stored in various Components that are attached to entities such as the player or a sector. Entities are simply containers for Components.
