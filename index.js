#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const log = console.log;

log(chalk.blue.bold('Welcome to the 2c2p starter kit installer!'));

const questions = [
    {
        type: 'input',
        name: 'appName',
        message: 'What is the name of your app?',
        validate: (value) => {
            if (value.length) {
                return true;
            }
            return 'Please enter a name for your app.';
        }
    },
    {
        type: 'confirm',
        name: 'isAdminPortal',
        message: 'Is it an admin portal?',
        default: false
    },
    {
        type: 'confirm',
        name: 'includeAwsSso',
        message: 'Include AWS SSO?',
        default: false
    }
];

inquirer.prompt(questions).then(async (answers) => {
    const { appName, isAdminPortal, includeAwsSso } = answers;
    const spinner = ora(`Creating your new app ${appName}...`).start();
    
    try {
        const boilerplateUrl = 'https://github.com/vinodsantharam/2c2p-nextjs-starter-kit.git';
        await execa('git', ['clone', '--depth=1', boilerplateUrl, appName]);
        
        spinner.text = 'Cleaning up...';
        await fs.remove(path.join(appName, '.git'));

        spinner.text = 'Installing dependencies...';
        await execa('npm', ['install'], { cwd: appName });

        spinner.text = 'Customizing your app...';
        if (isAdminPortal) {
            await fs.writeFile(path.join(appName, 'admin.config.js'), '// Admin portal configuration');
        }
        if (includeAwsSso) {
            await fs.writeFile(path.join(appName, 'aws-sso.config.js'), '// AWS SSO configuration');
        }

        spinner.succeed(chalk.green(`Your new app ${appName} has been created!`));
        log(chalk.green('Your answers:'));
        log(JSON.stringify(answers, null, '  '));
        log('');
        log(chalk.blue.bold('Next steps:'));
        log(chalk.blue(`  cd ${appName}`));
        log(chalk.blue('  npm run dev'));
    } catch (error) {
        spinner.fail(chalk.red('Failed to create your app.'));
        log(chalk.red(error));
    }
}); 