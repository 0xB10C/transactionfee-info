---
title: "Cumulative BIP47 notifications"
draft: false
author: "0xb10c"
categories: Outputs
categories_weight: 0
tags: [bip47, privacy, notification, op_return]
thumbnail: outputs-bip47-notification.png
chartJS: outputs-bip47-notification.js
images:
  - /img/chart-thumbnails/outputs-bip47-notification.png
---

Shows the cumulative number of BIP47 notification outputs.

<!--more-->

[BIP47](https://github.com/bitcoin/bips/blob/master/bip-0047.mediawiki) defines a technique for
creating a payment code which can be publicly advertised and associated with a real-life identity
without creating the loss of security or privacy inherent to P2PKH address reuse. This is also
known as PayNyms.

For these, a notification transaction signals a receiver to watch a key for future payments. The
chart shows the cumulative number of notification transactions made.