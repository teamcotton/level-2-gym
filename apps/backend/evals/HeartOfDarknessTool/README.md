# Heart of Darkness Agent Evaluation

This directory contains evaluation tests for the Heart of Darkness AI agent using [evalite](https://www.evalite.dev).

## Overview

The evaluation suite tests the accuracy of the AI agent when answering questions about Joseph Conrad's "Heart of Darkness" novella. The agent uses the `heartOfDarknessQA` tool to access the full text and answer questions.

## Test Cases

The eval includes 9 test questions covering key facts from the novella:

1. Which river is Marlow on when he begins narrating?
2. What position is Marlow hired for?
3. What African river does Marlow travel on?
4. What prevents Marlow from taking command of the steamboat?
5. What item does Marlow need to repair the steamboat?
6. What is Kurtz's job title?
7. What objects are on poles at Kurtz's station?
8. Who attacks the steamboat?
9. What are Kurtz's last words?

## Scoring Methods

### 1. LLM Judge Accuracy (Primary Scorer)

Uses Google Gemini as an "LLM-as-judge" to evaluate the quality of the agent's answers against expected answers.

**Scoring criteria:**

- **1.0** - Perfect/excellent (all key facts correct, well-explained)
- **0.75** - Good (most key facts correct, minor omissions)
- **0.5** - Acceptable (some correct facts, missing important details)
- **0.25** - Poor (minimal accuracy, major errors)
- **0.0** - Incorrect/irrelevant

**Pass threshold:** ≥ 0.75 (75%)

**Evaluation factors:**

- Factual accuracy
- Completeness
- Precision and relevance
- Citations from the text (bonus)

### 2. Keyword Match (Secondary Scorer)

A simple keyword-based scorer that checks if the agent's response contains key terms from the expected answer.

**Pass threshold:** ≥ 0.5 (50% of key terms present)

This scorer serves as a backup and sanity check to ensure the response is relevant even if the LLM judge fails.

## Running Evals

### Prerequisites

Make sure you have the required environment variables set in your `.env` file:

```bash
GOOGLE_API_KEY=your_api_key_here
MODEL_NAME=ggemini-1.5-flash
```

### Run Evaluations

From the `apps/backend` directory:

```bash
# Run all evaluations
pnpm eval

# View results in the browser
pnpm eval:view
```

### Output

Results are stored in `.evalite/` directory with:

- Console output showing scores for each test case
- JSON reports with detailed results
- Web UI for browsing results (via `pnpm eval:view`)

## Configuration

The eval configuration is in [`evalite.config.ts`](../../evalite.config.ts):

- **Max concurrency:** 1 (sequential execution to avoid API rate limits)
- **Timeout:** 120 seconds per task
- **Retries:** 0 (disabled to save API calls)

## Interpreting Results

### Overall Success

- All tests should pass (score ≥ 0.75 on LLM Judge)
- Average score should be > 0.85 for a well-performing agent

### Common Issues

**Low LLM Judge scores:**

- Agent not using the `heartOfDarknessQA` tool
- Agent hallucinating instead of citing the text
- SYSTEM_PROMPT not properly instructing the agent

**Low Keyword Match scores:**

- Agent providing vague or generic answers
- Agent not extracting key facts from the text

**Tool call failures:**

- Check `GetTextUseCase` is properly reading the text file
- Verify the Heart of Darkness text file exists at `data/heart-of-darkness.txt`

## Extending the Eval

To add more test cases, edit [`heartofdarkness.eval.ts`](./heartofdarkness.eval.ts):

```typescript
const testCases = [
  {
    question: 'Your new question here?',
    expectedAnswer: 'The expected answer based on the novella',
  },
  // ... more test cases
]
```

## Architecture

```
getAgentResponse(question)
  ↓
streamText({
  model: ggemini-1.5-flash,
  system: SYSTEM_PROMPT,
  tools: { heartOfDarknessQA },
  messages: [{ role: 'user', content: question }]
})
  ↓
Agent calls heartOfDarknessQA tool
  ↓
Tool returns full text of novella
  ↓
Agent generates answer
  ↓
llmJudgeScorer evaluates accuracy
```

## Best Practices

1. **Run evals regularly** - After any changes to the SYSTEM_PROMPT or tool implementation
2. **Review failing tests** - Use `pnpm eval:view` to see detailed responses
3. **Check for regressions** - Compare scores over time
4. **Monitor API costs** - Each eval run makes multiple API calls
5. **Add edge cases** - Test ambiguous questions or tricky scenarios

## Resources

- [Evalite Documentation](https://www.evalite.dev)
- [Evalite Scorers Guide](https://www.evalite.dev/guides/scorers)
- [Heart of Darkness Tool Implementation](../../src/infrastructure/ai/tools/heart-of-darkness.tool.ts)
- [AI Constants (SYSTEM_PROMPT)](../../src/shared/constants/ai-constants.ts)
