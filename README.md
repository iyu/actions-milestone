[![GitHub Actions status](https://github.com/iyu/actions-milestone/workflows/Lint%20and%20Test/badge.svg)](https://github.com/iyu/actions-milestone)

# ActionsMilestone

This action add milestone to PRs.:hammer:

## Inputs

### `repo-token`

**required** The GITHUB_TOKEN secret.

### `configuration-path`

**required** The path for the milestone configurations. Default `".github/milestone.yml"`

*Note if the configuration is located outside of the repository, like it could be if used in a reusable workflow, the reference of
the configuration file must be defined with the `@` syntax, e.g. `".github/milestone.yml@master"`*

### `configuration-repo`

The repository where the configuration is located (default to the same repos as the action). This
input is needed when the action is used inside a reusable workflow outside of the action caller repository.

### `silent`

Be silent in case of any failures.

### `force`

Overwrite the PR's milestone if it is already set and doesn't match the one found from the config. NOTE: do nothing if there is no milestone match from the config.

### `clear`

Clear the PR's milestone if it is already set and there is no match from the configuration.

## Outputs

### `milestone`

The added/modified milestone or `null` when no milestone is set.

### `previous`

Previous milestone or `null` when no milestone was set.

## Example usage

### `.github/milestone.yml`

```yaml
base-branch:
  - "(master)"
  - "releases\\/(v\\d+)"

head-branch:
  - "feature\\/(v\\d+)\\/.+"
```

### `.github/workflows/milestone.yml`

```yaml
name: Pull Request Milestone

on:
  pull_request:
    types:
      - opened

jobs:
  milestone:
    name: Pull Request Milestone
    runs-on: ubuntu-latest
    steps:
      - uses: iyu/actions-milestone@v1
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
          configuration-path: .github/milestone.yml
          silent: true
```
