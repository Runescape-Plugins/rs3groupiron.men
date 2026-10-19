import { DELETION_GRACE_DAYS } from './constants';
import { LEGAL_CONTACT, legalPageMeta, type LegalSlug } from './legalIndex';

export type LegalBlock =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'defs'; items: Array<{ term: string; text: string }> }
  | { kind: 'table'; head: string[]; rows: string[][] };

export type LegalSection = {
  id: string;
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDoc = {
  slug: LegalSlug;
  lead: string;
  sections: LegalSection[];
};

const PRIVACY: LegalDoc = {
  slug: 'privacy',
  lead: 'This notice explains what the RS3 Group Ironman site and plugin collect, why, where it goes and how to get rid of it. It is written to meet UK GDPR Articles 13 and 14.',
  sections: [
    {
      id: 'who-we-are',
      heading: '1. Who we are and how to contact us',
      blocks: [
        {
          kind: 'p',
          text: `RS3 Group Ironman (${LEGAL_CONTACT.site}) and the RS3 Group Ironman plugin are operated by ${LEGAL_CONTACT.operator}, who is the data controller for the personal data described in this notice. The service is run by one individual rather than a company.`,
        },
        {
          kind: 'p',
          text: `For anything about your data — access, correction, deletion, a complaint, or a suspected breach — email ${LEGAL_CONTACT.email}. That address is monitored by the operator personally. Our Discord is for general support and is not a route for data protection requests, because we cannot verify you there.`,
        },
        {
          kind: 'p',
          text: 'We have not appointed a Data Protection Officer; the service is run by one person and is not required to have one.',
        },
      ],
    },
    {
      id: 'what-we-process',
      heading: '2. The personal data we process',
      blocks: [
        {
          kind: 'p',
          text: 'Everything below is tied to a RuneScape character name rather than to a real-world identity, unless you choose to add a Discord user id. We hold no real names, email addresses, postal addresses or payment details, and we have no user accounts.',
        },
        {
          kind: 'defs',
          items: [
            {
              term: 'Group identity',
              text: 'The group name you choose, and the group token we generate for it. The token is the only credential the service has.',
            },
            {
              term: 'Member identity',
              text: 'Each member’s RuneScape username. Optionally a nickname, a Discord user id (used only to show that account’s avatar) and a display colour.',
            },
            {
              term: 'In-game activity, sent by the plugin',
              text: 'Map position and world, hitpoints, prayer and summoning points, carried weight, whether you are online or sitting in the lobby, what you are currently fighting, skill levels and experience, a time series of experience samples used to draw the graphs, the contents of your inventory, equipment, bank and the group’s shared bank, quest and achievement progress, and per-NPC kill counts.',
            },
            {
              term: 'Technical data',
              text: 'Your IP address, user agent, the request line, response status and response time, written to our web server access log on every request. The same IP address is used in memory to apply rate limits.',
            },
            {
              term: 'Data kept on your own device',
              text: 'The plugin stores your group name and token on your machine so you do not have to re-enter them each time, and the website keeps the same two values in your browser so you stay logged in. Your display preferences are stored in the browser too and never leave it. See the cookie and local storage notice for the full list.',
            },
          ],
        },
        {
          kind: 'p',
          text: 'We never receive your Jagex account password, your email address or your bank PIN, and the plugin cannot read them. We do not process any special category data, and we do no profiling or automated decision-making.',
        },
      ],
    },
    {
      id: 'where-from',
      heading: '3. Where the data comes from',
      blocks: [
        {
          kind: 'list',
          items: [
            'From you, when you create a group, add or edit members, or change group settings on the website.',
            'From the plugin running in your RuneScape client, which sends your in-game state to our API while you play.',
            'Automatically from your browser or the plugin, in the form of the technical data listed above, whenever either makes a request.',
          ],
        },
        {
          kind: 'p',
          text: 'If you add another player’s RuneScape username to a group, you are giving us their data. You must have their agreement first — that obligation is in our terms of use, and it is also your responsibility under data protection law.',
        },
      ],
    },
    {
      id: 'purposes',
      heading: '4. What we use it for, and our lawful basis',
      blocks: [
        {
          kind: 'table',
          head: ['Purpose', 'Data used', 'Lawful basis'],
          rows: [
            [
              'Running the tracker: showing your group’s map, skills, items, bank ledger, quests, achievements and graphs to the people who hold your group token',
              'Group identity, member identity, in-game activity',
              'Legitimate interests',
            ],
            [
              'Publishing your group in Discover and on its public page, showing only the categories you switch on',
              'Whatever the group chooses to share',
              'Consent — private by default, and the live map stays off until you turn it on',
            ],
            [
              'Showing a member’s Discord avatar',
              'Discord user id',
              'Consent — optional per member, and removable at any time',
            ],
            [
              'Keeping the service up and free of abuse: rate limiting, diagnosing errors, investigating misuse',
              'Technical data',
              'Legitimate interests',
            ],
            [
              'Counting page views so we know which parts of the site are used',
              'Aggregate, cookieless page-view data',
              'Legitimate interests',
            ],
            [
              'Backups, so a failed disk does not lose your group',
              'Everything stored in the database',
              'Legitimate interests',
            ],
            [
              'Answering a data protection request and keeping a record that we did',
              'Whatever you send us when you contact us',
              'Legal obligation',
            ],
          ],
        },
        {
          kind: 'p',
          text: 'Where the basis is consent you can withdraw it at any time, and it costs you nothing: switch the group back to private, turn off a shared category, remove a Discord id, or delete the group outright. Withdrawing consent does not affect processing that already happened.',
        },
      ],
    },
    {
      id: 'legitimate-interests',
      heading: '5. Our legitimate interests, and the balance we struck',
      blocks: [
        {
          kind: 'p',
          text: 'Our interest is in operating a free group tracker that RuneScape players deliberately opt into, and in keeping it available and unabused.',
        },
        {
          kind: 'p',
          text: 'We think this does not override your interests, for these reasons:',
        },
        {
          kind: 'list',
          items: [
            'Nothing is collected unless someone installs the plugin and enters a group token. There is no passive or background collection.',
            'The data is in-game state attached to a character name. On its own it does not identify a real person.',
            'A group is private by default. Nothing is visible to anyone without the group token until the group chooses to publish it.',
            'The live map is the most sensitive panel, so it is the one that stays off unless you turn it on, and any individual member can opt out of sharing their location while leaving everything else on.',
            'We do not sell data, share it with advertisers, build advertising profiles, or use it to make decisions about you.',
            'You can erase everything yourself, from Settings, without asking us.',
          ],
        },
        {
          kind: 'p',
          text: 'You can object to processing based on legitimate interests at any time — see section 9.',
        },
      ],
    },
    {
      id: 'recipients',
      heading: '6. Who else sees the data',
      blocks: [
        {
          kind: 'p',
          text: 'We use the following service providers. They process data on our instructions, under their standard data processing terms.',
        },
        {
          kind: 'defs',
          items: [
            {
              term: 'Vercel Inc. — https://rs3groupiron.men',
              text: 'Hosts the website and serves its static files, and proxies calls to our API. Also provides the cookieless page-view counts.',
            },
            {
              term: 'Cloudflare, Inc. — https://api.rs3groupiron.men',
              text: 'Our API and PostgreSQL database run on a server we control, reached only through a Cloudflare Tunnel. The database accepts no connections from the public internet. Cloudflare carries the traffic and terminates TLS.',
            },
            {
              term: 'Cloudflare R2, private bucket',
              text: 'Holds the nightly database backups. The bucket is not public and is reachable only with our own credentials.',
            },
          ],
        },
        {
          kind: 'p',
          text: 'Separately, loading a page makes your browser fetch content from these third parties. They receive your IP address and user agent in the ordinary course of serving a request; they do not receive your group data.',
        },
        {
          kind: 'list',
          items: [
            'runeapps.org and chisel.weirdgloop.org — world map tiles.',
            'raw.githubusercontent.com — item icons and game data files.',
            'cdn.discordapp.com — a member’s Discord avatar, only if that member has set a Discord id.',
            'www.youtube-nocookie.com — the embedded setup video, on the Get started page only.',
          ],
        },
        {
          kind: 'p',
          text: 'We do not sell your personal data, we share none of it with advertisers or data brokers, and we do not send it to Jagex. We will disclose data if we are legally required to, and we will tell you unless we are prohibited from doing so.',
        },
      ],
    },
    {
      id: 'transfers',
      heading: '7. Transfers outside the UK',
      blocks: [
        {
          kind: 'p',
          text: 'Our API server, our database and our backups are hosted in the United States. Vercel Inc. and Cloudflare, Inc. are United States companies. Your personal data is therefore stored and processed in the United States, which the UK has not designated as having full adequacy.',
        },
        {
          kind: 'p',
          text: 'The safeguards we rely on for that transfer are:',
        },
        {
          kind: 'list',
          items: [
            'Each provider’s published data processing agreement, which incorporates the UK International Data Transfer Addendum to the EU standard contractual clauses, and/or that provider’s certification under the UK Extension to the EU–US Data Privacy Framework.',
            'Encryption in transit on every leg: between your client and us, between our components, and when backups are copied off the machine.',
            'No public inbound access to the database or to the API server; the only route in is the Cloudflare Tunnel.',
            'Data minimisation — we hold no real names, email addresses or payment data that a transfer could expose.',
          ],
        },
        {
          kind: 'p',
          text: `If you want to know which mechanism applies to a specific provider, or want a copy of the relevant terms, email ${LEGAL_CONTACT.email}.`,
        },
      ],
    },
    {
      id: 'retention',
      heading: '8. How long we keep it',
      blocks: [
        {
          kind: 'table',
          head: ['Data', 'Kept for'],
          rows: [
            [
              'Group, members, skills, experience history, inventories, bank ledger, quests, achievements, kill counts',
              'As long as the group exists. Deleted when the group is deleted.',
            ],
            [
              'A pending deletion request',
              `The group is purged ${DELETION_GRACE_DAYS} days after the request is made. It keeps working during those ${DELETION_GRACE_DAYS} days and the request can be cancelled from Settings at any point before the date.`,
            ],
            [
              'Database backups',
              'Nightly dumps are kept 14 days on the server and 30 days off-site. A purged group therefore disappears from every backup within 30 days of the purge.',
            ],
            [
              'Web server access logs (IP, user agent, request line, timing)',
              '14 days, then deleted as the log rotates. Application logs go to the system journal, which is size-capped and holds roughly the same period.',
            ],
            [
              'Aggregate page-view counts',
              'Retained by Vercel Web Analytics in aggregate form. They contain no identifier for you.',
            ],
            [
              'Data protection correspondence',
              'Up to 12 months after the request is closed, so we can show we handled it.',
            ],
          ],
        },
        {
          kind: 'p',
          text: 'There is no inactivity sweep: we do not delete a group just because nobody has played for a while. Deletion happens when you ask for it.',
        },
      ],
    },
    {
      id: 'rights',
      heading: '9. Your rights',
      blocks: [
        {
          kind: 'p',
          text: 'Under UK GDPR you have the right to:',
        },
        {
          kind: 'list',
          items: [
            'Be told what we hold about you and get a copy of it (access).',
            'Have inaccurate data corrected, and incomplete data completed (rectification).',
            'Have your data deleted (erasure).',
            'Have our use of it paused while a dispute is resolved (restriction).',
            'Receive your data in a portable, machine-readable form (portability). Settings → Your data → Download gives you the lot as JSON, or as a ZIP that also contains the full experience history behind the graphs.',
            'Object to processing we base on legitimate interests (objection).',
            'Withdraw consent for anything we do on that basis, at any time.',
            'Not be subject to automated decision-making or profiling. We do none, so there is nothing to opt out of.',
          ],
        },
        {
          kind: 'p',
          text: 'Access, portability and erasure are all self-service, so you do not need to contact us or wait for us. Open Settings in your group and use “Your data”: Download gives you everything we hold, and “Delete group data” erases it on the date shown.',
        },
        {
          kind: 'p',
          text: 'The download contains no group token. It is the credential for the group, and an export is the sort of file people forward or upload, so it is deliberately left out — you already have it under Settings → Open setup.',
        },
        {
          kind: 'p',
          text: `For anything else, email ${LEGAL_CONTACT.email}. We will respond within one month, and will tell you if we need longer because the request is complex.`,
        },
        {
          kind: 'p',
          text: 'One honest limitation: the group token is the only credential we hold, so it is the only way we can verify that a request about a group really comes from that group. If you no longer have the token we may be unable to act on a request about that group’s data, because we cannot distinguish you from someone else asking about it. If you are a member of a group whose token you do not hold, email us and explain the situation — we will work out a reasonable way to verify you.',
        },
      ],
    },
    {
      id: 'complaints',
      heading: '10. Complaints',
      blocks: [
        {
          kind: 'p',
          text: `If you are unhappy with how we have handled your data, please tell us first at ${LEGAL_CONTACT.email} — we would rather fix it.`,
        },
        {
          kind: 'p',
          text: 'You also have the right to complain to the Information Commissioner’s Office, the UK supervisory authority for data protection. ICO, Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF. Helpline 0303 123 1113. ico.org.uk/make-a-complaint. Complaining to us first does not take that right away.',
        },
      ],
    },
    {
      id: 'security',
      heading: '11. How we protect it',
      blocks: [
        {
          kind: 'list',
          items: [
            'All traffic is HTTPS. The API is reachable only through a Cloudflare Tunnel; the server exposes no inbound ports to the internet and the database listens on localhost only.',
            'A group token is the sole credential, compared in constant time so a wrong token leaks nothing about how wrong it was. An unknown group and a bad token return the identical error, so the API cannot be used to enumerate group names.',
            'A token is never sent back to a caller that did not already prove it holds one.',
            'Unauthenticated endpoints are rate limited. Request bodies are capped at 256 KB and every field is validated against a strict schema, with unknown fields stripped.',
            'The site sends a strict Content-Security-Policy, HSTS and related hardening headers; the API restricts cross-origin access to our own domains.',
            'Backups go to a private bucket, and the backup script refuses to run if it is ever pointed at a publicly readable one.',
            'Public sharing is off by default, the live map is off by default even for public groups, and each member can opt out of location sharing individually.',
          ],
        },
        {
          kind: 'p',
          text: 'No service can promise perfect security. If we suffer a breach that risks your rights and freedoms we will report it to the ICO within 72 hours, and tell affected groups where the risk is high.',
        },
      ],
    },
    {
      id: 'children',
      heading: '12. Children',
      blocks: [
        {
          kind: 'p',
          text: `The service is not directed at children under 13, and we have no way to verify anyone’s age. If you believe we hold data about a child under 13, email ${LEGAL_CONTACT.email} and we will delete it.`,
        },
      ],
    },
    {
      id: 'changes',
      heading: '13. Changes to this notice',
      blocks: [
        {
          kind: 'p',
          text: 'If we change this notice we will update the date at the top. For a change that materially affects what we do with your data, we will also announce it in our Discord before it takes effect, so you have a chance to delete your group first.',
        },
      ],
    },
  ],
};

const TERMS: LegalDoc = {
  slug: 'terms',
  lead: 'These terms cover the RS3 Group Ironman website and the plugin that feeds it. Using either means you accept them.',
  sections: [
    {
      id: 'service',
      heading: '1. What this is',
      blocks: [
        {
          kind: 'p',
          text: 'RS3 Group Ironman is a free, unofficial tracker for RuneScape 3 group ironman teams. It is run as a hobby project on a best-effort basis. There is no fee, no subscription and no contract beyond these terms.',
        },
      ],
    },
    {
      id: 'jagex',
      heading: '2. Not affiliated with Jagex',
      blocks: [
        {
          kind: 'p',
          text: 'RuneScape is a trademark of Jagex Limited. This project is an unofficial fan project. It is not made, endorsed, sponsored or approved by Jagex, and Jagex is not responsible for it.',
        },
        {
          kind: 'p',
          text: 'You remain responsible for complying with Jagex’s own Terms and Conditions and the Rules of RuneScape, including their rules about third-party clients and plugins. If Jagex’s rules and these terms ever conflict, follow Jagex’s.',
        },
      ],
    },
    {
      id: 'tokens',
      heading: '3. Groups and tokens',
      blocks: [
        {
          kind: 'p',
          text: 'There are no accounts. When you create a group we generate a token, and that token is the group’s only credential. Anyone holding it has full access to the group: they can read everything, change settings, add or remove members and delete all of the data.',
        },
        {
          kind: 'p',
          text: 'A token cannot be rotated or recovered. Treat it like a password: share it only with your own group, and do not paste it into screenshots, videos or public channels. If it leaks, the only remedy is to delete the group and create a new one.',
        },
        {
          kind: 'p',
          text: 'If you lose the token, we may be unable to help you with anything concerning that group, including deleting it, because we have no other way to tell that you are entitled to.',
        },
      ],
    },
    {
      id: 'your-responsibilities',
      heading: '4. Your responsibilities',
      blocks: [
        {
          kind: 'list',
          items: [
            'Only add a player to a group with that player’s agreement. Adding someone’s RuneScape username without asking them is a breach of these terms.',
            'Tell the people in your group what the tracker collects, and point them at our privacy notice. Each member can turn off location sharing for themselves.',
            'Do not make a group public if any member objects to it.',
            'Keep your group token confidential.',
          ],
        },
      ],
    },
    {
      id: 'acceptable-use',
      heading: '5. Acceptable use',
      blocks: [
        { kind: 'p', text: 'You must not:' },
        {
          kind: 'list',
          items: [
            'Try to read, guess at or interfere with any group whose token you do not hold.',
            'Probe, scan or attack the service, or try to get round rate limits, validation or access controls.',
            'Automate requests at a volume that degrades the service for other people.',
            'Use group names, nicknames or any other text you give us to post something unlawful, infringing or abusive, or use the service to harass anyone.',
            'Resell the service or present it as your own.',
          ],
        },
        {
          kind: 'p',
          text: 'Security research is welcome if you tell us first and do not touch other people’s data: email the address in our privacy notice.',
        },
      ],
    },
    {
      id: 'public-groups',
      heading: '6. Public groups',
      blocks: [
        {
          kind: 'p',
          text: 'Making a group public publishes the categories you select, under your group name, at a public URL and in the Discover list. Group pages are marked no-index for search engines, but you should assume that anything you publish can be seen, copied and kept by anyone who visits.',
        },
        {
          kind: 'p',
          text: 'Switching back to private stops us serving it immediately. It cannot unmake copies other people already took.',
        },
      ],
    },
    {
      id: 'availability',
      heading: '7. Availability',
      blocks: [
        {
          kind: 'p',
          text: 'There is no uptime guarantee. We may change, suspend or withdraw features, and we may shut the service down. If we shut it down deliberately we will give notice in our Discord, with enough time to export your data, unless circumstances make that impossible.',
        },
        {
          kind: 'p',
          text: 'The tracker depends on Jagex’s game, on your client and on third-party map and item data. Gaps, delays and wrong numbers happen. Do not rely on it as a record of anything that matters.',
        },
      ],
    },
    {
      id: 'deletion',
      heading: '8. Deleting your group, and suspension',
      blocks: [
        {
          kind: 'p',
          text: `You can delete everything at any time from Settings. The request takes two confirmations and asks you to retype your group name and token, after which the group is purged ${DELETION_GRACE_DAYS} days later. It keeps working in the meantime and you can cancel before the date. Backups age out as described in the privacy notice.`,
        },
        {
          kind: 'p',
          text: 'We may suspend or remove a group that breaks these terms. Where it is practical and lawful to do so, we will say why.',
        },
      ],
    },
    {
      id: 'liability',
      heading: '9. No warranty, and limits on liability',
      blocks: [
        {
          kind: 'p',
          text: 'The service is provided as is, with no warranties of any kind, express or implied, including fitness for a particular purpose and accuracy of data.',
        },
        {
          kind: 'p',
          text: 'To the fullest extent the law allows, we are not liable for lost data, lost progress, lost in-game items, loss of access to your RuneScape account, or any indirect or consequential loss arising from using the service.',
        },
        {
          kind: 'p',
          text: 'Nothing in these terms limits liability for death or personal injury caused by negligence, for fraud or fraudulent misrepresentation, or for anything else that cannot lawfully be limited. Nothing here affects your statutory rights as a consumer.',
        },
      ],
    },
    {
      id: 'changes',
      heading: '10. Changes to these terms',
      blocks: [
        {
          kind: 'p',
          text: 'We may update these terms. The date at the top shows when they last changed, and material changes are announced in our Discord. Continuing to use the service after a change means you accept it; if you do not, delete your group.',
        },
      ],
    },
    {
      id: 'law',
      heading: '11. Governing law',
      blocks: [
        {
          kind: 'p',
          text: 'These terms are governed by the law of England and Wales, and the courts of England and Wales have exclusive jurisdiction. If you are a consumer resident elsewhere, this does not deprive you of the protection of your local mandatory consumer law.',
        },
      ],
    },
    {
      id: 'contact',
      heading: '12. Contact',
      blocks: [
        {
          kind: 'p',
          text: `${LEGAL_CONTACT.operator} — ${LEGAL_CONTACT.email}.`,
        },
      ],
    },
  ],
};

const COOKIES: LegalDoc = {
  slug: 'cookies',
  lead: 'There is no cookie banner on this site because there are no cookies to ask you about. This page explains what we do store in your browser instead.',
  sections: [
    {
      id: 'no-cookies',
      heading: '1. We set no cookies',
      blocks: [
        {
          kind: 'p',
          text: 'The site sets no cookies of its own — not for analytics, not for advertising, not even to keep you logged in. Nothing on this site tracks you across other websites.',
        },
        {
          kind: 'p',
          text: 'Under the Privacy and Electronic Communications Regulations we would need your consent before storing anything non-essential on your device. We avoid the question by storing only what the site cannot work without, and by keeping it in your browser rather than sending it anywhere.',
        },
      ],
    },
    {
      id: 'local-storage',
      heading: '2. What we keep in your browser',
      blocks: [
        {
          kind: 'table',
          head: ['Key', 'Where', 'What it is for', 'Removed when'],
          rows: [
            [
              'rs3.groupSession',
              'localStorage',
              'Your group name and group token, so you are not asked to log in on every visit. This is the only stored item we send anywhere: it goes to our API as the Authorization header, which is how the API knows you may read the group.',
              'You use Log out, or clear site data',
            ],
            [
              'rsgim.ui',
              'localStorage',
              'Your display preferences: theme, navigation layout, auto-hide, map backdrop and panel opacity.',
              'You clear site data',
            ],
            [
              'rs3-ui-graph-prefs-v1',
              'localStorage',
              'Your choices on the Graphs tab — chart type and options.',
              'You clear site data',
            ],
            [
              'rs3-map-mode-v1',
              'localStorage',
              'The map style you last picked.',
              'You clear site data',
            ],
            [
              'chunk-reload-at',
              'sessionStorage',
              'A timestamp used once to reload the page if a script fails to load after a deploy, and to make sure it only reloads once.',
              'You close the tab',
            ],
            [
              'rsgim.theme, rsgim.panelOpacity',
              'localStorage',
              'Older preference keys from a previous version. They are migrated into rsgim.ui and deleted automatically.',
              'Automatically, on your next visit',
            ],
          ],
        },
        {
          kind: 'p',
          text: 'Apart from the group token, none of this leaves your browser. None of it is readable by any other site.',
        },
      ],
    },
    {
      id: 'analytics',
      heading: '3. Analytics',
      blocks: [
        {
          kind: 'p',
          text: 'We use Vercel Web Analytics to count page views. It is cookieless, stores nothing on your device, does not follow you between sites and does not build a profile of you. It tells us things like how many people opened the Discover page; it cannot tell us who you are.',
        },
      ],
    },
    {
      id: 'third-party',
      heading: '4. Third-party content',
      blocks: [
        {
          kind: 'p',
          text: 'Some content is loaded from other people’s servers. We set no cookies through it, but those servers do see your IP address and user agent because that is how an HTTP request works.',
        },
        {
          kind: 'list',
          items: [
            'World map tiles from runeapps.org and chisel.weirdgloop.org.',
            'Item icons and game data from raw.githubusercontent.com.',
            'A member’s Discord avatar from cdn.discordapp.com, only when that member has set a Discord id.',
            'The setup video on the Get started page, embedded from www.youtube-nocookie.com. YouTube’s no-cookie host does not set tracking cookies unless you press play; if you do, YouTube’s own policies apply.',
          ],
        },
      ],
    },
    {
      id: 'clearing',
      heading: '5. Clearing what we stored',
      blocks: [
        {
          kind: 'list',
          items: [
            'Log out from the group menu — that removes your saved group name and token immediately.',
            'Or clear site data for rs3groupiron.men in your browser settings, which removes every key listed above.',
          ],
        },
        {
          kind: 'p',
          text: 'Clearing the session does not delete your group. To erase the group’s data from our servers, use “Delete group data” in Settings — see the privacy notice.',
        },
      ],
    },
    {
      id: 'dnt',
      heading: '6. Do Not Track and Global Privacy Control',
      blocks: [
        {
          kind: 'p',
          text: 'We do no cross-site tracking and run no advertising, so there is nothing for these signals to switch off. We honour them by not doing it in the first place.',
        },
      ],
    },
  ],
};

const DOCS: Record<LegalSlug, LegalDoc> = {
  privacy: PRIVACY,
  terms: TERMS,
  cookies: COOKIES,
};

export function legalDoc(slug: LegalSlug) {
  return { ...legalPageMeta(slug), ...DOCS[slug] };
}
