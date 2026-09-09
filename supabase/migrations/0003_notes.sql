-- Свободные заметки по объявлению: скидки, условия сделки, любые цифры,
-- которым не нашлось отдельного поля.
alter table cars add column if not exists notes text;
