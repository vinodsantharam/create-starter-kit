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
    // {
    //     type: 'confirm',
    //     name: 'isAdminPortal',
    //     message: 'Is it an admin portal?',
    //     default: false
    // },
    // {
    //     type: 'confirm',
    //     name: 'includeAwsSso',
    //     message: 'Include AWS SSO?',
    //     default: false
    // }
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

        // Update package.json
        const pkgJsonPath = path.join(appName, 'package.json');
        try {
            if (await fs.pathExists(pkgJsonPath)) {
                const pkgJson = await fs.readJson(pkgJsonPath);
                pkgJson.name = appName;
                await fs.writeJson(pkgJsonPath, pkgJson, { spaces: 2 });
            }
        } catch (error) {
            spinner.warn(chalk.yellow('Could not update package.json.'));
        }

        // Update Layout.tsx
        const layoutPaths = [
            path.join(appName, 'app', 'layout.tsx'),
            path.join(appName, 'src', 'app', 'layout.tsx')
        ];

        let layoutPathFound = false;
        for (const layoutPath of layoutPaths) {
            try {
                if (await fs.pathExists(layoutPath)) {
                    let layoutContent = await fs.readFile(layoutPath, 'utf-8');
                    layoutContent = layoutContent.replace(
                        /(title:\s*)['"][^'"]*['"]/,
                        `$1'${appName}'`
                    );
                    layoutContent = layoutContent.replace(
                        /(description:\s*)['"][^'"]*['"]/,
                        `$1'${appName} description'`
                    );
                    await fs.writeFile(layoutPath, layoutContent);
                    layoutPathFound = true;
                    break; // Stop after finding and updating the first one
                }
            } catch (error) {
                spinner.warn(chalk.yellow('Could not update Layout.tsx.'));
                break;
            }
        }
        
        if (!layoutPathFound) {
            spinner.warn(chalk.yellow('Layout.tsx not found. Skipping metadata update.'));
        }

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