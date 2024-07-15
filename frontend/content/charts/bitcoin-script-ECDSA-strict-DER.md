---
title: "DER encoded ECDSA Signatures"
draft: false
author: "0xb10c"
categories: "Bitcoin Script"
categories_weight: 5
tags: ["Signature", "ECDSA", "DER"]
thumbnail: bitcoin-script-ECDSA-strict-DER.png
chartJS: bitcoin-script-ECDSA-strict-DER.js
images:
  - /img/chart-thumbnails/bitcoin-script-ECDSA-strict-DER.png
---

Shows the distribution of DER-encoded ECDSA signatures per day.
<!--more-->

Historically, ECDSA signatures in Bitcoin were valid when encoded in [ASN.1 BER](https://en.wikipedia.org/wiki/X.690#BER_encoding).
However, most of the signatures were valid under the stricter subset of the [DER](https://en.wikipedia.org/wiki/X.690#DER_encoding) encoding rules.
Only a few transactions between 2011 and 2013 included signatures not valid under the DER encoding rules. 

Bitcoin Core used OpenSSL to decode signatures.
But OpenSSL was not build to be used in consensus critical code and an update caused some nodes to reject the chain.
This lead to [BIP-66](https://github.com/bitcoin/bips/blob/master/bip-0066.mediawiki) which was activated in July 2015.
BIP-66 enforces that all ECDSA signatures must be strictly DER-encoded.
