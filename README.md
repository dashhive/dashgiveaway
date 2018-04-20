DashDrop
========

The tool helps track the status of paper wallet give-aways, "airdrops".

The main goal is a user-friendly web site/application that guides users through the process of administering a paper wallet give-away.

This includes instructions, tools, and best practices for creating, funding, and giving out paper wallets.

The site/app also includes tools to track balances over time as well as reclaim funds from those who did not (due to loss, disinterest, etc) sweep funds from the paper wallets into their own wallet.

See https://github.com/dashcommunity/proposal-dash-hive/blob/master/paper-wallet-tool.md

Installation & Usage
-------

This is a static web app. It may be loaded directly by your webserver or from localhost as a downloaded web app.

Assuming that your webserver is configured to load `dashgiveaway.com` from `/srv/www`:

```bash
pushd /srv/www/
  git clone https://github.com/dashhive/dashdrop.html.git dashgiveaway.com

  pushd dashgiveaway.com/
    bash ./install.sh
  popd
popd
```

Then your would visit https://dashgiveaway.com.

Since this uses secure crypto APIs, https is required.
