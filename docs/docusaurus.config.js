const {themes} = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

module.exports = {
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
        // A SAMPLE of written modules (the four basketball ESPN leagues) for
        // TypeDoc API docs. NOTE: `../src/index.ts` is deliberately NOT an entry
        // point — it imports the written-module barrels, which would pull all
        // ~44 generated modules into TypeDoc's program and OOM the docs build
        // (measured: heap-exhaustion, >8 min). The `tsconfig` below is a minimal
        // program (just these 4 modules + their deps) for the same reason. The
        // codegen Markdown per-function reference already covers every league +
        // flat family; the written source gives IDE/hover for all of them.
        entryPoints: [
          '../src/generated/espn/nba.ts',
          '../src/generated/espn/wnba.ts',
          '../src/generated/espn/mbb.ts',
          '../src/generated/espn/wbb.ts',
        ],
        tsconfig: 'typedoc.tsconfig.json',
        out: 'docs/api',
        readme: 'none',
        skipErrorChecking: true,
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
  ],
  themeConfig: {
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
  scripts: [{src: 'https://plausible.io/js/script.js', defer: true, 'data-domain': 'js.sportsdataverse.org'}],
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