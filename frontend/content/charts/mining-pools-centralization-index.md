---
title: "Mining Centralization Index"
draft: false
author: "0xb10c"
categories: "Mining Pools"
categories_weight: 1
tags: ["pools", "centralization"]
thumbnail: mining-pools-centralization-index.png
chartJS: mining-pools-centralization-index.js
images:
  - /img/chart-thumbnails/mining-pools-centralization-index.png
---

Shows the Mining Centralization Index.

<!--more-->

The Mining Centralization Index shows how centralized Bitcoin mining has been over time.
It's calculated by summing up the daily hashrate share of the top `n` pools. Here, the top
two, three, four, five and six pools are shown. A lower index means that Bitcoin mining is
more decentralized, while a higher index means it's more centralized.

For example, the "top 2 pools" being over 55% means that the top two pools on that day had
more than 55% of the network hashrate. And the "top 6 pools" being 90% means that six pools
control 90% of the network hashrate.

Note that this does not condsider any proxy pools or similar.
