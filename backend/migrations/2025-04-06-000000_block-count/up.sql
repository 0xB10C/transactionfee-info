-- A block_count column that is always 1. The SUM(block_count)
-- metric can then be used as the number of blocks per day.
ALTER TABLE block_stats
  ADD COLUMN block_count INTEGER NOT NULL DEFAULT (1);
