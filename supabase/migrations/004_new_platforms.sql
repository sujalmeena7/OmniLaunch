-- ============================================================
-- OmniLaunch — Add r/sideprojects, LinkedIn, Dev.to platforms
-- ============================================================

INSERT INTO public.platform_rules (platform, sub_target, display_name, prefix, forbidden_words, required_elements, max_title_length, max_body_length, formatting_rules, schedule_notes)
VALUES
-- r/sideprojects
(
    'reddit', 'r/sideprojects', 'Reddit r/sideprojects',
    NULL,
    ARRAY['revolutionary', 'game-changer', 'disruptive', 'best-in-class', 'world-class', 'innovative'],
    ARRAY[]::TEXT[],
    300, NULL,
    '{"tone": "Casual builder sharing progress. First person, genuine, no hype. Talk about the problem you solved personally, not the product features.", "title_max_chars": 300, "body_structure": "Personal frustration first → what you built → honest current state (users, revenue) → genuine question to community", "self_promotion_ok": true, "link_placement": "comments not body", "flair": null, "day_restriction": null}'::jsonb,
    'No scheduling restrictions. Avoid overly promotional language.'
),

-- LinkedIn
(
    'linkedin', NULL, 'LinkedIn',
    NULL,
    ARRAY['hustle', 'grind', 'crushing it', 'killing it', 'game-changer', 'thought leader', 'synergy', 'leverage', 'move fast', '10x'],
    ARRAY['hook_line', 'line_breaks', 'cta'],
    NULL, 3000,
    '{"tone": "Professional but human. First person. Storytelling over feature listing. Vulnerable and honest about the journey. NOT corporate speak.", "body_max_chars": 3000, "body_structure": "Hook line (1 sentence, no context) → 2 blank lines → Story in short paragraphs (1-2 sentences each) → What you built and why → Lesson or insight → CTA with link", "line_break_rule": "Every 1-2 sentences gets its own line. No long paragraphs. White space is critical on LinkedIn.", "hashtag_count": "3-5 at the very end only", "hashtags": ["#buildinpublic", "#indiehacker", "#saas", "#startup", "#founder"]}'::jsonb,
    'Best engagement Tuesday-Thursday 8-10 AM local time. Avoid links in body — LinkedIn suppresses reach.'
),

-- Dev.to
(
    'devto', NULL, 'Dev.to',
    NULL,
    ARRAY['game-changer', 'revolutionary', 'disruptive', 'world-class', 'seamlessly', 'unlock'],
    ARRAY['technical_detail', 'code_or_stack', 'tags'],
    100, NULL,
    '{"tone": "Technical and honest. Developer to developer. Show the interesting engineering decisions, not the marketing pitch. Readers are developers who will immediately see through hype.", "title_max_chars": 100, "body_structure": "Problem statement → Technical approach with specifics → Code snippet or architecture decision → What you learned or would do differently → Stack summary → Link at end", "tags": ["webdev", "buildinpublic", "python", "javascript", "ai", "showdev"], "tag_count": "4 tags max", "markdown": true, "code_blocks": "required — include at least one real code snippet", "headers": "use ## headers to break up sections"}'::jsonb,
    'No scheduling restrictions. Technical posts with code snippets get highest engagement.'
);
