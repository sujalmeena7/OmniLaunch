-- ============================================================
-- OmniLaunch — Platform Rules Seed Data
-- ============================================================

INSERT INTO public.platform_rules (platform, sub_target, display_name, prefix, forbidden_words, required_elements, max_title_length, max_body_length, formatting_rules, schedule_notes)
VALUES
-- Hacker News
(
    'hackernews', NULL, 'Hacker News (Show HN)',
    'Show HN:',
    ARRAY['revolutionary', 'game-changer', 'best', 'amazing', 'incredible', 'disruptive', 'cutting-edge'],
    ARRAY['link_in_url_field'],
    80, NULL,
    '{"markdown": false, "links_in_text": false, "images": false, "tone": "Show what you built, be technical, explain the interesting engineering, ask for feedback. HN values substance over hype."}'::jsonb,
    'No scheduling restrictions. Avoid weekends for best engagement.'
),

-- Product Hunt
(
    'producthunt', NULL, 'Product Hunt',
    NULL,
    ARRAY[]::TEXT[],
    ARRAY['tagline', 'description', 'media_gallery'],
    60, 260,
    '{"tagline_max": 60, "description_max": 260, "requires_media": true, "emoji_allowed": true, "markdown": false, "tone": "Exciting but concise. Lead with the value prop. Emoji-friendly. Focus on what problem it solves."}'::jsonb,
    'Launch at 12:01 AM PST for maximum visibility. Tuesday-Thursday optimal.'
),

-- Reddit r/SaaS
(
    'reddit', 'r/SaaS', 'Reddit r/SaaS',
    NULL,
    ARRAY['best tool ever', 'you need this', 'must-have', 'no-brainer'],
    ARRAY['flair:Showcase'],
    300, 40000,
    '{"markdown": true, "images": false, "tone": "Be authentic, share your journey, include metrics if possible, ask for feedback. Self-promotion is allowed with Showcase flair but must add value."}'::jsonb,
    'Showcase flair available on Tuesdays and Saturdays only.'
),

-- Reddit r/webdev
(
    'reddit', 'r/webdev', 'Reddit r/webdev',
    NULL,
    ARRAY['hire me', 'best framework', 'revolutionary'],
    ARRAY['flair:Showoff Saturday', 'include_tech_stack'],
    300, 40000,
    '{"markdown": true, "images": true, "tone": "Technical audience. Lead with the tech stack and interesting engineering challenges. Show code snippets if relevant. Be humble about the product angle."}'::jsonb,
    'Showoff Saturday posts only on Saturdays. Other days use Discussion or Resource flair.'
),

-- Reddit r/startups
(
    'reddit', 'r/startups', 'Reddit r/startups',
    NULL,
    ARRAY['guaranteed success', 'passive income'],
    ARRAY['flair:Share Your Startup'],
    300, 40000,
    '{"markdown": true, "images": false, "tone": "Founder-to-founder. Share the story, the problem, and what you learned. Metrics and transparency are valued."}'::jsonb,
    'Share Your Startup threads are posted weekly. Check pinned posts.'
),

-- IndieHackers
(
    'indiehackers', NULL, 'IndieHackers',
    NULL,
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    100, NULL,
    '{"markdown": true, "images": true, "tone": "Founder-to-founder, transparent about revenue and metrics. Share the journey, not just the product. Be honest about challenges."}'::jsonb,
    'No scheduling restrictions. Milestone posts perform well.'
),

-- Twitter/X
(
    'twitter', NULL, 'Twitter / X',
    NULL,
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    NULL, 280,
    '{"markdown": false, "images": true, "hashtags_max": 3, "thread_allowed": true, "tone": "Punchy, conversational. Hook in the first line. Use line breaks for readability. Threads for longer content."}'::jsonb,
    'Best engagement 8-10 AM EST on weekdays.'
);
