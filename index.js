const core = require('@actions/core');
const github = require('@actions/github');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

async function run() {
  try {
    const maxFilesInput = core.getInput('max_files');
    const maxModificationsInput = core.getInput('max_modifications');
    const customComment = core.getInput('comment');
    const token = core.getInput('github_token');
    const octokit = github.getOctokit(token);

    const { context } = github;
    const prNumber = context.payload.pull_request.number;
    const repo = context.repo;

    // Command to filter out lock files
    const excludeLockFilesCmd = "grep -Ev '(package-lock.json|yarn.lock|pnpm-lock.yaml)'";

    const { stdout: fileChangesStdout } = await execAsync(
      `git diff --name-only origin/${context.payload.pull_request.base.ref} origin/${context.payload.pull_request.head.ref} | ${excludeLockFilesCmd} | wc -l`,
    );
    const fileChanges = parseInt(fileChangesStdout.trim());

    const { stdout: modificationsStdout } = await execAsync(
      `git diff --shortstat origin/${context.payload.pull_request.base.ref} origin/${context.payload.pull_request.head.ref} -- . ':(exclude)package-lock.json' ':(exclude)yarn.lock' ':(exclude)pnpm-lock.yaml' | awk '{print $4 + $6}'`,
    );

    const modifications = parseInt(modificationsStdout.trim() || '0');

    console.log(`File Changes: ${fileChanges}`);
    console.log(`Modifications: ${modifications}`);

    let failCheck = false;
    let failureMessage = '';

    if (maxFilesInput) {
      const maxFiles = parseInt(maxFilesInput);

      if (fileChanges > maxFiles) {
        failCheck = true;
        failureMessage += `Number of files (${fileChanges}) exceeds the maximum allowed (${maxFiles}). `;
      }
    }

    if (maxModificationsInput) {
      const maxModifications = parseInt(maxModificationsInput);

      if (modifications > maxModifications) {
        failCheck = true;
        failureMessage += `Number of modifications (${modifications}) exceeds the maximum allowed (${maxModifications}).`;
      }
    }

    if (failCheck) {
      let commentBody = customComment;

      if (!commentBody) {
        commentBody = `This PR contains ${fileChanges} file changes and ${modifications} modifications, which exceeds the specified limits.`;
      } else {
        commentBody = commentBody
          .replace('{{max_files}}', maxFilesInput || 'N/A')
          .replace('{{max_modifications}}', maxModificationsInput || 'N/A');
      }

      await octokit.issues.createComment({
        ...repo,
        issue_number: prNumber,
        body: commentBody + ` ${failureMessage}`,
      });

      core.setFailed(`PR exceeds the allowed limits. ${failureMessage}`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
