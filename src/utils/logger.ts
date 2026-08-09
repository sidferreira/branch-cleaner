import chalk from 'chalk';

let tag = '';

export const logger = {
  log: (...args: unknown[]): void => {
    console.log(...args);
  },
  info: (...args: unknown[]): void => {
    console.info(tag, ...args);
  },
  warn: (...args: unknown[]): void => {
    console.log(tag, chalk.yellow('Warning:'), ...args);
  },
  error: (...args: unknown[]): void => {
    console.log(tag, chalk.red('Error:'), ...args);
  },
  debug: (...args: unknown[]): void => {
    console.log(tag, chalk.grey(...args));
  },
  setCommandVersion: (version: string): void => {
    tag = chalk.bgGrey(chalk.black(version));
  },
};
