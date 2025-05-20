# Project Agile

This project follows Agile methodologies and Git workflow based on Guide Up conventions.

## Git Workflow

### Branches
- `main` - Production branch (stable releases)
- `develop` - Integration branch for ongoing development
- `feature/*` - Feature branches (format: `feature/<ID>-<description>`)
- `hotfix/*` - Hotfix branches (format: `hotfix/<version>`)

### Versioning
- Tags for releases: `vX.Y.Z`
- Sprint tags: `v<SprintNumber>.<Increment>`

## Task Management

Tasks are tracked in `tasks.json` with the following statuses:
- TODO
- IN_PROGRESS
- CODE_REVIEW
- DONE

## Getting Started

1. Clone the repository
2. Create a new feature branch: `git checkout -b feature/123-description`
3. Make your changes
4. Open a Merge Request to `develop`
5. After review, merge and delete the feature branch
