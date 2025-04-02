---
title: "AntPool & Friends"
draft: false
author: "0xb10c"
categories: "Mining Pools"
categories_weight: 0
tags: ["pools", "antpool-and-friends", "proxy-pools"]
thumbnail: mining-pools-antpool-and-friends.png
chartJS: mining-pools-antpool-and-friends.js
images:
  - /img/chart-thumbnails/mining-pools-antpool-and-friends.png
---

Shows the assumed hashrate percentage of "AntPool & friends" along with other top mining pools.

<!--more-->

"AntPool & friends" is a group of mining pools consisting of AntPool and a few smaller pools.
These pools have some kind of business relationship with AntPool / Bitmain and have been observed
to provide [similar templates] to miners in their stratum jobs and to have the [same weird quirks].
These pools simply proxy the AntPool mining jobs and don't run their own nodes to produce block
templates. With "AntPool & friends" controlling over a third of the Bitcoin network hashrate, this
is concerning in terms of hashrate centralization. Since many of the smaller pools kept using their
normal coinbase tags and coinbase output addresses, this behavior is not possible to detect by looking
at the chain. It's not clear when exactly this behavior started happening, but it's assumed that the
first pools started to join AntPool around Q3 2022. During May 2024, "AntPool & friends" controlled
about 40% of the Bitcoin network hashrate.

[similar templates]: https://b10c.me/observations/12-template-similarity/
[same weird quirks]: https://b10c.me/observations/14-antpool-and-friends-invalid-mining-jobs/


<!-- when updating this, make sure to update PROXY_POOL_GROUP_ANTPOOL too! -->
Pools currently assumed to be part of the "AntPool & friends" group are:
- AntPool
- Poolin
- Braiins
- Ultimus Pool
- Binance Pool
- SecPool
- SigmaPool
- Rawpool
- Luxor
- CloverPool (formerly BTC.com)
