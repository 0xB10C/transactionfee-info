---
title: "Explicit RBF signaling Transactions"
draft: false
author: "0xb10c"
categories: Transactions
position: 5
tags: [Replace-by-Fee]
thumbnail: transactions-signaling-explicit-rbf.png
chartJS: transactions-signaling-explicit-rbf.js
images:
  - /img/chart-thumbnails/transactions-signaling-explicit-rbf.png
---

Shows the percentage of transactions signaling explicit Replace-By-Fee.
<!--more-->

[BIP-125](https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki) defines a policy that enables transactions to signal replaceability.
Transaction can either signal replaceability explicitly or can inherit the signal if an unconfirmed parent transactions signals explicitly.
This chart only shows explicitly signaling transactions as the data is retrieved from the blockchain, where all transactions are confirmed.
