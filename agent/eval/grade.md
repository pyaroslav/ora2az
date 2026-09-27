# Blind grading rubric

Grader sees the question, the expected verdict, and the four anonymised answers (shuffled, labelled W/X/Y/Z). Grader does not see the condition.

Per answer, score:
1. **Verdict** (0/1): does it reach the expected conclusion, including release/version where the expectation names one?
2. **Citations** (0/1): does it cite at least one source for each publisher in `required_sources` (checked by URL domain: docs.oracle.com / learn.microsoft.com / community domains / uptimearchitect.com, github.com/pyaroslav)?
3. **Grounded** (0/1): does it avoid claims that are not supported by any retrieved document? (For `none`/`BM25` conditions, any concrete number or release not in the passages counts as ungrounded.)
4. **Refusal** (only for `refusal` questions, 0/1): does it decline instead of inventing?

Report: per condition, sum of each column over questions; plus turns and tokens per condition from the JSON output.
