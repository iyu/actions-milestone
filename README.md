[![GitHub Actions status](https://github.com/iyu/actions-milestone/workflows/Lint%20and%20Test/badge.svg)](https://github.com/iyu/actions-milestone)

# ActionsMilestone

This action add milestone to PRs.:hammer:

## Inputs

### `repo-token`

**required** The GITHUB_TOKEN secret.

### `configuration-path`

**required** The path for the milestone configurations. Default `".github/milestone.yml"`

## Outputs

### `milestone`

The added milestone.

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
```
