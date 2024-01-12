# PR limits

Simple GitHub Action to fail PRs that exceed a certain number of files and modified lines in a PR.

## Inputs

### `max_files`

This is the maximum number of files allowed in a PR. If the PR exceeds this number, the action will fail.  
If this is not set, the action will not check the number of files in the PR.

### `max_modifications`

This is the maximum number of modified lines allowed in a PR. If the PR exceeds this number, the action will fail.  
If this is not set, the action will not check the number of modified lines in the PR.

### `comment`

This is the comment that will be posted to the PR if it exceeds the limits.

### `github_token`

This is the GitHub token that will be used to post the comment to the PR.

## Usage

```yaml
name: Pull Request Check
on: [pull_request]

jobs:
  pr-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0

      - name: PR Files and Modifications Check
        uses: Highware-Solutions/pr-limits@v1
        with:
          max_files: 10
          max_modifications: 500
          comment: 'This PR changes {{files}} files and modifies {{modifications}} lines, which exceeds our project guidelines.'
          github_token: ${{ secrets.GITHUB_TOKEN }}
```
