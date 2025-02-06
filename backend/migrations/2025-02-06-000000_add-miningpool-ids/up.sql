-- The pool list starts with ID 1, so we can use 0 as the default here 
-- and for unknown pools too
-- https://github.com/bitcoin-data/mining-pools/blob/generated/pool-list.json
ALTER TABLE block_stats
    ADD COLUMN pool_id INTEGER NOT NULL DEFAULT (0);
