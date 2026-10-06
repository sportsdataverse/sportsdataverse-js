const {themes} = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

module.exports = {
  // Rspack/SWC build pipeline (@docusaurus/faster), as in sdv-py. The webpack
  // build of the generated reference tree sits at the 8 GB Vercel container
  // ceiling and OOM-SIGKILLs as soon as a PR adds pages. Only the one v4 flag
  // faster's worker-thread SSG requires: all of `v4: true` would also turn MDX
  // HTML comments in the guides into compile errors.
  future: {
    v4: { removeLegacyPostBuildHeadAttribute: true },
    faster: true,
  },
  title: 'sportsdataverse',
  tagline: "The SportsDataverse's Node.js Package for Sports Data.",
  url: 'https://js.sportsdataverse.org',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  favicon: 'img/favicon.ico',
  organizationName: 'SportsDataverse', // Usually your GitHub org/user name.
  projectName: 'sportsdataverse', // Usually your repo name.
  plugins: [
    // Generate the TypeScript API reference (TypeDoc -> Markdown) into the docs
    // content tree at build time, so it ships with the deployed site. The old
    // root `npm run docs` HTML output was local-only and never reached the web.
    [
      'docusaurus-plugin-typedoc',
      {
        // A SAMPLE of written modules (the four basketball ESPN leagues) plus every
        // hand-written module the utilities catalogue covers (tools/codegen/utilities.yaml:
        // parsers, analytics, odds, models, producers, discovery, the HTTP core). NOTE:
        // `../src/index.ts` and the other `src/generated/**` modules are deliberately
        // NOT entry points — the index imports the written-module barrels, which would
        // pull all ~44 generated modules into TypeDoc's program and OOM the docs build
        // (measured: heap-exhaustion, >8 min). The `tsconfig` below is the same minimal
        // program. The codegen Markdown per-function reference already covers every
        // league + flat family; the written source gives IDE/hover for all of them.
        // src/discover.ts is left out too: its `await import('./index.js')` makes tsc
        // follow the whole index (measured: 13 -> 204 program files, 127 generated);
        // the utilities catalogue (docs/docs/utilities/discovery.md) documents it.
        entryPoints: [
          '../src/generated/espn/nba.ts',
          '../src/generated/espn/wnba.ts',
          '../src/generated/espn/mbb.ts',
          '../src/generated/espn/wbb.ts',
          '../src/parsers/index.ts',
          '../src/analytics/hockeytech.ts',
          '../src/analytics/hockeytech_family.ts',
          '../src/odds/math.ts',
          '../src/models/cricket_wp.ts',
          '../src/producers/espn_basketball_box.ts',
          '../src/producers/espn_basketball_pbp.ts',
          '../src/core/int64.ts',
          '../src/core/id_columns.ts',
          '../src/core/transforms.ts',
          '../src/core/releases.ts',
          '../src/core/errors.ts',
          '../src/core/config.ts',
          '../src/core/request.ts',
          '../src/core/transport.ts',
          '../src/core/auth.ts',
          '../src/core/deprecation.ts',
        ],
        tsconfig: 'typedoc.tsconfig.json',
        out: 'docs/api',
        readme: 'none',
        skipErrorChecking: true,
        // Docusaurus compiles TypeDoc's Markdown as MDX, where a bare `<Type>` or `{...}`
        // in comment prose is JSX / an expression and breaks the build. The generator keeps
        // every type in a code span and test/tsdoc-mdx.test.js scans the hand-written
        // modules; this escapes whatever slips through.
        sanitizeComments: true,
        excludePrivate: true,
        excludeInternal: true,
        // Don't document re-exported external deps (e.g. `export * as tidy from
        // '@tidyjs/tidy'`) — TypeDoc would otherwise emit pages for the whole
        // tidy.js API, one of which (`tidy/functions/rename`) has a JSDoc the MDX
        // compiler can't parse. The runtime re-export is unaffected.
        excludeExternals: true,
        // Keep the committed docs/api/_category_.json (which labels the sidebar
        // section) across rebuilds — TypeDoc would otherwise wipe the out dir.
        cleanOutputDir: false,
        sidebar: { pretty: true },
      },
    ],
    // llms.txt (llmstxt.org): a link index + a full-content bundle of the docs
    // for LLM readers, plus a Markdown copy of every page next to its HTML
    // route (`<route>.md`). Generated from the source MDX at postBuild. The
    // TypeDoc API tree (`docs/api/**`, ~1k generated pages) is left out of
    // all three: the codegen reference pages already cover every wrapper.
    // The dir globs are deliberately permissive so `utilities/` and
    // `architecture/` are picked up the moment they exist.
    [
      'docusaurus-plugin-llms',
      {
        title: 'sportsdataverse (sportsdataverse-js) — Node.js sports data client',
        description:
          'Documentation for the sportsdataverse npm package: typed wrappers over ' +
          'ESPN (every league), MLB Stats API, Baseball Savant / Statcast, NHL ' +
          'api-web + EDGE + Stats REST + Records, NFL.com, NFL Pro, PFF, HockeyTech ' +
          '(PWHL + minor/junior leagues), BartTorvik, KenPom, The Odds API, CBS, Fox, ' +
          'Yahoo, 247Sports / On3, MLS / NWSL / ASA, plus SportsDataverse release ' +
          'loaders. Every wrapper returns the raw payload or tidy rows (`parsed: true`).',
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        generateMarkdownFiles: true,
        ignoreFiles: ['api/**'],
        includeOrder: [
          'intro.md',
          'guides/**',
          'tutorials/**',
          'reference/**',
          'utilities/**',
          'architecture/**',
          '*/index.md',
          '*/reference/**',
        ],
        includeUnmatchedLast: true,
        excludeImports: true,
        removeDuplicateHeadings: true,
      },
    ],
  ],
  themeConfig: {
    // Live-editable ```jsx live``` blocks (react-live). The scope a block sees
    // is docs/src/theme/ReactLiveScope — the parsers bundle, the proxy fetch,
    // the URL resolver and a <Table/>; see docs/docs/guides/live-blocks.md.
    liveCodeBlock: { playgroundPosition: 'bottom' },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    image: 'img/Sportsdataverse_gh.png',
    navbar: {
      hideOnScroll: true,
      title: 'sdv.js',
      logo: {
        alt: 'sportsdataverse-js Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Docs',
        },
        {
          label: 'News',
          to: 'CHANGELOG',
          position: 'left',
        },
        {
          label: 'Tutorials',
          to: '/docs/tutorials/quickstart',
          position: 'left',
        },
        {
          label: 'Playground',
          to: '/playground',
          position: 'left',
        },
        {
          label: 'SDV',
          position: 'left',
          items: [
            {
              href: 'https://sportsdataverse.org',
              label: 'SportsDataverse',
              target: '_self',
            },
            {
              label: 'Python Packages',
              href: 'https://py.sportsdataverse.org/',
              target: '_self',
            },
            {
              label: 'sportsdataverse-py',
              href: 'https://py.sportsdataverse.org/',
              target: '_self',
            },
            {
              label: 'sportypy',
              href: 'https://sportypy.sportsdataverse.org/',
              target: '_self',
            },
            {
              label: 'collegebaseball',
              href: 'https://collegebaseball.readthedocs.io/en/latest/index.html',
              target: '_self',
            },
            {
              label: 'nwslpy',
              href: 'https://github.com/nwslR/nwslpy',
              target: '_self',
            },
            {
              label: 'R Packages',
              href: 'https://r.sportsdataverse.org/',
            },
            {
              label: 'sportsdataverse-R',
              href: 'https://r.sportsdataverse.org/',
              target: '_self',
            },
            {
              label: 'cfbfastR',
              href: 'https://cfbfastR.sportsdataverse.org/',
              target: '_self',
            },
            {
              label: 'hoopR',
              href: 'https://hoopR.sportsdataverse.org/',
              target: '_self',
            },
            {
              label: 'wehoop',
              href: 'https://wehoop.sportsdataverse.org/',
              target: '_self',
            },
            {
              label: 'fastRhockey',
              href: 'https://fastRhockey.sportsdataverse.org/',
              target: '_self',
            },
            {
              label: 'ggshakeR',
              href: 'https://abhiamishra.github.io/ggshakeR/',
              target: '_self',
            },
            {
              label: 'usfootballR',
              href: 'https://usfootballR.sportsdataverse.org/',
              target: '_self',
            },
            {
              label: 'soccerAnimate',
              href: 'https://github.com/Dato-Futbol/soccerAnimate/',
              target: '_self',
            },
            {
              label: 'oddsapiR',
              href: 'https://oddsapiR.sportsdataverse.org/',
              target: '_self',
            },
            {
              label: 'sportyR',
              href: 'https://sportyR.sportsdataverse.org/',
              target: '_self',
            },
            {
              label: 'chessR',
              href: 'https://jaseziv.github.io/chessR/',
              target: '_self',
            },
            {
              label: 'baseballr',
              href: 'https://BillPetti.github.io/baseballr/',
              target: '_self',
            },
            {
              label: 'cfbplotR',
              href: 'https://cfbplotR.sportsdataverse.org/',
              target: '_self',
            },
            {
              label: 'mlbplotR',
              href: 'https://camdenk.github.io/mlbplotR/',
              target: '_self',
            },
            {
              label: 'softballR',
              href: 'https://github.com/sportsdataverse/softballR/',
              target: '_self',
            },
            {
              label: 'cfb4th',
              href: 'https://cfb4th.sportsdataverse.org/',
              target: '_self',
            },
            {
              label: 'nwslR',
              href: 'https://github.com/nwslR/nwslR/',
              target: '_self',
            },
            {
              label: 'recruitR',
              href: 'https://recruitR.sportsdataverse.org/',
              target: '_self',
            },
            {
              label: 'puntr',
              href: 'https://puntalytics.github.io/puntr/',
              target: '_self',
            },
            {
              label: 'Node.js Packages',
              href: 'https://js.sportsdataverse.org/',
            },
            {
              label: 'sportsdataverse.js',
              href: 'https://js.sportsdataverse.org/',
              target: '_self',
            },
            {
              label: 'nfl-nerd',
              href: 'https://github.com/nntrn/nfl-nerd/',
              target: '_self',
            },
          ]
        },
        {
          label: 'Data status',
          href: 'https://sportsdataverse.org/status',
          position: 'right',
        },
        {
          label: 'GitHub',
          href: 'https://github.com/sportsdataverse/sportsdataverse-js/',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Explore',
          items: [
            {
              label: 'Docs',
              to: '/docs/intro',
            },
            {
              label: 'News',
              to: '/CHANGELOG',
            },
            {
              label: 'Tutorials',
              to: '/docs/tutorials/quickstart',
            },
            {
              label: 'Playground',
              to: '/playground',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Twitter (Author)',
              href: 'https://twitter.com/saiemgilani',
            },
            {
              label: 'Twitter (SportsDataverse)',
              href: 'https://twitter.com/sportsdataverse',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/sportsdataverse/sportsdataverse-js',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} <strong>sportsdataverse.js</strong>, developed by <a href='https://twitter.com/saiemgilani'>Saiem Gilani</a>, part of the <a href='https://sportsdataverse.org'>SportsDataverse</a>.`,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
    },
  },
  scripts: [
    {src: 'https://plausible.io/js/pa-_awyfwLYlQRyeuLDfCMUd.js', async: true},
  ],
  // Plausible's init stub: queues calls until the async script above loads.
  headTags: [
    {
      tagName: 'script',
      attributes: {},
      innerHTML:
        'window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()',
    },
  ],
  // Offline/local full-text search (no Algolia account, no external crawler):
  // the index is built into the static output at build time. Same plugin as
  // py.sportsdataverse.org.
  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexBlog: false,
        // Keep the TypeDoc API tree (docs/api/**, ~1k pages of generated
        // signatures) out of the local index: it dwarfed the hand-written +
        // codegen reference and every query surfaced TypeDoc noise first.
        // The pages stay built, linked and in the sitemap.
        ignoreFiles: [/^docs\/api(\/|$)/],
      },
    ],
    // ```jsx live``` code blocks (react-live); scope in src/theme/ReactLiveScope.
    '@docusaurus/theme-live-codeblock',
  ],
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/sportsdataverse/sportsdataverse-js/edit/main/docs/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};