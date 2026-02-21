const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ── Token helpers ─────────────────────────────────────────────────────────────
const getToken   = () => localStorage.getItem('token');
const authHeader = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

// ── Status adapters ───────────────────────────────────────────────────────────
// Backend uses SCREAMING_SNAKE_CASE; frontend uses "Title Case with spaces"
const TO_DISPLAY = {
  AVAILABLE:       'Available',
  ON_TRIP:         'On Trip',
  IN_SHOP:         'In Shop',
  OUT_OF_SERVICE:  'Out of Service',
  ON_DUTY:         'On Duty',
  OFF_DUTY:        'Off Duty',
  SUSPENDED:       'Suspended',
  DRAFT:           'Draft',
  DISPATCHED:      'Dispatched',
  COMPLETED:       'Completed',
  CANCELLED:       'Cancelled',
};

export const TO_API = Object.fromEntries(
  Object.entries(TO_DISPLAY).map(([k, v]) => [v, k])
);

// ── Entity adapters (backend → frontend shape) ────────────────────────────────

export const adaptVehicle = v => ({
  id:       String(v.id),
  name:     v.name,
  plate:    v.licensePlate,
  type:     v.type,
  capacity: Number(v.maxCapacityKg),
  odometer: Number(v.odometerKm),
  region:   v.region || 'North',
  status:   TO_DISPLAY[v.status] || v.status,
  acqCost:  0,           // field not in schema; placeholder for analytics
  year:     new Date(v.createdAt).getFullYear(),
  isRetired: v.isRetired,
});

export const adaptDriver = d => ({
  id:       String(d.id),
  name:     d.fullName,
  license:  d.licenseNumber,
  expiry:   d.licenseExpiryDate
              ? new Date(d.licenseExpiryDate).toISOString().slice(0, 10)
              : '',
  category: d.licenseCategory || '',
  status:   TO_DISPLAY[d.status] || d.status,
  score:    d.safetyScore ? Number(d.safetyScore) : 85,
  phone:    d.phone || '',
  trips:    d._count?.trips ?? 0,
});

export const adaptTrip = t => ({
  id:        t.referenceCode,          // display / state key
  _dbId:     t.id,                     // numeric id for PATCH calls
  vehicleId: String(t.vehicleId),
  driverId:  String(t.driverId),
  origin:    t.origin,
  dest:      t.destination,
  cargo:     Number(t.cargoWeightKg),
  revenue:   t.revenueAmount ? Number(t.revenueAmount) : 0,
  km:        t.distanceKm    ? Number(t.distanceKm)    : 0,
  status:    TO_DISPLAY[t.status] || t.status,
  date:      t.departureAt
               ? new Date(t.departureAt).toISOString().slice(0, 10)
               : new Date(t.createdAt).toISOString().slice(0, 10),
  notes:     t.notes || '',
});

export const adaptMaintenance = m => ({
  id:        String(m.id),
  vehicleId: String(m.vehicleId),
  type:      m.serviceType,
  date:      new Date(m.serviceDate).toISOString().slice(0, 10),
  cost:      m.cost ? Number(m.cost) : 0,
  notes:     m.description || '',
  // Derive status from resolvedAt (no status enum in schema)
  status:    m.resolvedAt ? 'Completed' : 'In Progress',
});

export const adaptFuelLog = f => ({
  id:        String(f.id),
  vehicleId: String(f.vehicleId),
  liters:    Number(f.liters),
  cost:      Number(f.totalCost),
  date:      new Date(f.filledAt).toISOString().slice(0, 10),
  km:        f.odometerDelta ? Number(f.odometerDelta) : 0,
});

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  localStorage.setItem('token', data.token);
  return data.user; // { id, name, email, role }
}

export function logout() {
  localStorage.removeItem('token');
}

// ── Vehicles ──────────────────────────────────────────────────────────────────

