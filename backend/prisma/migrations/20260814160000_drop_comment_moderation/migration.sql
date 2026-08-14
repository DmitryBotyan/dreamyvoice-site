-- Модерация комментариев убрана: они публикуются сразу, админ может только удалять.
-- Ранее отклонённые комментарии удаляем — иначе после снятия статуса они снова
-- стали бы публичными, хотя админ уже решил их скрыть.
DELETE FROM "comments" WHERE "status" = 'REJECTED';

ALTER TABLE "comments" DROP COLUMN "status";

DROP TYPE "CommentStatus";
