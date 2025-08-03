-- Worker Results tablosundaki task_id alanını nullable yap
ALTER TABLE worker_results ALTER COLUMN task_id DROP NOT NULL; 