-- Add primary keys first (required for foreign keys)
-- Note: This will fail if there are NULL or duplicate values in the ID columns

-- Add primary key to accounts (only if acct_id is not null and unique)
ALTER TABLE accounts
ADD CONSTRAINT pk_accounts PRIMARY KEY (acct_id);

-- Add primary key to clients (only if client_id is not null and unique)
ALTER TABLE clients
ADD CONSTRAINT pk_clients PRIMARY KEY (client_id);

-- Add primary key to tax_sales (only if tax_sale_id is not null and unique)
ALTER TABLE tax_sales
ADD CONSTRAINT pk_tax_sales PRIMARY KEY (tax_sale_id);

-- Add primary key to parcels (only if parcel_id is not null and unique)
ALTER TABLE parcels
ADD CONSTRAINT pk_parcels PRIMARY KEY (parcel_id);

-- Clean up orphaned records before adding foreign keys
-- Set orphaned foreign keys to NULL instead of deleting records

-- Set tax_sales.client_id to NULL where client doesn't exist
UPDATE tax_sales SET client_id = NULL WHERE client_id = 'TH101';

-- Set parcels.tax_sale_id to NULL where tax_sale doesn't exist
UPDATE parcels SET tax_sale_id = NULL WHERE tax_sale_id IN ('1', '99');

-- Now add foreign key constraints to connect tables
-- These will allow NULL values but enforce referential integrity for non-NULL values

-- Connect clients to accounts via acct_id
ALTER TABLE clients
ADD CONSTRAINT fk_clients_accounts
FOREIGN KEY (acct_id) REFERENCES accounts(acct_id);

-- Connect tax_sales to clients via client_id
ALTER TABLE tax_sales
ADD CONSTRAINT fk_tax_sales_clients
FOREIGN KEY (client_id) REFERENCES clients(client_id);

-- Connect parcels to tax_sales via tax_sale_id
ALTER TABLE parcels
ADD CONSTRAINT fk_parcels_tax_sales
FOREIGN KEY (tax_sale_id) REFERENCES tax_sales(tax_sale_id);
