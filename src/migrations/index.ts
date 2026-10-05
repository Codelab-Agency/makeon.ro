import * as migration_20261002_120914_initial from "./20261002_120914_initial";
import * as migration_20261002_121000_inventory_constraints from "./20261002_121000_inventory_constraints";
import * as migration_20261002_121759_r2_storage from "./20261002_121759_r2_storage";
import * as migration_20261002_134255 from "./20261002_134255";
import * as migration_20261005_113310_production_orders from "./20261005_113310_production_orders";
import * as migration_20261005_120000_restore_inventory_constraints from "./20261005_120000_restore_inventory_constraints";

// Append migrations in order; never rewrite the history of an applied migration.
export const migrations = [
  {
    up: migration_20261002_120914_initial.up,
    down: migration_20261002_120914_initial.down,
    name: "20261002_120914_initial",
  },
  {
    up: migration_20261002_121000_inventory_constraints.up,
    down: migration_20261002_121000_inventory_constraints.down,
    name: "20261002_121000_inventory_constraints",
  },
  {
    up: migration_20261002_121759_r2_storage.up,
    down: migration_20261002_121759_r2_storage.down,
    name: "20261002_121759_r2_storage",
  },
  {
    up: migration_20261002_134255.up,
    down: migration_20261002_134255.down,
    name: "20261002_134255",
  },
  {
    up: migration_20261005_113310_production_orders.up,
    down: migration_20261005_113310_production_orders.down,
    name: "20261005_113310_production_orders",
  },
  {
    up: migration_20261005_120000_restore_inventory_constraints.up,
    down: migration_20261005_120000_restore_inventory_constraints.down,
    name: "20261005_120000_restore_inventory_constraints",
  },
];
