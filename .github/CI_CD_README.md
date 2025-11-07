# CI/CD Pipeline Documentation

## Overview
Automated testing, building, and deployment workflows for ZetaPay using GitHub Actions.

## Workflows

### 1. **Smart Contract Tests** (`contracts-test.yml`)
**Trigger**: Push/PR to main/develop with contract changes

**Jobs**:
- ✅ **Test**: Compile contracts + Run 48 unit tests
- ✅ **Lint**: Check Solidity code formatting

**What it does**:
- Installs dependencies
- Compiles all Solidity contracts
- Runs comprehensive test suite (48 tests)
- Reports test results in PR

**Status Badge**:
```markdown
![Contracts](https://github.com/Parthkk90/ZetaPay/actions/workflows/contracts-test.yml/badge.svg)
```

---

### 2. **Extension Build** (`extension-build.yml`)
**Trigger**: Push/PR to main/develop with web changes

**Jobs**:
- ✅ **Build**: Build Next.js app + Package extension
- ✅ **Lint**: TypeScript type checking

**What it does**:
- Builds Next.js static export
- Creates extension package
- Uploads artifacts for download
- TypeScript validation

**Artifacts**:
- `zetapay-extension` - Built extension files
- `zetapay-extension-zip` - Store-ready zip

**Status Badge**:
```markdown
![Extension](https://github.com/Parthkk90/ZetaPay/actions/workflows/extension-build.yml/badge.svg)
```

---

### 3. **Full CI Pipeline** (`ci.yml`)
**Trigger**: Push/PR to main

**Jobs**:
- ✅ **Contracts**: Compile + Test smart contracts
- ✅ **Extension**: Build browser extension
- ✅ **Quality**: Code quality checks

**What it does**:
- Complete validation of entire project
- Parallel execution for speed
- Comprehensive summary report

**Status Badge**:
```markdown
![CI](https://github.com/Parthkk90/ZetaPay/actions/workflows/ci.yml/badge.svg)
```

---

### 4. **Deploy to Testnet** (`deploy-testnet.yml`)
**Trigger**: Manual (workflow_dispatch)

**Inputs**:
- `network`: zeta_testnet or localhost
- `confirm`: Type "deploy" to confirm

**What it does**:
- Runs all tests before deployment
- Deploys UniversalPayment contract
- Saves deployment info as artifact
- Requires manual confirmation

**How to use**:
1. Go to Actions tab
2. Select "Deploy to Testnet"
3. Click "Run workflow"
4. Select network
5. Type "deploy" to confirm
6. Click "Run workflow"

**⚠️ Requirements**:
- Set `DEPLOYER_PRIVATE_KEY` in repository secrets
- Ensure deployer has testnet ZETA

---

### 5. **PR Validation** (`pr-validation.yml`)
**Trigger**: Pull request opened/updated

**Checks**:
- ✅ PR title convention (feat/fix/docs/etc)
- ✅ Branch name validation
- ✅ Breaking changes detection
- ✅ PR size check (warns if >50 files)
- ✅ Test coverage (warns if contract changed without tests)

**PR Title Convention**:
```
feat: add new feature
fix: bug fix
docs: documentation
test: add tests
chore: maintenance
ci: CI/CD changes
refactor: code refactoring
style: formatting
```

---

## Setup Instructions

### 1. Configure Repository Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret Name | Description | Required For |
|------------|-------------|--------------|
| `DEPLOYER_PRIVATE_KEY` | Testnet deployer private key | Testnet deployment |
| `NEXT_PUBLIC_UNIVERSAL_PAYMENT_ADDRESS` | Contract address (optional) | Extension build |

### 2. Enable GitHub Actions

1. Go to **Settings → Actions → General**
2. Set **Actions permissions** to "Allow all actions"
3. Set **Workflow permissions** to "Read and write permissions"

### 3. Add Status Badges to README

Add to main `README.md`:

```markdown
## Build Status

![Contracts](https://github.com/Parthkk90/ZetaPay/actions/workflows/contracts-test.yml/badge.svg)
![Extension](https://github.com/Parthkk90/ZetaPay/actions/workflows/extension-build.yml/badge.svg)
![CI](https://github.com/Parthkk90/ZetaPay/actions/workflows/ci.yml/badge.svg)
```

---

## Workflow Triggers Summary

| Workflow | Push to main | Push to develop | PR to main | PR to develop | Manual |
|----------|--------------|-----------------|------------|---------------|--------|
| contracts-test.yml | ✅ | ✅ | ✅ | ✅ | ❌ |
| extension-build.yml | ✅ | ✅ | ✅ | ✅ | ❌ |
| ci.yml | ✅ | ❌ | ✅ | ❌ | ❌ |
| deploy-testnet.yml | ❌ | ❌ | ❌ | ❌ | ✅ |
| pr-validation.yml | ❌ | ❌ | ✅ | ✅ | ❌ |

---

## Local Testing

Before pushing, test locally:

```bash
# Test contracts
cd contracts
yarn hardhat test

# Build extension
cd web
yarn build:extension

# TypeScript check
yarn tsc --noEmit
```

---

## Debugging Failed Workflows

### Contract Tests Failing
```bash
# Run locally
cd contracts
yarn hardhat test

# Check specific test
yarn hardhat test test/UniversalPayment.security.test.ts

# Clean and rebuild
yarn hardhat clean
yarn hardhat compile
```

### Extension Build Failing
```bash
# Run locally
cd web
yarn build

# Check TypeScript
yarn tsc --noEmit

# Clear Next.js cache
rm -rf .next
yarn build
```

### Deployment Failing
- Check `DEPLOYER_PRIVATE_KEY` is set correctly
- Ensure deployer has testnet ZETA
- Verify network configuration in `hardhat.config.ts`

---

## Best Practices

1. **Always create PRs** - Never push directly to main
2. **Run tests locally** before pushing
3. **Keep PRs small** - Under 50 files when possible
4. **Follow commit conventions** - Use conventional commits
5. **Wait for CI** - Ensure all checks pass before merging
6. **Review artifacts** - Check uploaded extension builds

---

## Monitoring

### View Workflow Runs
1. Go to **Actions** tab
2. Select workflow
3. Click on specific run

### Download Artifacts
1. Go to completed workflow run
2. Scroll to **Artifacts** section
3. Click artifact name to download

---

## Future Enhancements

- [ ] Add code coverage reporting (Istanbul/Codecov)
- [ ] Add gas usage reporting (hardhat-gas-reporter)
- [ ] Add automated contract verification on testnet
- [ ] Add Slack/Discord notifications on deployment
- [ ] Add automated dependency updates (Dependabot)
- [ ] Add security scanning (Slither, MythX)
- [ ] Add performance benchmarking
- [ ] Add automated release notes generation

---

## Troubleshooting

### "Resource not accessible by integration"
- Go to Settings → Actions → General
- Enable "Read and write permissions"

### "Secret DEPLOYER_PRIVATE_KEY not found"
- Add secret in Settings → Secrets and variables → Actions

### "Node.js version not found"
- Check `node-version` in workflow matches installed version

---

**Last Updated**: November 7, 2025  
**Maintained By**: ZetaPay Team
