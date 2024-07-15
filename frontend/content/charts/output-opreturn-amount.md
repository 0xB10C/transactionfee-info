---
title: "Cumulative OP_RETURN Output Values"
draft: false
author: "0xb10c"
categories: "Outputs"
position: 5
tags: [OP_RETURN, Value]
thumbnail: output-opreturn-amount.png
chartJS: output-opreturn-amount.js
images:
  - /img/chart-thumbnails/output-opreturn-amount.png
---

Shows the provably lost OP_RETURN output values in sat.
<!--more-->

OP_RETURN outputs can include up to 80 bytes of data which is permanently recorded on the blockchain.
These OP_RETURN outputs can't be spent and are typically zero-value outputs.
However, some transactions have an output value higher than zero.
These bitcoin are permanently unspendable and thus provably lost.
The article [How Many Bitcoins Are Permanently Lost? (2019)](https://coinmetrics.substack.com/p/coin-metrics-state-of-the-network-d2e) dives deeper into the topic of provably lost bitcoin.
