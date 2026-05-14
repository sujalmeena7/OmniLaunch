# Implementation Plan: Early Phase Gaps

## Overview

This plan implements five subsystems that fill gaps in OmniLaunch's earlier phases: a simplified text-only Voice Lab UI, a PUT endpoint for voice profile updates, frontend SSE consumption for real-time generation progress, LangGraph-based agent orchestration, and embedding-based voice match scoring. Tasks are ordered so foundational backend work (schemas, services, embeddings) is completed first, followed by the LangGraph pipeline rewrite, then frontend work, and finally integration wiring.

## Tasks

- [ ] 1. Set up dependencies and core schemas
  - [x] 1.1 Add backend dependencies for LangGraph and numpy
    - Add `langgraph>=0.2.0` and `numpy>=1.26.0` to `backend/requirements.txt`
    - _Requirements: 4.1, 5.4_

  - [x] 1.2 Add frontend dev dependency for fast-check
    - Add `fast-check: "^3.0.0"` to `devDependencies` in `frontend/package.json`
    - _Requirements: 5.7 (testing infrastructure)_

  - [x] 1.3 Create UpdateVoiceProfileRequest schema
    - Add `UpdateVoiceProfileRequest` Pydantic model to `backend/app/models/schemas.py`
    - Fields: `samples: list[VoiceSample]` with `min_length=1, max_length=20`, `name: str | None = None`
    - _Requirements: 2.1_

- [x] 2. Implement embedding-based voice match scoring
  - [x] 2.1 Implement `generate_style_embedding` function in voice service
    - Add `generate_style_embedding(text: str) -> list[float]` to `backend/app/services/voice_service.py`
    - Call Google's `text-embedding-004` model with `task_type="SEMANTIC_SIMILARITY"`
    - Return the 768-dimensional embedding vector
    - _Requirements: 5.1_

  - [x] 2.2 Implement `compute_cosine_similarity` in humanizer
    - Add `compute_cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float` to `backend/app/agents/humanizer.py`
    - Use numpy for dot product and norm calculations
    - Guard against zero-vector division (return 0.0)
    - _Requirements: 5.4_

  - [x] 2.3 Implement `normalize_cosine_to_score` in humanizer
    - Add `normalize_cosine_to_score(cosine_sim: float) -> float` to `backend/app/agents/humanizer.py`
    - Map [-1, 1] range to [0, 1] using formula `(cosine_sim + 1.0) / 2.0`
    - _Requirements: 5.6_

  - [ ]* 2.4 Write property test for cosine similarity and normalization (Property 8)
    - **Property 8: Cosine similarity computation and normalization**
    - For any two valid 768-dimensional vectors, `compute_cosine_similarity` returns a value in [-1.0, 1.0], and `normalize_cosine_to_score` maps that to [0.0, 1.0]
    - Use Hypothesis with `@given(st.lists(st.floats(...), min_size=768, max_size=768))`
    - **Validates: Requirements 5.4, 5.6**

  - [ ]* 2.5 Write property test for self-similarity identity (Property 9)
    - **Property 9: Self-similarity identity (round-trip)**
    - For any valid non-zero vector, `cosine_similarity(v, v)` produces 1.0 within floating-point tolerance (1e-7)
    - After normalization, voice_match_score is 1.0
    - Use Hypothesis with non-zero vector generation
    - **Validates: Requirements 5.7**

  - [x] 2.6 Integrate embedding scoring into humanizer's voice match flow
    - Modify the humanizer's scoring logic to call `generate_style_embedding` on the draft text
    - Compute cosine similarity between draft embedding and stored `style_embedding`
    - Normalize the result to produce `voice_match_score`
    - If `style_embedding` is None (legacy profiles), fall back to existing heuristic `score_voice_match()`
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [x] 3. Implement Voice Profile PUT endpoint
  - [x] 3.1 Add PUT endpoint to voice router
    - Add `PUT /voice-profiles/{profile_id}` to `backend/app/routers/voice.py`
    - Accept `UpdateVoiceProfileRequest` body
    - Verify profile exists (404 if not) and belongs to authenticated user (403 if not)
    - _Requirements: 2.1, 2.4, 2.5_

  - [x] 3.2 Wire re-analysis and embedding generation into PUT handler
    - Call `analyze_voice_samples(samples)` to produce updated Tone Manifesto
    - Call `generate_style_embedding(combined_text)` to produce 768-dim vector
    - Update DB record with new manifesto, samples, embedding, and confidence
    - Return updated profile response
    - _Requirements: 2.2, 2.3, 5.1, 5.2_

  - [ ]* 3.3 Write unit tests for PUT endpoint
    - Test 404 response for non-existent profile
    - Test 403 response for profile belonging to another user
    - Test successful update flow with valid samples
    - Test 422 response for empty samples array
    - **Validates: Requirements 2.1, 2.4, 2.5**

