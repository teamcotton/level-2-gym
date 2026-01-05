# Evalite Setup for Heart of Darkness Agent

This document provides a quick overview of the evaluation system for the Heart of Darkness AI agent.

## What is Evalite?

[Evalite](https://www.evalite.dev) is an evaluation framework that helps you test and measure the accuracy of AI agents. It supports:

- Custom scoring functions
- LLM-as-judge evaluations
- Parallel test execution
- Web UI for browsing results
- JSON and console reporters

## Quick Start

### 1. Ensure Environment Variables

**Critical:** Make sure your `.env` file in `apps/backend` contains:

```bash
# Google AI SDK uses GOOGLE_API_KEY
GOOGLE_API_KEY=your_google_api_key_here

# Application uses GOOGLE_GENERATIVE_AI_API_KEY (same value)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here

# Model configuration
MODEL_NAME=gemini-1.5-flash
```

**Important:** The AI SDK library (used by evalite) looks for `GOOGLE_API_KEY` in the environment, while the application code uses `GOOGLE_GENERATIVE_AI_API_KEY`. You need to set both to the same value.

**Without a valid `GOOGLE_API_KEY`, the evals will fail immediately with "API key not valid" errors.**

### 2. Rebuild Native Dependencies (One-time setup)

Evalite uses `better-sqlite3` which requires native bindings. After installing evalite for the first time, you must rebuild the native module:

```bash
cd apps/backend
npm rebuild better-sqlite3
```

**Why npm and not pnpm?** pnpm ignores build scripts for security reasons. Using `npm rebuild` forces compilation of the native bindings for your platform (macOS ARM64, Linux x64, etc.).

**You'll know you need this if you see:** `"Could not locate the bindings file"` error when running `pnpm eval`.

### 3. Run Evaluations

**Important:** Always run these commands from the `apps/backend` directory.

```bash
# Navigate to backend directory
cd apps/backend

# Run all evals (this will create the .evalite directory with results)
pnpm eval

# After running evals, view results in browser
pnpm eval:view
```

**Note:** You must run `pnpm eval` first before running `pnpm eval:view`. The view command displays previously generated results.

### 3. Check Results

Results are saved in `apps/backend/.evalite/` directory:

- Console output shows real-time progress
- JSON files contain detailed scores
- Web UI (via `pnpm eval:view`) provides interactive browsing

## Test Structure

The eval suite tests the Heart of Darkness agent with 9 questions covering key facts from the novella.

### Scoring Methods

1. **LLM Judge Accuracy** (Primary - Pass threshold: 75%)
   - Uses Gemini to evaluate answer quality
   - Considers factual accuracy, completeness, and precision
   - Rewards citations from the text

2. **Keyword Match** (Secondary - Pass threshold: 50%)
   - Simple keyword matching scorer
   - Ensures relevant terms appear in responses
   - Acts as a sanity check

## File Structure

```
apps/backend/
├── evalite.config.ts              # Evalite configuration
├── evals/
│   └── HeartOfDarknessTool/
│       ├── heartofdarkness.eval.ts    # Test suite
│       └── README.md                   # Detailed documentation
```

## Configuration

In [`evalite.config.ts`](./evalite.config.ts):

- **maxConcurrency: 1** - Sequential execution (avoids API rate limits)
- **timeout: 120000** - 2 minutes per task
- **reporters: ['console', 'json']** - Output formats

## Interpreting Results

### Success Criteria

- All tests should pass (score ≥ 0.75 on LLM Judge)
- Average score should be > 0.85

### Common Issues

**Low scores?**

- Agent not using the `heartOfDarknessQA` tool
- Agent hallucinating instead of citing text
- SYSTEM_PROMPT needs refinement

**Tool failures?**

- Check `data/heart-of-darkness.txt` exists
- Verify `GetTextUseCase` is working correctly

## Adding More Tests

Edit [`evals/HeartOfDarknessTool/heartofdarkness.eval.ts`](./evals/HeartOfDarknessTool/heartofdarkness.eval.ts):

```typescript
const testCases = [
  {
    question: 'Your question here?',
    expectedAnswer: 'Expected answer from the novella',
  },
  // ... more cases
]
```

## Best Practices

1. **Run evals after changes** - Test SYSTEM_PROMPT or tool modifications
2. **Review failures** - Use web UI to see what went wrong
3. **Track scores over time** - Monitor for regressions
4. **Mind API costs** - Each eval makes multiple API calls

## Documentation

For detailed information, see:

- [Heart of Darkness Eval README](./evals/HeartOfDarknessTool/README.md)
- [Evalite Documentation](https://www.evalite.dev)
- [Evalite Scorers Guide](https://www.evalite.dev/guides/scorers)

## Example Output

```
✓ Heart of Darkness Agent Accuracy
  ✓ Test 1/9: Thames River question (LLM: 0.95, Keywords: 1.0)
  ✓ Test 2/9: Captain position (LLM: 1.0, Keywords: 1.0)
  ...

Average Scores:
  LLM Judge Accuracy: 0.89 (8/9 passed)
  Keyword Match: 0.92 (9/9 passed)
```

## Troubleshooting

**"Could not locate the bindings file" (better-sqlite3 error)**

- Evalite uses better-sqlite3 which needs native bindings compiled for your platform
- **Root cause:** pnpm ignores build scripts for security reasons when installing packages
- **Solution:** Use npm to force rebuild the native module:
  ```bash
  cd apps/backend
  npm rebuild better-sqlite3
  ```
- This compiles the native bindings for your specific platform (e.g., darwin/arm64 on Mac M1/M2)
- After rebuilding, `pnpm eval` should work without errors

**Alternative approaches that DON'T work:**

- `pnpm rebuild better-sqlite3` - pnpm still ignores build scripts
- `pnpm approve-builds better-sqlite3` - reports "no packages awaiting approval"
- Manual build in node_modules - gets wiped on next install

**"API key not valid" or "GOOGLE_API_KEY not found"**

- Add your key to `apps/backend/.env` file
- Ensure the key is valid and active in Google Cloud Console
- Format: `GOOGLE_API_KEY=AIza...your_key_here`

**"Cannot find module"**

- Run `pnpm install` from root directory

**Tests timing out**

- Increase timeout in `evalite.config.ts`
- Check network connection

**All tests failing**

- Verify `data/heart-of-darkness.txt` exists
- Check SYSTEM_PROMPT in `src/shared/constants/ai-constants.ts`
