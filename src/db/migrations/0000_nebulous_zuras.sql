CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`trade_name` text,
	`document` text NOT NULL,
	`email` text,
	`phone` text,
	`address` text,
	`city` text,
	`state` text,
	`zip_code` text,
	`logo_url` text,
	`plan` text DEFAULT 'STARTER' NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_companies_document` ON `companies` (`document`);--> statement-breakpoint
CREATE INDEX `idx_companies_status` ON `companies` (`status`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'MECHANIC' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_company_id` ON `users` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`role`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`company_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user_id` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_company_id` ON `sessions` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_expires_at` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text,
	`old_data` text,
	`new_data` text,
	`ip` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_audit_company_id` ON `audit_logs` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_user_id` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_entity` ON `audit_logs` (`entity`);--> statement-breakpoint
CREATE INDEX `idx_audit_action` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `idx_audit_created_at` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`document` text,
	`phone` text,
	`whatsapp` text,
	`email` text,
	`address` text,
	`city` text,
	`state` text,
	`zip_code` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_customers_company_id` ON `customers` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_customers_document` ON `customers` (`document`);--> statement-breakpoint
CREATE INDEX `idx_customers_name` ON `customers` (`name`);--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`plate` text NOT NULL,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`year` integer,
	`version` text,
	`fuel_type` text,
	`mileage` integer DEFAULT 0,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_vehicles_company_id` ON `vehicles` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_vehicles_customer_id` ON `vehicles` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_vehicles_plate` ON `vehicles` (`plate`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`base_price_cents` integer DEFAULT 0 NOT NULL,
	`estimated_minutes` integer DEFAULT 60,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_services_company_id` ON `services` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_services_name` ON `services` (`name`);--> statement-breakpoint
CREATE INDEX `idx_services_category` ON `services` (`category`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`legal_name` text NOT NULL,
	`trade_name` text,
	`document` text,
	`phone` text,
	`whatsapp` text,
	`email` text,
	`address` text,
	`city` text,
	`state` text,
	`zip_code` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_suppliers_company_id` ON `suppliers` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_suppliers_document` ON `suppliers` (`document`);--> statement-breakpoint
CREATE INDEX `idx_suppliers_legal_name` ON `suppliers` (`legal_name`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`sku_code` text,
	`manufacturer` text,
	`category` text,
	`unit` text DEFAULT 'UN' NOT NULL,
	`cost_price_cents` integer DEFAULT 0 NOT NULL,
	`sale_price_cents` integer DEFAULT 0 NOT NULL,
	`stock_quantity` integer DEFAULT 0 NOT NULL,
	`min_stock` integer DEFAULT 0 NOT NULL,
	`location` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_products_company_id` ON `products` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_products_sku_code` ON `products` (`sku_code`);--> statement-breakpoint
CREATE INDEX `idx_products_name` ON `products` (`name`);--> statement-breakpoint
CREATE INDEX `idx_products_category` ON `products` (`category`);--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`product_id` text NOT NULL,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_cost_cents` integer DEFAULT 0,
	`reference_type` text,
	`reference_id` text,
	`user_id` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_stock_company_id` ON `stock_movements` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_stock_product_id` ON `stock_movements` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_stock_type` ON `stock_movements` (`type`);--> statement-breakpoint
CREATE INDEX `idx_stock_created_at` ON `stock_movements` (`created_at`);--> statement-breakpoint
CREATE TABLE `quote_items` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`quote_id` text NOT NULL,
	`type` text NOT NULL,
	`service_id` text,
	`product_id` text,
	`description` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_quote_items_quote_id` ON `quote_items` (`quote_id`);--> statement-breakpoint
CREATE INDEX `idx_quote_items_company_id` ON `quote_items` (`company_id`);--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`quote_number` integer NOT NULL,
	`customer_id` text NOT NULL,
	`vehicle_id` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`valid_until` integer,
	`notes` text,
	`subtotal_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`converted_to_work_order_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_quotes_company_id` ON `quotes` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_quotes_customer_id` ON `quotes` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_quotes_vehicle_id` ON `quotes` (`vehicle_id`);--> statement-breakpoint
CREATE INDEX `idx_quotes_status` ON `quotes` (`status`);--> statement-breakpoint
CREATE INDEX `idx_quotes_number` ON `quotes` (`company_id`,`quote_number`);--> statement-breakpoint
CREATE TABLE `work_order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`work_order_id` text NOT NULL,
	`type` text NOT NULL,
	`service_id` text,
	`product_id` text,
	`assigned_user_id` text,
	`description` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_wo_items_order_id` ON `work_order_items` (`work_order_id`);--> statement-breakpoint
CREATE INDEX `idx_wo_items_company_id` ON `work_order_items` (`company_id`);--> statement-breakpoint
CREATE TABLE `work_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`order_number` integer NOT NULL,
	`customer_id` text NOT NULL,
	`vehicle_id` text,
	`assigned_user_id` text,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`notes` text,
	`internal_notes` text,
	`subtotal_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`delivered_at` integer,
	`from_quote_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_wo_company_id` ON `work_orders` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_wo_customer_id` ON `work_orders` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_wo_vehicle_id` ON `work_orders` (`vehicle_id`);--> statement-breakpoint
CREATE INDEX `idx_wo_assigned_user` ON `work_orders` (`assigned_user_id`);--> statement-breakpoint
CREATE INDEX `idx_wo_status` ON `work_orders` (`status`);--> statement-breakpoint
CREATE INDEX `idx_wo_number` ON `work_orders` (`company_id`,`order_number`);--> statement-breakpoint
CREATE TABLE `purchase_items` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`purchase_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_cost_cents` integer DEFAULT 0 NOT NULL,
	`total_cost_cents` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_purchase_items_purchase_id` ON `purchase_items` (`purchase_id`);--> statement-breakpoint
CREATE INDEX `idx_purchase_items_product_id` ON `purchase_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_purchase_items_company_id` ON `purchase_items` (`company_id`);--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`purchase_number` integer NOT NULL,
	`supplier_id` text NOT NULL,
	`invoice_number` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`purchase_date` integer NOT NULL,
	`subtotal_cents` integer DEFAULT 0 NOT NULL,
	`freight_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`payment_terms` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_purchases_company_id` ON `purchases` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_purchases_supplier_id` ON `purchases` (`supplier_id`);--> statement-breakpoint
CREATE INDEX `idx_purchases_invoice` ON `purchases` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `financial_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`amount_cents` integer DEFAULT 0 NOT NULL,
	`paid_amount_cents` integer DEFAULT 0,
	`due_date` integer NOT NULL,
	`paid_at` integer,
	`reference_type` text,
	`reference_id` text,
	`customer_id` text,
	`supplier_id` text,
	`payment_method` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_fin_company_id` ON `financial_transactions` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_fin_type` ON `financial_transactions` (`type`);--> statement-breakpoint
CREATE INDEX `idx_fin_status` ON `financial_transactions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_fin_due_date` ON `financial_transactions` (`due_date`);--> statement-breakpoint
CREATE INDEX `idx_fin_ref` ON `financial_transactions` (`reference_type`,`reference_id`);--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`storage_key` text NOT NULL,
	`uploaded_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_attachments_company_id` ON `attachments` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_attachments_entity` ON `attachments` (`entity_type`,`entity_id`);