-- Migration 006: Audit trigger function + attach to all protected tables

CREATE OR REPLACE FUNCTION protected.audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO protected.audit_logs (
    id, tenant_id, table_name, record_id, action,
    old_values, new_values, performed_by, performed_at
  ) VALUES (
    gen_random_uuid(),
    COALESCE(
      NULLIF(current_setting('app.current_tenant', true), '')::UUID,
      CASE WHEN TG_OP = 'DELETE' THEN OLD.tenant_id ELSE NEW.tenant_id END
    ),
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    NULLIF(current_setting('app.current_user_id', true), '')::UUID,
    NOW()
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach audit triggers to all protected tables (except audit_logs itself)
CREATE TRIGGER audit_participants
  AFTER INSERT OR UPDATE OR DELETE ON protected.participants
  FOR EACH ROW EXECUTE FUNCTION protected.audit_trigger_fn();

CREATE TRIGGER audit_referrals
  AFTER INSERT OR UPDATE OR DELETE ON protected.referrals
  FOR EACH ROW EXECUTE FUNCTION protected.audit_trigger_fn();

CREATE TRIGGER audit_assessments
  AFTER INSERT OR UPDATE OR DELETE ON protected.assessments
  FOR EACH ROW EXECUTE FUNCTION protected.audit_trigger_fn();

CREATE TRIGGER audit_encounters
  AFTER INSERT OR UPDATE OR DELETE ON protected.encounters
  FOR EACH ROW EXECUTE FUNCTION protected.audit_trigger_fn();
