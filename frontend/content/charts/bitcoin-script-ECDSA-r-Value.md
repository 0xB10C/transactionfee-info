---
title: "r-values in ECDSA Signatures"
draft: false
author: "0xb10c"
categories: "Bitcoin Script"
position: 4
tags: ["ECDSA", "r-value", "Signature"]
thumbnail: bitcoin-script-ECDSA-r-Value.png
chartJS: bitcoin-script-ECDSA-r-Value.js
images:
  - /img/chart-thumbnails/bitcoin-script-ECDSA-r-Value.png
---

Shows the distribution of low and high `r`-values in ECDSA signatures per day.
<!--more-->

The [Bitcoin Core v0.17.0 release](https://bitcoin.org/en/release/v0.17.0) in October 2018 included an [improvement](https://github.com/bitcoin/bitcoin/pull/13666) to the wallet code that would only produce _low-r_ signatures.
This has been picked up by other wallets such as the [Electrum Bitcoin Wallet](https://github.com/spesmilo/electrum/pull/5820) in late 2019.