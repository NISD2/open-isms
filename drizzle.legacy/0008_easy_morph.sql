ALTER TABLE "asset" DROP CONSTRAINT "asset_company_id_company_id_fk";
--> statement-breakpoint
ALTER TABLE "incident" DROP CONSTRAINT "incident_company_id_company_id_fk";
--> statement-breakpoint
ALTER TABLE "incident" DROP CONSTRAINT "incident_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "risk" DROP CONSTRAINT "risk_company_id_company_id_fk";
--> statement-breakpoint
ALTER TABLE "risk" DROP CONSTRAINT "risk_accepted_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "supplier" DROP CONSTRAINT "supplier_customer_company_id_company_id_fk";
--> statement-breakpoint
ALTER TABLE "supplier" DROP CONSTRAINT "supplier_supplier_company_id_company_id_fk";
