---
title: "Mining Centralization Index (with proxy pools)"
draft: false
author: "0xb10c"
categories: "Mining Pools"
categories_weight: 2
tags: ["pools", "centralization", "antpool-and-friends", "antpool"]
thumbnail: mining-pools-centralization-index-with-proxy-pools.png
chartJS: mining-pools-centralization-index-with-proxy-pools.js
images:
  - /img/chart-thumbnails/mining-pools-centralization-index-with-proxy-pools.png
---

Shows the Mining Centralization Index (with proxy pools).

<!--more-->

The Mining Centralization Index shows how centralized Bitcoin mining has been over time.
It's calculated by summing up the daily hashrate share of the top `n` pools. Here, the top
two, three, four, five and six pools are shown. A lower index means that Bitcoin mining is
more decentralized, while a higher index means it's more centralized.

For example, the "top 2 pools" being over 55% means that the top two pools on that day had
more than 55% of the network hashrate. And the "top 6 pools" being 90% means that six pools
control 90% of the network hashrate.

Note that this version considers the "AntPool & friends" proxy pool group as a single pool.
It's not clear when exactly "AntPool & friends" started, but it's assumed that the first
pools started to join AntPool around Q3 2022. During May 2024, "AntPool & friends"
controlled about 40% of the Bitcoin network hashrate.

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
