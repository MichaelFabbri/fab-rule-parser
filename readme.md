# FAB Rule Parser

Flesh and Blood Rule Parser (fab-rp) is a small module that parses the Comprehensive Rules PDF into json format.

# Usage

fab-rp can be used via command-line to produce a .json file, or can be integrated with an external application, such as an API.

## In the CLI

fab-rp provides a cli interface created with [commander](https://github.com/tj/commander.js).

### Running fab-rp CLI

This guide will use pnpm, however npm or yarn should work.

1. Run ```pnpm install``` to install dependencies.
2. Run ```pnpm start -h``` to view usage.
3. Run ```pnpm start [desired_args]```.

### Options

Usage can be displayed from cli with ```pnpm start -h```.

The following arguments are available in the cli

| short | long       | args   | description                  |
|-------|------------|--------|------------------------------|
| -d    | --download |        | download the latest pdf      |
| -o    | --outfile  | <path> | output json file path        |
| -i    | --infile   | <path> | input pdf file path          |
| -h    | --help     |        | display help for command     |

*Note:* If the ```-d``` argument is provided, the latest pdf will be downloaded from the flesh and blood website and saved to the infile path (```-i``` argument). To avoid putting unneccessary strain on the Flesh and Blood servers, please only use this argument if you do not have a local copy of the rules or believe your local copy to be outdated.

## As a dependency

This module exports a variety of types that may be useful for working with rules within a typescript application. This module is not currently published to NPM, but can be if the community desires.

# Disclaimer

FAB Rule Parser is third-party software intended to enhance the Flesh and Blood community. FAB Rule Parser in no way affiliated with Legend Story Studios®.