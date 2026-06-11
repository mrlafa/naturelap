const notImplementedResult = {
  success: false,
  copied: 0,
  skipped: 0,
  errors: ['Booking migration is not implemented yet.'],
};

export async function migrateHostelsDevToLive() {
  return notImplementedResult;
}

export async function migrateBookingsDevToLive() {
  return migrateHostelsDevToLive();
}