export async function getVehicles(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/vehicles${qs ? '?' + qs : ''}`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load vehicles');
  return data.map(adaptVehicle);
}

export async function createVehicle(form) {
  const res = await fetch(`${API_URL}/api/vehicles`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({
      name:          form.name,
      model:         form.name,              // model = name until separate field added
      type:          form.type,
      region:        form.region,
      licensePlate:  form.plate,
      maxCapacityKg: Number(form.capacity),
      odometerKm:    Number(form.odometer) || 0,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create vehicle');
  return adaptVehicle(data);
}

export async function updateVehicle(id, form) {
  const res = await fetch(`${API_URL}/api/vehicles/${id}`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({
      name:          form.name,
      model:         form.name,
      type:          form.type,
      region:        form.region,
      licensePlate:  form.plate,
      maxCapacityKg: Number(form.capacity),
      odometerKm:    Number(form.odometer) || 0,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update vehicle');
  return adaptVehicle(data);
}

export async function deleteVehicle(id) {
  const res = await fetch(`${API_URL}/api/vehicles/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to delete vehicle');
  }
}

export async function setVehicleRetired(id, retire) {
  const res = await fetch(`${API_URL}/api/vehicles/${id}`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(
      retire
        ? { status: 'OUT_OF_SERVICE', isRetired: true }
        : { status: 'AVAILABLE',      isRetired: false }
    ),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update vehicle status');
  return adaptVehicle(data);
}

// ── Drivers ───────────────────────────────────────────────────────────────────

export async function getDrivers(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/drivers${qs ? '?' + qs : ''}`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load drivers');
  return data.map(adaptDriver);
}

export async function createDriver(form) {
  const res = await fetch(`${API_URL}/api/drivers`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({
      fullName:          form.name,
      licenseNumber:     form.license,
      licenseExpiryDate: form.expiry,
      licenseCategory:   form.category,
      phone:             form.phone || null,
      safetyScore:       Number(form.score) || null,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create driver');
  return adaptDriver(data);
}

export async function updateDriverStatus(id, displayStatus) {
  const res = await fetch(`${API_URL}/api/drivers/${id}/status`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ status: TO_API[displayStatus] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update driver status');
  return adaptDriver(data);
}

// ── Trips ─────────────────────────────────────────────────────────────────────

export async function getTrips(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/trips${qs ? '?' + qs : ''}`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load trips');
  return data.map(adaptTrip);
}

export async function createTrip(form, asDraft = true) {
  const refCode = 'TR' + Date.now().toString(36).toUpperCase();
  const res = await fetch(`${API_URL}/api/trips`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({
      referenceCode: refCode,
      origin:        form.origin,
      destination:   form.dest,
      cargoWeightKg: Number(form.cargo),
      vehicleId:     Number(form.vehicleId),
      driverId:      Number(form.driverId),
      revenueAmount: form.revenue ? Number(form.revenue) : null,
      notes:         form.notes || null,
      asDraft,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create trip');
  return adaptTrip(data);
}

export async function updateTripStatus(trip, displayStatus) {
  // trip must have ._dbId (numeric DB id) from adaptTrip
  const res = await fetch(`${API_URL}/api/trips/${trip._dbId}/status`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ status: TO_API[displayStatus] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update trip status');
  return adaptTrip(data);
}

// ── Maintenance ───────────────────────────────────────────────────────────────

export async function getMaintenance(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/maintenance${qs ? '?' + qs : ''}`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load maintenance logs');
  return data.map(adaptMaintenance);
}

export async function createMaintenance(form) {
  const res = await fetch(`${API_URL}/api/maintenance`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({
      vehicleId:   Number(form.vehicleId),
      serviceType: form.type,
      description: form.notes || null,
      cost:        Number(form.cost),
      serviceDate: form.date || null,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create maintenance log');
  return adaptMaintenance(data);
}

export async function completeMaintenance(id) {
  const res = await fetch(`${API_URL}/api/maintenance/${id}/complete`, {
    method: 'PATCH',
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to complete maintenance');
  return adaptMaintenance(data);
}

// ── Fuel Logs ─────────────────────────────────────────────────────────────────

export async function getFuelLogs(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/fuel${qs ? '?' + qs : ''}`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load fuel logs');
  return data.map(adaptFuelLog);
}

export async function createFuelLog(form) {
  const liters    = Number(form.liters);
  const totalCost = Number(form.cost);
  const res = await fetch(`${API_URL}/api/fuel`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({
      vehicleId:     Number(form.vehicleId),
      liters,
      pricePerLiter: liters > 0 ? totalCost / liters : 0,
      totalCost,
      odometerDelta: form.km ? Number(form.km) : null,
      filledAt:      form.date || null,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create fuel log');
  return adaptFuelLog(data);
}
