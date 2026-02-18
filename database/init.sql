-- Script de inicialização do banco de dados

-- Criar banco de dados se não existir
-- Execute este comando manualmente antes de rodar schema.sql:
-- CREATE DATABASE leo_db;

-- Conectar ao banco de dados e executar schema.sql
\c leo_db;

\i schema.sql
