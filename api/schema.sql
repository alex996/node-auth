-- SQLite syntax https://www.sqlite.org/datatype3.html

create table if not exists users (
  id integer primary key autoincrement,
  name text not null,
  email text unique collate nocase not null,
  password_hash text not null, -- char(60)
  verified_at integer null
);

create table if not exists reset_tokens (
  id integer primary key autoincrement,
  user_id integer not null references users(id) on delete cascade,
  body blob not null,
  expired_at integer not null
);
