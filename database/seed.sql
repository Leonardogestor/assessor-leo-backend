-- Seed data para desenvolvimento

-- Usuário de exemplo (senha: 123456)
INSERT INTO users (id, name, email, password, phone) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Admin User', 'admin@leo.com', '$2b$10$rX7qH9YQZqZ3YqZ3YqZ3YuZ3YqZ3YqZ3YqZ3YqZ3YqZ3YqZ3YqZ3Y', '+5511999999999')
ON CONFLICT (email) DO NOTHING;

-- Perfil do usuário de exemplo
INSERT INTO user_profiles (user_id, bio, preferences) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Administrador do sistema', '{"theme": "dark", "notifications": true}')
ON CONFLICT (user_id) DO NOTHING;

-- Estados de onboarding
INSERT INTO onboarding_state (user_id, step, is_completed, completed_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'welcome', true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440000', 'profile_setup', true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440000', 'preferences', false, NULL)
ON CONFLICT (user_id, step) DO NOTHING;

-- Mensagens de exemplo
INSERT INTO messages (user_id, conversation_id, role, content, model, tokens_used) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'user', 'Olá, preciso de ajuda com minhas finanças', NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'assistant', 'Olá! Ficarei feliz em ajudar você a organizar suas finanças. Por onde gostaria de começar?', 'gpt-4', 45);

-- Transações de exemplo
INSERT INTO transactions (user_id, type, category, amount, description, transaction_date, tags) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'income', 'Salário', 5000.00, 'Salário mensal', CURRENT_DATE, ARRAY['trabalho', 'mensal']),
  ('550e8400-e29b-41d4-a716-446655440000', 'expense', 'Alimentação', 150.00, 'Supermercado', CURRENT_DATE, ARRAY['mercado', 'essencial']),
  ('550e8400-e29b-41d4-a716-446655440000', 'expense', 'Transporte', 80.00, 'Combustível', CURRENT_DATE, ARRAY['carro']);

-- Lembretes de exemplo
INSERT INTO reminders (user_id, title, description, reminder_date, priority) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Pagar conta de luz', 'Vencimento da conta de energia elétrica', CURRENT_DATE + INTERVAL '3 days', 'high'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Reunião de equipe', 'Reunião semanal com o time', CURRENT_DATE + INTERVAL '1 day', 'medium');

-- Log de automações
INSERT INTO automations_log (user_id, automation_type, action, status, execution_time_ms, triggered_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'financial_summary', 'generate_monthly_report', 'success', 1250, 'scheduled'),
  ('550e8400-e29b-41d4-a716-446655440000', 'reminder_notification', 'send_email', 'success', 320, 'system'),
  ('550e8400-e29b-41d4-a716-446655440000', 'data_backup', 'backup_user_data', 'failed', 5400, 'scheduled');
