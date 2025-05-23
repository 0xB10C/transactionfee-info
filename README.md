# mainnet-observer

This tool and website provides protocol-level statistics and insights about Bitcoin: blocks, transactions, script usage and more.
Powered by a Rust backend and Hugo-based frontend.

## Prerequisites

- a Bitcoin Core node with the full chain (not pruned) and the REST API enabled (start with `-rest` or add `rest=1` to bitcoin.conf)
- development tools `rustc`, `cargo`, and `hugo` installed or use the provided `nix-shell`

## Backend (in `./backend`)

The backend connects to a Bitcoin Core node and fetches blocks. For each block, stats are generated and written
into a sqlite database. Once all blocks are processed, the stats are aggregated and written into CSV files.

Example usage:

```
cargo run -- --rest-host 127.0.0.1 --rest-port 8332 --database-path .stats.db --csv-path ./csv
```

Note that a full run on mainnet will take multiple hours. The following runs will be incremental and
will only need to fetch new blocks.

```
Usage: mainnet-observer-backend [OPTIONS]

Options:
      --rest-host <REST_HOST>          Host part of the Bitcoin Core REST API endpoint [default: localhost]
      --rest-port <REST_PORT>          Port part of the Bitcoin Core REST API endpoint [default: 8332]
      --database-path <DATABASE_PATH>  Path to the SQLite database file where the stats are stored [default: ./db.sqlite]
      --csv-path <CSV_PATH>            Path where the CSV files should be written to [default: ./csv]
      --no-csv                         Flag to disable CSV file writing
      --no-stats                       Flag to disable stat generation
  -h, --help                           Print help
  -V, --version                        Print version
```

## Frontend (in `./frontend`)

The frontend consists of a [Hugo](gohugo.io) based site that's deployable as static HTML site.
The CSV files generated by the backend need to be copied to `frontend/static/csv` for development builds
or to `frontend/public/static/csv` after `hugo build`.

For development, Hugo can be used to launch an auto-refreshing websever with `hugo server --buildDrafts`.
It will display the URL its serving the page on. A production deployment can use `hugo build` to generate
a static HTML page in `public`. See the hugo tool for more build options.

To set the site title, base URL, and fill in some of the placeholders, either edit `frontend/config.toml`
or set the following ENV variables.

```
export HUGO_TITLE="mainnet-observer"
export HUGO_BASEURL="https://mainnet.observer/"
export HUGO_PARAMS_HTMLTOPRIGHT="HTML that appears in the <b>top right</b> corner"
export HUGO_PARAMS_HTMLBOTTOMRIGHT="HTML that appears in the <b>bottom right</b> corner"
```

### Generate Chart Thumbnails

The chart thumbnails are PNGs that need to be updated from time to time.
When hugo is started in `draft` mode, for example with `hugo serve -D`, on bottom of
the main page a "generate chart-thumbnails" button appears. Before clicking on this, make sure
you have up-to-date CSV files for the chart data. Clicking on the butten will open all chart
pages and will automatically generate and download thumbnails as PNGs. You might need to allow the
page to open "popup windows". Once all thumbnails are downloaded, remove the existing thumbnails in
`frontend/static/img/chart-thumbnails` and copy the newly downloaded thumbnails. Don't forget to run
`optipng frontend/static/img/chart-thumbnails/*` on them before adding them to Git.

## Nix package and NixOS module

There exists a Nix package and a NixOS module for mainnet-observer in https://github.com/0xb10c/nix.
See the [integration-test](https://github.com/0xB10C/nix/blob/master/tests/mainnet-observer.nix) for
an example usage of the frontend and backend.