- [x] 4. Checkpoint - Ensure all backend embedding and PUT tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Rewrite agent pipeline with LangGraph
  - [x] 5.1 Define PipelineState TypedDict and graph structure
    - Rewrite `backend/app/agents/graph.py` to define `PipelineState` TypedDict
    - Create `StateGraph(PipelineState)` with nodes: `context_research`, `drafting`, `humanizing`
    - Set entry point to `context_research`
    - Add edges: `context_research → drafting → humanizing`
    - _Requirements: 4.1, 4.4_

  - [x] 5.2 Implement routing function and conditional edges
    - Add `route_after_humanize(state: PipelineState) -> str` function
    - Return `"drafting"` if `voice_match_score < 0.85` AND `revision_count < 3`
    - Return `"end"` otherwise
    - Add conditional edges from `humanizing` node using this routing function
    - _Requirements: 4.2, 4.3_

  - [ ]* 5.3 Write property test for routing decision (Property 4)
    - **Property 4: Humanizer routing decision is deterministic**
    - For any `voice_match_score` in [0.0, 1.0] and `revision_count` in [0, ∞), verify routing returns `"drafting"` iff score < 0.85 AND count < 3
    - Use Hypothesis with `@given(st.floats(0.0, 1.0), st.integers(0, 100))`
    - **Validates: Requirements 4.2, 4.3**

  - [x] 5.4 Implement node functions with progress callbacks
    - Implement `context_research_node`, `drafting_node`, `humanizing_node` as async functions
    - Each node invokes `progress_callback(platform, status, detail)` on completion
    - Status values: `"researching"`, `"drafting"`, `"humanizing"`
    - _Requirements: 4.5_

  - [x] 5.5 Implement outer loop for sequential target processing with fault isolation
    - Iterate over target platforms sequentially
    - Invoke compiled graph once per target
    - Wrap each invocation in try/except: on exception, log error, record `"failed"` status, continue to next target
    - _Requirements: 4.6, 4.7_

  - [ ]* 5.6 Write property test for progress callback invocation (Property 5)
    - **Property 5: Progress callback invoked for each node completion**
    - For any target platform, verify progress_callback is invoked at least once per node with matching status
    - Use Hypothesis with mocked agents and callback tracking
    - **Validates: Requirements 4.5**

  - [ ]* 5.7 Write property test for sequential processing (Property 6)
    - **Property 6: Targets are processed in sequential order**
    - For any list of N targets, verify the i-th callback sequence corresponds to targets[i]
    - Use Hypothesis with `@given(st.lists(st.text(min_size=1), min_size=1, max_size=5))`
    - **Validates: Requirements 4.6**

  - [ ]* 5.8 Write property test for fault isolation (Property 7)
    - **Property 7: Fault isolation across targets**
    - For any list of targets where target at index k raises an exception, verify all targets at indices > k are still processed
    - Use Hypothesis with random failure injection
    - **Validates: Requirements 4.7**

- [x] 6. Checkpoint - Ensure LangGraph pipeline tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Simplify Voice Lab UI to text-only
  - [x] 7.1 Refactor Voice Lab page to text-only samples
    - Modify `frontend/src/app/(dashboard)/dashboard/voice-lab/page.tsx`
    - Remove the `<select>` type dropdown and URL input rendering branch
    - Add "Paste samples of your writing below" label above sample input area
    - Render each sample as a `<textarea>` accepting plain text only
    - Change max samples from 10 to 5
    - Hide "Add Sample" button when sample count reaches 5
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 7.2 Update form submission to force text type
    - On submit, filter out empty/whitespace-only samples
    - Map remaining samples to `{ type: "text", value: sample }` format
    - Send payload to voice training endpoint
    - _Requirements: 1.6_

  - [ ]* 7.3 Write property test for submission filtering (Property 1)
    - **Property 1: Submission filters empty samples and forces text type**
    - For any array of sample strings, submitting produces a payload containing only non-empty (trimmed) samples, each with `type: "text"`
    - Use fast-check with `fc.array(fc.string())`
    - **Validates: Requirements 1.6**

- [x] 8. Implement frontend SSE consumption
  - [x] 8.1 Create `useBundleSSE` hook
    - Create `frontend/src/lib/hooks/useBundleSSE.ts`
    - Accept `bundleId: string | null` and `token: string | null` parameters
    - Return `{ events: SSEEvent[], isComplete: boolean, isFailed: boolean, error: string | null }`
    - Open `EventSource` to `/api/v1/bundles/{id}/status?token={jwt}` when bundleId is provided
    - Parse each `data:` line as JSON SSEEvent
    - On `status: "complete"` → close connection, set `isComplete = true`
    - On `status: "failed"` → close connection, set `isFailed = true`, surface error
    - On EventSource `onerror` → close connection, set error for fallback
    - On unmount → close connection via cleanup return
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 8.2 Integrate `useBundleSSE` into Launch page
    - Modify `frontend/src/app/(dashboard)/dashboard/launch/page.tsx`
    - Replace polling mechanism with `useBundleSSE` hook when bundle generation is initiated
    - Update UI to display current platform and generation stage from SSE events
    - On `isComplete` → fetch final bundle data
    - On `isFailed` → display error message
    - On `error` (connection failure) → fall back to existing polling mechanism
    - Include auth token as query parameter in EventSource URL
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 8.3 Write property test for SSE event parsing (Property 3)
    - **Property 3: SSE event parsing updates UI state correctly**
    - For any valid SSE event with known status and any platform string, parsing updates UI state to reflect that platform's current status
    - Use fast-check with `fc.record({ platform: fc.string(), status: fc.constantFrom(...), detail: fc.string() })`
    - **Validates: Requirements 3.2**

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Backend uses Python (Hypothesis for property tests), frontend uses TypeScript (fast-check for property tests)
- The `style_embedding VECTOR(768)` column already exists in the database — no migration needed

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["2.4", "2.5", "2.6"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3"] },
    { "id": 5, "tasks": ["5.1"] },
    { "id": 6, "tasks": ["5.2", "5.4"] },
    { "id": 7, "tasks": ["5.3", "5.5"] },
    { "id": 8, "tasks": ["5.6", "5.7", "5.8"] },
    { "id": 9, "tasks": ["7.1"] },
    { "id": 10, "tasks": ["7.2", "8.1"] },
    { "id": 11, "tasks": ["7.3", "8.2"] },
    { "id": 12, "tasks": ["8.3"] }
  ]
}
```
