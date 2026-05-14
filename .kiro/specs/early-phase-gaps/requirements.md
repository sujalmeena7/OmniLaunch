# Requirements Document

## Introduction

This feature fills implementation gaps in the earlier phases of the OmniLaunch project. Five subsystems need completion: a simplified text-only Voice Lab UI, the PUT endpoint for voice profile updates, frontend SSE consumption for real-time generation progress, LangGraph-based agent orchestration, and embedding-based voice match scoring. Each gap represents functionality specified in the architecture document but not yet implemented.

## Glossary

- **Voice_Lab_UI**: The frontend Voice Lab page (`voice-lab/page.tsx`) where users provide writing samples to train their voice profile.
- **Voice_Service**: The backend service (`voice_service.py`) responsible for analyzing writing samples and producing a Tone Manifesto.
- **Voice_Router**: The FastAPI router (`voice.py`) exposing voice profile CRUD endpoints.
- **Voice_Profile**: A database record containing a user's Tone Manifesto, style embedding, and source samples.
- **Tone_Manifesto**: A JSON object describing a user's writing style characteristics (sentence structure, formality, emoji usage, etc.).
- **Style_Embedding**: A 768-dimensional vector representation of a user's writing style, stored in the `style_embedding` column via pgvector.
- **SSE_Endpoint**: The backend Server-Sent Events endpoint (`/bundles/{id}/status`) that streams generation progress.
- **Launch_Page**: The frontend page (`launch/page.tsx`) containing the Split-View Workspace where users generate bundles.
- **Agent_Pipeline**: The multi-agent orchestration system (`graph.py`) that coordinates Context Research, Drafting, and Humanizer agents.
- **LangGraph**: A library for building stateful multi-agent workflows with conditional edges and cycles.
- **Humanizer**: The critique agent that scores voice match, detects AI-isms, and validates platform rules.
- **Embedding_Model**: Google's `text-embedding-004` model used to generate 768-dimensional text embeddings.
- **Cosine_Similarity**: A metric measuring the angular similarity between two vectors, returning a value between -1 and 1.

## Requirements

### Requirement 1: Text-Only Voice Lab UI

**User Story:** As a user, I want to paste samples of my writing directly into the Voice Lab without needing to provide URLs, so that I can quickly train my voice profile with plain text samples.

#### Acceptance Criteria

1. THE Voice_Lab_UI SHALL display a "Paste samples of your writing below" label above the sample input area.
2. THE Voice_Lab_UI SHALL render each sample as a textarea input accepting plain text only (no URL type selector).
3. WHEN the user adds samples, THE Voice_Lab_UI SHALL allow a maximum of 5 samples.
4. WHEN the sample count reaches 5, THE Voice_Lab_UI SHALL hide the "Add Sample" button to prevent exceeding the limit.
5. THE Voice_Lab_UI SHALL remove the URL input option and the type selector dropdown from the sample entry form.
6. WHEN the user submits the form, THE Voice_Lab_UI SHALL send all non-empty samples as type "text" to the voice training endpoint.

### Requirement 2: Voice Profile Update Endpoint

**User Story:** As a user, I want to update my voice profile with new writing samples and trigger re-analysis, so that my voice profile improves over time as I provide more examples.

#### Acceptance Criteria

1. WHEN a PUT request is sent to `/voice-profiles/{id}`, THE Voice_Router SHALL accept a request body containing a new samples array.
2. WHEN new samples are provided, THE Voice_Service SHALL re-run the full voice analysis on the provided samples to produce an updated Tone_Manifesto.
3. WHEN re-analysis completes, THE Voice_Router SHALL update the Voice_Profile record with the new Tone_Manifesto in the database.
4. IF the specified voice profile does not belong to the authenticated user, THEN THE Voice_Router SHALL return a 403 Forbidden response.
5. IF the specified voice profile does not exist, THEN THE Voice_Router SHALL return a 404 Not Found response.

### Requirement 3: Frontend SSE Consumption for Generation Progress

**User Story:** As a user, I want to see real-time progress updates during bundle generation without page refreshes or delays, so that I know exactly which platform is being processed and what stage the pipeline is at.

#### Acceptance Criteria

1. WHEN a bundle generation is initiated, THE Launch_Page SHALL open an EventSource connection to the SSE_Endpoint (`/bundles/{id}/status`).
2. WHILE the EventSource connection is open, THE Launch_Page SHALL parse each incoming SSE event and update the UI to reflect the current platform and generation stage (researching, drafting, humanizing, complete, failed).
3. WHEN an SSE event with status "complete" is received, THE Launch_Page SHALL close the EventSource connection and fetch the final bundle data.
4. WHEN an SSE event with status "failed" is received, THE Launch_Page SHALL close the EventSource connection and display an error message to the user.
5. IF the EventSource connection encounters an error, THEN THE Launch_Page SHALL fall back to the existing polling mechanism as a degraded mode.
6. WHEN the EventSource connection is open, THE Launch_Page SHALL include the authentication token as a query parameter since EventSource does not support custom headers.
7. WHEN the component unmounts or the user navigates away, THE Launch_Page SHALL close the EventSource connection to prevent resource leaks.

### Requirement 4: LangGraph Agent Pipeline Integration

**User Story:** As a developer, I want the agent pipeline to use LangGraph for orchestration, so that the system benefits from stateful workflows, conditional edges, built-in retry logic, and cycle support as specified in the architecture.

#### Acceptance Criteria

1. THE Agent_Pipeline SHALL define a LangGraph StateGraph with nodes for context_research, drafting, and humanizing.
2. THE Agent_Pipeline SHALL define a conditional edge from the humanizing node that routes back to the drafting node when voice_match_score is below 0.85 and revision count is below 3.
3. THE Agent_Pipeline SHALL define a conditional edge from the humanizing node that routes to a completion node when voice_match_score is 0.85 or above, or when revision count reaches 3.
4. WHILE the pipeline is executing, THE Agent_Pipeline SHALL maintain state containing the current draft, revision count, tone_manifesto, platform_constraints, and product information.
5. WHEN a node completes execution, THE Agent_Pipeline SHALL invoke the progress_callback with the current platform, status, and detail message.
6. THE Agent_Pipeline SHALL process each target platform sequentially by invoking the StateGraph once per target.
7. IF a node raises an exception, THEN THE Agent_Pipeline SHALL catch the error, log it, record a failed status for that platform, and continue processing remaining targets.

### Requirement 5: Embedding-Based Voice Match Scoring

**User Story:** As a user, I want the voice matching to use semantic similarity rather than heuristics, so that the system produces more accurate assessments of how well generated content matches my writing style.

#### Acceptance Criteria

1. WHEN a voice profile is created or updated, THE Voice_Service SHALL generate a style_embedding by calling Google's text-embedding-004 model with the combined sample text.
2. THE Voice_Service SHALL store the resulting 768-dimensional vector in the style_embedding column of the voice_profiles table.
3. WHEN the Humanizer scores a draft for voice match, THE Humanizer SHALL generate an embedding of the draft text using the same text-embedding-004 model.
4. WHEN both embeddings are available, THE Humanizer SHALL compute cosine_similarity between the draft embedding and the stored style_embedding.
5. WHEN the style_embedding is not available for a voice profile (legacy profiles), THE Humanizer SHALL fall back to the existing heuristic scoring method.
6. THE Humanizer SHALL normalize the cosine_similarity result to a 0.0–1.0 range for use as the voice_match_score.
7. FOR ALL valid text inputs, generating an embedding then computing cosine_similarity of that embedding with itself SHALL produce a score of 1.0 (round-trip identity property).
